import axios from 'axios';
import Paciente from '../models/Paciente.js';

const API_G1_URL = process.env.API_G1_URL || 'https://pacientes-1a6g.onrender.com/paciente';
const CACHE_TTL = 1800000; // 30 minutos

class PacienteService {
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
            api: 'G1-Pacientes',
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
            idpaciente: { required: true, type: 'number' },
            nome: { required: true, type: 'string', minLength: 3, maxLength: 100 },
            cpf: { required: true, type: 'string', pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ },
            data_nascimento: { required: true, type: 'string', format: 'YYYY-MM-DD' },
            telefone: { required: false, type: 'string' },
            email: { required: false, type: 'string' }
        };

        // Validar campos obrigatórios
        for (const [field, rules] of Object.entries(schema)) {
            if (rules.required && !data[field]) {
                this.log('ERROR', `Campo obrigatório ausente: ${field}`, { data });
                return null;
            }

            if (data[field]) {
                // Validar tipo
                if (rules.type === 'number' && typeof data[field] !== 'number') {
                    this.log('ERROR', `Tipo inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                // Validar string
                if (rules.type === 'string' && typeof data[field] !== 'string') {
                    this.log('ERROR', `Tipo inválido para campo ${field}`, { field, value: data[field] });
                    return null;
                }

                // Validar pattern
                if (rules.pattern && !rules.pattern.test(data[field])) {
                    this.log('ERROR', `Pattern inválido para campo ${field}`, { field, value: data[field] });
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
            const paciente = await Paciente.findByPk(id);
            if (paciente) {
                this.log('WARN', 'Usando dados mock locais', { id, dataSource: 'local_mock' });
                return paciente.toJSON();
            }
            return null;
        } catch (error) {
            this.log('ERROR', 'Erro ao buscar dados mock', { id, error: error.message });
            return null;
        }
    }

    async buscarPaciente(id) {
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
            const data = await this.callApiWithRetry(`${API_G1_URL}/${id}`);
            const validated = this.validateSchema(data);
            
            if (!validated) {
                throw new Error('Dados inválidos recebidos da API');
            }

            // Cache dos dados
            this.cache.set(id, { data: validated, timestamp: Date.now() });
            
            this.circuitBreaker.failures = 0;
            this.log('INFO', 'Dados obtidos com sucesso da API G1', { id });
            return validated;
        } catch (error) {
            this.circuitBreaker.failures++;
            this.circuitBreaker.lastFailureTime = Date.now();
            
            if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
                this.circuitBreaker.isOpen = true;
                this.log('ERROR', 'Circuit breaker aberto', { failures: this.circuitBreaker.failures });
            }

            this.log('ERROR', 'Falha na chamada de API G1', { id, error: error.message, retryCount: 3 });
            
            // Fallback para mock
            return await this.getMockData(id);
        }
    }

    async buscarPacientePorCPF(cpf) {
        try {
            const data = await this.callApiWithRetry(`${API_G1_URL}/cpf/${cpf}`);
            const validated = this.validateSchema(data);
            
            if (!validated) {
                throw new Error('Dados inválidos recebidos da API');
            }

            this.log('INFO', 'Paciente encontrado por CPF', { cpf });
            return validated;
        } catch (error) {
            this.log('ERROR', 'Falha ao buscar paciente por CPF', { cpf, error: error.message });
            
            // Fallback para mock local
            try {
                const paciente = await Paciente.findOne({ where: { cpf } });
                if (paciente) {
                    this.log('WARN', 'Usando dados mock locais por CPF', { cpf });
                    return paciente.toJSON();
                }
            } catch (mockError) {
                this.log('ERROR', 'Erro ao buscar mock por CPF', { cpf, error: mockError.message });
            }
            
            return null;
        }
    }

    async healthCheck() {
        try {
            await this.callApiWithRetry(`${API_G1_URL}/1`, 1, 1000);
            return true;
        } catch (error) {
            throw new Error('API G1 indisponível');
        }
    }
}

export default new PacienteService();
