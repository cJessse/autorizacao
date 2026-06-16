import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import api from '../app.js';
import banco from '../config/database.js';
import Paciente from '../models/Paciente.js';
import Convenio from '../models/Convenio.js';
import RegraConvenio from '../models/RegraConvenio.js';
import Autorizacao from '../models/Autorizacao.js';
import PacienteService from '../services/PacienteService.js';
import ConvenioService from '../services/ConvenioService.js';
import axios from 'axios';

// Mock do axios
vi.mock('axios');

const JWT_SECRET = 'autorizacao_secret_key_2024';
const adminToken = 'Bearer ' + jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = 'Bearer ' + jwt.sign({ username: 'usuario', role: 'usuario' }, JWT_SECRET, { expiresIn: '1h' });
const expiredToken = 'Bearer ' + jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '-10s' });
const badSigToken = 'Bearer ' + jwt.sign({ username: 'admin', role: 'admin' }, 'wrong_secret', { expiresIn: '1h' });

// Mock dados de retorno da API G1
const apiPacienteValido = {
    idpaciente: 1,
    nome: 'João Silva',
    cpf: '123.456.789-00',
    data_nascimento: '1980-01-15',
    telefone: '11999999999',
    email: 'joao@email.com'
};

const apiPacienteCorrompido = {
    idpaciente: 'invalido_id',
    nome: 'J',
    cpf: '12345678900' // Formato errado
};

// Mock dados de retorno da API G9
const apiConvenioUnimed = {
    idconvenio: 1,
    nome: 'Unimed',
    cnpj: '12.345.678/0001-90',
    tipo: 'PARTICIPAR',
    cobertura_exames: 80.00,
    cobertura_internacoes: 90.00,
    valor_maximo_automatico: 5000.00,
    requer_autorizacao: true
};

const apiConvenioSemAutorizacao = {
    idconvenio: 2,
    nome: 'Bradesco Saúde',
    cnpj: '98.765.432/0001-10',
    tipo: 'PARTICIPAR',
    cobertura_exames: 100.00,
    cobertura_internacoes: 100.00,
    valor_maximo_automatico: 10000.00,
    requer_autorizacao: false
};

const apiConvenioCoberturaTotal = {
    idconvenio: 4,
    nome: 'Amil',
    cnpj: '11.222.333/0001-44',
    tipo: 'PARTICIPAR',
    cobertura_exames: 100.00,
    cobertura_internacoes: 100.00,
    valor_maximo_automatico: 1000.00,
    requer_autorizacao: true
};

beforeAll(async () => {
    // Sincronizar banco de dados para os testes
    await banco.sync({ force: true });
});

