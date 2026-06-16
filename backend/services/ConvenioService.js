import axios from 'axios';
import Convenio from '../models/Convenio.js';

const API_G9_URL = 'http://localhost:3009/api/convenio';
const CACHE_TTL = 3600000; // 1 hora

class ConvenioService {
    constructor() {
        this.cache = new Map();
        this.circuitBreaker = {
            failures: 0,
            lastFailureTime: null,
            isOpen: false,
            threshold: 5,
            cooldown: 60000 // 60 segundos
        };
    }

    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            api: 'G9-Convênios',
            message,
            ...data
        };
        console.log(JSON.stringify(logEntry));
    }

    async callApiWithRetry(endpoint, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(endpoint, { timeout: 5000 });
                return response.data;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    validateSchema(data) {
        const schema = {
            idconvenio: { required: true, type: 'number' },
            nome: { required: true, type: 'string', minLength: 3, maxLength: 100 },
            cnpj: { required: true, type: 'string', pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/ },
            tipo: { required: true, type: 'string', enum: ['PARTICIPAR', 'NAO_PARTICIPAR'] },
            cobertura_exames: { required: true, type: 'number', min: 0, max: 100 },
            cobertura_internacoes: { required: true, type: 'number', min: 0, max: 100 },
            valor_maximo_automatico: { required: true, type: 'number', min: 0 },
            requer_autorizacao: { required: true, type: 'boolean' }
        };

        // Validar campos obrigatórios
        for (const [field, rules] of Object.entries(schema)) {
            if (rules.required && data[field] === undefined) {
                this.log('ERROR', `Campo obrigatório ausente: ${field}`, { data });
                return null;
            }

            if (data[field] !== undefined) {
                // Validar tipo
                if (rules.type === 'number' && typeof data[field] !== 'number') {
                    this.log('ERROR', `Tipo inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                if (rules.type === 'string' && typeof data[field] !== 'string') {
                    this.log('ERROR', `Tipo inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                if (rules.type === 'boolean' && typeof data[field] !== 'boolean') {
                    this.log('ERROR', `Tipo inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                // Validar pattern
                if (rules.pattern && !rules.pattern.test(data[field])) {
                    this.log('ERROR', `Pattern inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                // Validar enum
                if (rules.enum && !rules.enum.includes(data[field])) {
                    this.log('ERROR', `Valor inválido para campo ${field}`, { field, value: data[field], allowed: rules.enum });
                    return null;
                }

                // Validar min
                if (rules.min !== undefined && data[field] < rules.min) {
                    this.log('ERROR', `Valor abaixo do mínimo para campo ${field}`, { field, value: data[field], min: rules.min });
                    return null;
                }

                // Validar max
                if (rules.max !== undefined && data[field] > rules.max) {
                    this.log('ERROR', `Valor acima do máximo para campo ${field}`, { field, value: data[field], max: rules.max });
                    return null;
                }

                // Validar minLength
                if (rules.minLength && data[field].length < rules.minLength) {
                    this.log('ERROR', `Valor muito curto para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                // Validar maxLength
                if (rules.maxLength && data[field].length > rules.maxLength) {
                    this.log('ERROR', `Valor muito longo para campo ${field}`, { field, value: data[field] });
                    return null;
                }
            }
        }

        return data;
    }

    async getMockData(id) {
        try {
            const convenio = await Convenio.findByPk(id);
            if (convenio) {
                this.log('WARN', 'Usando dados mock locais', { id, dataSource: 'local_mock' });
                return convenio.toJSON();
            }
            return null;
        } catch (error) {
            this.log('ERROR', 'Erro ao buscar dados mock', { id, error: error.message });
            return null;
        }
    }

    async buscarConvenio(id) {
        // Verificar cache
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            this.log('INFO', 'Dados recuperados do cache', { id });
            return cached.data;
        }

        // Verificar circuit breaker
        if (this.circuitBreaker.isOpen) {
            if (Date.now() - this.circuitBreaker.lastFailureTime < this.circuitBreaker.cooldown) {
                this.log('WARN', 'Circuit breaker aberto, usando mock', { id });
                return await this.getMockData(id);
            } else {
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failures = 0;
            }
        }

        // Tentar chamada de API
        try {
            const data = await this.callApiWithRetry(`${API_G9_URL}/${id}`);
            const validated = this.validateSchema(data);
            
            if (!validated) {
                throw new Error('Dados inválidos recebidos da API');
            }

            // Cache dos dados
            this.cache.set(id, { data: validated, timestamp: Date.now() });
            
            this.circuitBreaker.failures = 0;
            this.log('INFO', 'Dados obtidos com sucesso da API G9', { id });
            return validated;
        } catch (error) {
            this.circuitBreaker.failures++;
            this.circuitBreaker.lastFailureTime = Date.now();
            
            if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
                this.circuitBreaker.isOpen = true;
                this.log('ERROR', 'Circuit breaker aberto', { failures: this.circuitBreaker.failures });
            }

            this.log('ERROR', 'Falha na chamada de API G9', { id, error: error.message, retryCount: 3 });
            
            // Fallback para mock
            return await this.getMockData(id);
        }
    }

    async validarCobertura(idconvenio, tipoProcedimento, valor) {
        try {
            const convenio = await this.buscarConvenio(idconvenio);
            if (!convenio) {
                return { valido: false, motivo: 'Convênio não encontrado' };
            }

            const cobertura = tipoProcedimento === 'EXAME' 
                ? parseFloat(convenio.cobertura_exames) 
                : parseFloat(convenio.cobertura_internacoes);

            const valorMaximo = parseFloat(convenio.valor_maximo_automatico);

            if (cobertura >= 100) {
                return { valido: true, motivo: 'Cobertura total do convênio' };
            }

            if (valor <= valorMaximo) {
                return { valido: true, motivo: 'Valor dentro do limite automático' };
            }

            return { valido: false, motivo: 'Valor acima do limite automático' };
        } catch (error) {
            this.log('ERROR', 'Erro ao validar cobertura', { idconvenio, tipoProcedimento, valor, error: error.message });
            return { valido: false, motivo: 'Erro ao validar cobertura' };
        }
    }

    async healthCheck() {
        try {
            await this.callApiWithRetry(`${API_G9_URL}/1`, 1, 1000);
            return true;
        } catch (error) {
            throw new Error('API G9 indisponível');
        }
    }
}

export default new ConvenioService();
