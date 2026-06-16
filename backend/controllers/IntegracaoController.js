import Autorizacao from "../models/Autorizacao.js";

async function listarParaExames(req, res) {
    try {
        const dados = await Autorizacao.findAll({
            where: {
                status: 'APROVADO',
                tipo_procedimento: 'EXAME'
            },
            include: ['paciente', 'convenio'],
            order: [['data_solicitacao', 'DESC']]
        });
        return res.json(dados);
    } catch (error) {
        console.error('Erro ao listar autorizações para exames:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function listarParaInternacoes(req, res) {
    try {
        const dados = await Autorizacao.findAll({
            where: {
                status: 'APROVADO',
                tipo_procedimento: 'INTERNACAO'
            },
            include: ['paciente', 'convenio'],
            order: [['data_solicitacao', 'DESC']]
        });
        return res.json(dados);
    } catch (error) {
        console.error('Erro ao listar autorizações para internações:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function listarParaConsultas(req, res) {
    try {
        const dados = await Autorizacao.findAll({
            where: {
                status: 'APROVADO',
                tipo_procedimento: 'CONSULTA'
            },
            include: ['paciente', 'convenio'],
            order: [['data_solicitacao', 'DESC']]
        });
        return res.json(dados);
    } catch (error) {
        console.error('Erro ao listar autorizações para consultas:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function healthCheck(req, res) {
    try {
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            integrations: {
                g1_pacientes: 'unknown',
                g9_convenios: 'unknown'
            }
        };

        // Verificar API G1
        try {
            const PacienteService = (await import('../services/PacienteService.js')).default;
            await PacienteService.healthCheck();
            status.integrations.g1_pacientes = 'healthy';
        } catch (error) {
            status.integrations.g1_pacientes = 'unhealthy';
            status.integrations.g1_pacientes_error = error.message;
        }

        // Verificar API G9
        try {
            const ConvenioService = (await import('../services/ConvenioService.js')).default;
            await ConvenioService.healthCheck();
            status.integrations.g9_convenios = 'healthy';
        } catch (error) {
            status.integrations.g9_convenios = 'unhealthy';
            status.integrations.g9_convenios_error = error.message;
        }

        if (status.integrations.g1_pacientes === 'unhealthy' || status.integrations.g9_convenios === 'unhealthy') {
            status.status = 'degraded';
        }

        return res.json(status);
    } catch (error) {
        console.error('Erro no health check:', error);
        return res.status(500).json({ error: error.message });
    }
}

export default {
    listarParaExames,
    listarParaInternacoes,
    listarParaConsultas,
    healthCheck
};