beforeEach(async () => {
    // Limpar tabelas
    await Autorizacao.destroy({ where: {}, truncate: { cascade: true } });
    await RegraConvenio.destroy({ where: {}, truncate: { cascade: true } });
    await Paciente.destroy({ where: {}, truncate: { cascade: true } });
    await Convenio.destroy({ where: {}, truncate: { cascade: true } });

    // Popular tabelas locais com dados fictícios para fallbacks e regras
    await Paciente.bulkCreate([
        { idpaciente: 1, nome: 'João Silva (Mock)', cpf: '123.456.789-00', data_nascimento: '1980-01-15' },
        { idpaciente: 2, nome: 'Maria Santos (Mock)', cpf: '987.654.321-00', data_nascimento: '1990-05-20' },
        { idpaciente: 3, nome: 'Pedro Oliveira (Mock)', cpf: '456.789.123-00', data_nascimento: '1975-10-30' }
    ]);

    await Convenio.bulkCreate([
        { idconvenio: 1, nome: 'Unimed (Mock)', cnpj: '12.345.678/0001-90', tipo: 'PARTICIPAR', cobertura_exames: 80.00, cobertura_internacoes: 90.00, valor_maximo_automatico: 5000.00, requer_autorizacao: true },
        { idconvenio: 2, nome: 'Bradesco Saúde (Mock)', cnpj: '98.765.432/0001-10', tipo: 'PARTICIPAR', cobertura_exames: 100.00, cobertura_internacoes: 100.00, valor_maximo_automatico: 10000.00, requer_autorizacao: false },
        { idconvenio: 3, nome: 'SulAmérica (Mock)', cnpj: '45.678.912/0001-23', tipo: 'NAO_PARTICIPAR', cobertura_exames: 70.00, cobertura_internacoes: 80.00, valor_maximo_automatico: 3000.00, requer_autorizacao: true }
    ]);

    await RegraConvenio.bulkCreate([
        { idregra: 1, idconvenio: 1, tipo_procedimento: 'EXAME', valor_maximo: 2000.00, descricao: 'Exames simples até R$ 2.000,00' },
        { idregra: 2, idconvenio: 1, tipo_procedimento: 'INTERNACAO', valor_maximo: 5000.00, descricao: 'Internações até R$ 5.000,00' },
        { idregra: 3, idconvenio: 2, tipo_procedimento: 'EXAME', valor_maximo: 10000.00, descricao: 'Exames até R$ 10.000,00' },
        { idregra: 4, idconvenio: 2, tipo_procedimento: 'INTERNACAO', valor_maximo: 10000.00, descricao: 'Internações até R$ 10.000,00' },
        { idregra: 5, idconvenio: 3, tipo_procedimento: 'EXAME', valor_maximo: 1500.00, descricao: 'Exames simples até R$ 1.500,00' },
        { idregra: 6, idconvenio: 3, tipo_procedimento: 'INTERNACAO', valor_maximo: 3000.00, descricao: 'Internações até R$ 3.000,00' }
    ]);

    // Limpar cache e circuit breakers dos serviços
    PacienteService.cache.clear();
    PacienteService.circuitBreaker = {
        failures: 0,
        lastFailureTime: null,
        isOpen: false,
        threshold: 5,
        cooldown: 60000
    };

    ConvenioService.cache.clear();
    ConvenioService.circuitBreaker = {
        failures: 0,
        lastFailureTime: null,
        isOpen: false,
        threshold: 5,
        cooldown: 60000
    };

    vi.restoreAllMocks();
    vi.resetAllMocks();
});

describe('1. Testes de Autenticação', () => {
    it('1.1 Login com Credenciais Inválidas', async () => {
        const res = await request(api)
            .post('/api/auth/login')
            .send({ username: 'usuario_inexistente', password: 'password123' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciais inválidas');
    });

    it('1.2 Login com Senha Incorreta', async () => {
        const res = await request(api)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'senha_errada' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Credenciais inválidas');
    });

    it('1.3 Login sem Credenciais', async () => {
        const res = await request(api)
            .post('/api/auth/login')
            .send({ username: '' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username e password são obrigatórios');
    });

    it('1.4 Token JWT Expirado', async () => {
        const res = await request(api)
            .get('/api/autorizacao')
            .set('Authorization', expiredToken);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token expirado');
    });

    it('1.5 Token JWT Inválido', async () => {
        const res = await request(api)
            .get('/api/autorizacao')
            .set('Authorization', 'Bearer invalidtokenhere');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token inválido');
    });

    it('1.6 Token JWT Ausente', async () => {
        const res = await request(api)
            .get('/api/autorizacao');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token não fornecido');
    });

    it('1.7 Token JWT Assinatura Inválida', async () => {
        const res = await request(api)
            .get('/api/autorizacao')
            .set('Authorization', badSigToken);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Assinatura inválida');
    });
});

describe('2. Testes de Autorização de Acesso (RBAC)', () => {
    it('2.1 Usuário comum tenta deletar autorização', async () => {
        // Criar uma autorização pendente
        const authDoc = await Autorizacao.create({
            numero_protocolo: 'AUT-2024-TEST',
            idpaciente: 1,
            idconvenio: 1,
            tipo_procedimento: 'EXAME',
            codigo_procedimento: 'EX001',
            descricao_procedimento: 'Teste',
            data_solicitacao: '2024-01-15',
            medico_solicitante: 'Dr. Teste',
            crm_medico: '1234-SP',
            status: 'PENDENTE'
        });

        const res = await request(api)
            .delete(`/api/autorizacao/${authDoc.idautorizacao}`)
            .set('Authorization', userToken);
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Permissão negada');
    });

    it('2.2 Usuário comum tenta registrar decisão manual', async () => {
        const res = await request(api)
            .put('/api/autorizacao/1/decisao')
            .set('Authorization', userToken)
            .send({ status: 'APROVADO', decisao_motivo: 'Decisão do teste' });
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Permissão negada');
    });

    it('2.3 Acesso a recurso inexistente', async () => {
        const res = await request(api)
            .get('/api/autorizacao/99999')
            .set('Authorization', adminToken);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Autorização não encontrada');
    });
});

describe('3 & 12. Testes de Validação de Dados & Edge Cases', () => {
    const validBody = {
        idpaciente: 1,
        idconvenio: 1,
        tipo_procedimento: 'EXAME',
        codigo_procedimento: 'EX001',
        descricao_procedimento: 'Exame de Teste',
        data_prevista: '2026-12-30',
        medico_solicitante: 'Dr. John Doe',
        crm_medico: '12345-SP',
        valor_estimado: 150.00
    };

    it('3.1 Criação sem campos obrigatórios', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idpaciente: undefined });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('idpaciente');
    });

    it('3.2 Criação com CPF Inválido (no body ou no paciente)', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, cpf: '12345' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('CPF inválido');
    });

    it('3.3 Criação com Data Inválida', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, data_prevista: '2024/13/45' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Data inválida');
    });

    it('3.4 Criação com Valor Negativo', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, valor_estimado: -100.00 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valor deve ser positivo');
    });

    it('3.5 Criação com Tipo de Procedimento Inválido', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, tipo_procedimento: 'CIRURGIA' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Tipo de procedimento inválido');
    });

    it('3.6 Criação com CRM Inválido', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, crm_medico: '123' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('CRM inválido');
    });

    it('12.1 Data prevista no passado', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, data_prevista: '2020-01-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Data prevista não pode ser no passado');
    });

    it('12.2 Valor estimado zero', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, valor_estimado: 0.00 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valor deve ser maior que zero');
    });

    it('12.3 Nome do médico vazio', async () => {
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, medico_solicitante: '  ' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Nome do médico é obrigatório');
    });

    it('12.4 Código de procedimento muito longo', async () => {
        const longCode = 'EX' + 'A'.repeat(100);
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, codigo_procedimento: longCode });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Código muito longo');
    });

    it('12.6 Paciente e convênio incompatíveis', async () => {
        // Paciente 1 tem convênios 1 e 3. Vamos pedir idconvenio=2 (sem vínculo)
        axios.get.mockResolvedValueOnce({ data: apiPacienteValido });
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idconvenio: 2 });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Paciente não possui este convênio');
    });
});

describe('4 & 5. Testes de Integração & Falhas de APIs Externas', () => {
    const validBody = {
        idpaciente: 1,
        idconvenio: 1,
        tipo_procedimento: 'EXAME',
        codigo_procedimento: 'EX001',
        descricao_procedimento: 'Ressonância',
        data_prevista: '2026-12-30',
        medico_solicitante: 'Dr. Teste',
        crm_medico: '12345-SP',
        valor_estimado: 1500.00
    };

    it('4.1 API G1 Indisponível (fallback mock local)', async () => {
        // Simular falha de conexão no Axios
        axios.get.mockRejectedValueOnce(new Error('Connection refused'));
        axios.get.mockRejectedValueOnce(new Error('Connection refused'));
        axios.get.mockRejectedValueOnce(new Error('Connection refused'));
        axios.get.mockResolvedValue({ data: apiConvenioUnimed }); // G9 funcionando

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send(validBody);
        
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('APROVADO');
        expect(res.body.decisao_motivo).toBe('Valor dentro do limite automático do convênio');
    });

    it('4.5 API G1 retorna 404', async () => {
        // Simular erro 404 da API do G1. PacienteService.buscarPaciente tratará a falha.
        // Se a API externa lança 404, e o mock local também não encontra (e.g. id=999), retorna null.
        axios.get.mockRejectedValue(new Error('Request failed with status code 404'));

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idpaciente: 999 });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Paciente não encontrado');
    });

    it('4.6 Circuit Breaker da API G1 abre após 5 falhas consecutivas', async () => {
        // Mock das chamadas para falharem imediatamente sem retries/delays
        vi.spyOn(PacienteService, 'callApiWithRetry').mockRejectedValue(new Error('Network Error'));

        // Fazer 5 chamadas para disparar a abertura do circuito
        for (let i = 0; i < 5; i++) {
            await PacienteService.buscarPaciente(1);
        }

        expect(PacienteService.circuitBreaker.isOpen).toBe(true);

        // A próxima chamada deve usar mock direto sem invocar callApiWithRetry
        PacienteService.callApiWithRetry.mockClear();
        const p = await PacienteService.buscarPaciente(1);
        expect(p.nome).toBe('João Silva (Mock)');
        expect(PacienteService.callApiWithRetry).not.toHaveBeenCalled();
    });

    it('4.3 API G1 retorna dados corrompidos', async () => {
        axios.get.mockResolvedValueOnce({ data: apiPacienteCorrompido });
        axios.get.mockResolvedValue({ data: apiConvenioUnimed });

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send(validBody);
        // Deve usar o mock local de fallback já que o dado da API foi corrompido/rejeitado
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('APROVADO');
    });
});

describe('7. Testes de Lógica de Negócios (Decisões Automáticas & Manuais)', () => {
    const validBody = {
        idpaciente: 1,
        idconvenio: 1,
        tipo_procedimento: 'EXAME',
        codigo_procedimento: 'EX001',
        descricao_procedimento: 'Procedimento X',
        data_prevista: '2026-12-30',
        medico_solicitante: 'Dr. Teste',
        crm_medico: '12345-SP',
        valor_estimado: 1500.00
    };

    it('7.1 Decisão Automática - Valor Acima do Limite', async () => {
        axios.get.mockResolvedValueOnce({ data: apiPacienteValido });
        axios.get.mockResolvedValueOnce({ data: apiConvenioUnimed }); // Limite da regra EXAME é R$ 2.000,00

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, valor_estimado: 3500.00 }); // Acima do limite da regra (2000.00)
        
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('REJEITADO');
        expect(res.body.decisao_motivo).toBe('Valor acima do limite automático, requer análise manual');
    });

    it('7.2 Decisão Automática - Valor Abaixo do Limite', async () => {
        axios.get.mockResolvedValueOnce({ data: apiPacienteValido });
        axios.get.mockResolvedValueOnce({ data: apiConvenioUnimed });

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, valor_estimado: 1500.00 }); // Abaixo de 2000.00

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('APROVADO');
        expect(res.body.decisao_motivo).toBe('Valor dentro do limite automático do convênio');
    });

    it('7.3 Decisão Automática - Cobertura Total (100% Cobertura)', async () => {
        axios.get.mockResolvedValueOnce({ data: apiPacienteValido });
        axios.get.mockResolvedValueOnce({ data: apiConvenioCoberturaTotal });

        // Adicionar convênio no banco para satisfazer a constraint de FK
        await Convenio.create({ idconvenio: 4, nome: 'Amil (Mock)', cnpj: '11.222.333/0001-44', tipo: 'PARTICIPAR', cobertura_exames: 100.00, cobertura_internacoes: 100.00, valor_maximo_automatico: 1000.00, requer_autorizacao: true });
        // Adicionar regra no banco para o novo convênio de ID 4
        await RegraConvenio.create({ idregra: 10, idconvenio: 4, tipo_procedimento: 'EXAME', valor_maximo: 500.00 });

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idconvenio: 4, valor_estimado: 2500.00 }); // Valor acima do limite de R$ 500, mas aprovado por 100% de cobertura

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('APROVADO');
        expect(res.body.decisao_motivo).toBe('Cobertura total do convênio');
    });

    it('7.7 Procedimento não requer autorização', async () => {
        // Bradesco tem requer_autorizacao = false
        // Paciente 3 tem vínculo com Bradesco (convênio 2)
        const p3 = { ...apiPacienteValido, idpaciente: 3 };
        axios.get.mockResolvedValueOnce({ data: p3 });
        axios.get.mockResolvedValueOnce({ data: apiConvenioSemAutorizacao });

        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idpaciente: 3, idconvenio: 2, valor_estimado: 12000.00 }); // Acima do limite da regra (10000.00), mas sem autorização

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('APROVADO');
        expect(res.body.decisao_motivo).toBe('Procedimento não requer autorização');
    });

    it('7.8 Regra de convênio não encontrada', async () => {
        // Criar um convênio temporário que não possui regra de exame no banco
        await Convenio.create({ idconvenio: 5, nome: 'Convenio Sem Regra', cnpj: '11.111.111/0001-11', tipo: 'PARTICIPAR', cobertura_exames: 50, cobertura_internacoes: 50, valor_maximo_automatico: 100 });
        
        // Mock vinculo
        const p1 = { ...apiPacienteValido, idpaciente: 1 };
        axios.get.mockResolvedValueOnce({ data: p1 });
        axios.get.mockResolvedValueOnce({ data: { idconvenio: 5, nome: 'Convenio Sem Regra', requer_autorizacao: true } });

        // Atualizar vinculo mock do paciente 1 para conter o convênio 5
        const res = await request(api)
            .post('/api/autorizacao')
            .set('Authorization', adminToken)
            .send({ ...validBody, idconvenio: 5 });
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Regra de convênio não encontrada');
    });

    it('7.4 Tentativa de alterar decisão já definida', async () => {
        // Criar autorização já decidida
        const authDoc = await Autorizacao.create({
            numero_protocolo: 'AUT-DECIDIDA',
            idpaciente: 1,
            idconvenio: 1,
            tipo_procedimento: 'EXAME',
            codigo_procedimento: 'EX001',
            descricao_procedimento: 'Teste',
            data_solicitacao: '2024-01-15',
            medico_solicitante: 'Dr. Teste',
            crm_medico: '1234-SP',
            status: 'APROVADO',
            data_decisao: '2024-01-15',
            decisao_motivo: 'Teste'
        });

        const res = await request(api)
            .put(`/api/autorizacao/${authDoc.idautorizacao}`)
            .set('Authorization', adminToken)
            .send({ descricao_procedimento: 'Nova descrição' });
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Decisão já definida, não pode ser alterada');
    });

    it('12.7 Deletar autorização com decisão definida', async () => {
        const authDoc = await Autorizacao.create({
            numero_protocolo: 'AUT-DECIDIDA-DEL',
            idpaciente: 1,
            idconvenio: 1,
            tipo_procedimento: 'EXAME',
            codigo_procedimento: 'EX001',
            descricao_procedimento: 'Teste',
            data_solicitacao: '2024-01-15',
            medico_solicitante: 'Dr. Teste',
            crm_medico: '1234-SP',
            status: 'REJEITADO',
            data_decisao: '2024-01-15',
            decisao_motivo: 'Teste'
        });

        const res = await request(api)
            .delete(`/api/autorizacao/${authDoc.idautorizacao}`)
            .set('Authorization', adminToken);
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Não é possível deletar autorização já decidida');
    });

    it('7.6 Decisão manual com motivo ausente', async () => {
        const authDoc = await Autorizacao.create({
            numero_protocolo: 'AUT-PEND',
            idpaciente: 1,
            idconvenio: 1,
            tipo_procedimento: 'EXAME',
            codigo_procedimento: 'EX001',
            descricao_procedimento: 'Teste',
            data_solicitacao: '2024-01-15',
            medico_solicitante: 'Dr. Teste',
            crm_medico: '1234-SP',
            status: 'PENDENTE'
        });

        const res = await request(api)
            .put(`/api/autorizacao/${authDoc.idautorizacao}/decisao`)
            .set('Authorization', adminToken)
            .send({ status: 'APROVADO', decisao_motivo: '  ' });
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Motivo da decisão é obrigatório');
    });
});

describe('11. Testes de Integração com Outros Módulos', () => {
    beforeEach(async () => {
        // Popular banco com algumas autorizações aprovadas de exames, internações e consultas
        await Autorizacao.bulkCreate([
            {
                numero_protocolo: 'AUT-EX-APROVADO',
                idpaciente: 1,
                idconvenio: 1,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX001',
                descricao_procedimento: 'Ressonância',
                data_solicitacao: '2024-01-15',
                medico_solicitante: 'Dr. Carlos',
                crm_medico: '1234-SP',
                status: 'APROVADO'
            },
            {
                numero_protocolo: 'AUT-EX-PENDENTE',
                idpaciente: 1,
                idconvenio: 1,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX001',
                descricao_procedimento: 'Ressonância',
                data_solicitacao: '2024-01-15',
                medico_solicitante: 'Dr. Carlos',
                crm_medico: '1234-SP',
                status: 'PENDENTE'
            },
            {
                numero_protocolo: 'AUT-INT-APROVADO',
                idpaciente: 2,
                idconvenio: 1,
                tipo_procedimento: 'INTERNACAO',
                codigo_procedimento: 'INT001',
                descricao_procedimento: 'Cardíaca',
                data_solicitacao: '2024-01-16',
                medico_solicitante: 'Dr. Marcos',
                crm_medico: '5432-SP',
                status: 'APROVADO'
            },
            {
                numero_protocolo: 'AUT-CON-APROVADO',
                idpaciente: 1,
                idconvenio: 1,
                tipo_procedimento: 'CONSULTA',
                codigo_procedimento: 'CON001',
                descricao_procedimento: 'Consulta Geral',
                data_solicitacao: '2024-01-17',
                medico_solicitante: 'Dr. João',
                crm_medico: '9999-SP',
                status: 'APROVADO'
            }
        ]);
    });

    it('11.1 Consumo G7 - Exames', async () => {
        const res = await request(api).get('/api/integracao/autorizacoes/exames');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].numero_protocolo).toBe('AUT-EX-APROVADO');
        expect(res.body[0].tipo_procedimento).toBe('EXAME');
    });

    it('11.2 Consumo G15 - Internações', async () => {
        const res = await request(api).get('/api/integracao/autorizacoes/internacoes');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].numero_protocolo).toBe('AUT-INT-APROVADO');
        expect(res.body[0].tipo_procedimento).toBe('INTERNACAO');
    });

    it('11.3 Consumo G4 - Consultas', async () => {
        const res = await request(api).get('/api/integracao/autorizacoes/consulta');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].numero_protocolo).toBe('AUT-CON-APROVADO');
        expect(res.body[0].tipo_procedimento).toBe('CONSULTA');
    });

    it('11.4 Health Check - Integrações Falhando (degraded status)', async () => {
        // Simular falhas no Axios para o health check
        axios.get.mockRejectedValue(new Error('Indisponível'));
        
        const res = await request(api).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('degraded');
        expect(res.body.integrations.g1_pacientes).toBe('unhealthy');
        expect(res.body.integrations.g9_convenios).toBe('unhealthy');
    });
});
