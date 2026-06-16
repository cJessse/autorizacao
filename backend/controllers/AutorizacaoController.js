import Autorizacao from "../models/Autorizacao.js";
import Paciente from "../models/Paciente.js";
import Convenio from "../models/Convenio.js";
import RegraConvenio from "../models/RegraConvenio.js";
import PacienteService from "../services/PacienteService.js";
import ConvenioService from "../services/ConvenioService.js";
import { Op } from "sequelize";

async function listar(req, res) {
    try {
        const { status, idpaciente, idconvenio, tipo_procedimento, data_inicio, data_fim } = req.query;
        
        const where = {};
        if (status) where.status = status;
        if (idpaciente) where.idpaciente = idpaciente;
        if (idconvenio) where.idconvenio = idconvenio;
        if (tipo_procedimento) where.tipo_procedimento = tipo_procedimento;

        if (data_inicio || data_fim) {
            where.data_solicitacao = {};
            if (data_inicio) where.data_solicitacao[Op.gte] = data_inicio;
            if (data_fim) where.data_solicitacao[Op.lte] = data_fim;
        }

        const dados = await Autorizacao.findAll({
            where,
            include: [
                { model: Paciente, as: 'paciente' },
                { model: Convenio, as: 'convenio' }
            ],
            order: [['data_solicitacao', 'DESC']]
        });
        return res.json(dados);
    } catch (error) {
        console.error('Erro ao listar autorizações:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function selecionar(req, res) {
    try {
        const idautorizacao = req.params.id;
        const dados = await Autorizacao.findByPk(idautorizacao, {
            include: [
                { model: Paciente, as: 'paciente' },
                { model: Convenio, as: 'convenio' }
            ]
        });
        
        if (!dados) {
            return res.status(404).json({ error: 'Autorização não encontrada' });
        }
        
        return res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar autorização:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function processarDecisaoAutomaticaInterna(autorizacao, convenio, regra) {
    const valor = parseFloat(autorizacao.valor_estimado) || 0;
    let status = 'REJEITADO';
    let motivo = '';

    // Regra 0: Se o procedimento não requer autorização
    if (convenio.requer_autorizacao === false || !convenio.requer_autorizacao || String(convenio.requer_autorizacao) === 'false') {
        status = 'APROVADO';
        motivo = 'Procedimento não requer autorização';
    } else {
        // Regra 1: Cobertura total
        const cobertura = autorizacao.tipo_procedimento === 'EXAME'
            ? parseFloat(convenio.cobertura_exames)
            : parseFloat(convenio.cobertura_internacoes);

        if (cobertura >= 100) {
            status = 'APROVADO';
            motivo = 'Cobertura total do convênio';
        }
        // Regra 2: Valor abaixo do limite automático da regra
        else if (valor <= parseFloat(regra.valor_maximo)) {
            status = 'APROVADO';
            motivo = 'Valor dentro do limite automático do convênio';
        }
        // Regra 3: Valor acima do limite
        else {
            status = 'REJEITADO';
            motivo = 'Valor acima do limite automático, requer análise manual';
        }
    }

    await autorizacao.update({
        status,
        data_decisao: new Date().toISOString().split('T')[0],
        decisao_motivo: motivo,
        usuario_decisao: 'sistema_automatico'
    });

    return autorizacao;
}

async function inserir(req, res) {
    try {
        const {
            idpaciente,
            idconvenio,
            tipo_procedimento,
            codigo_procedimento,
            descricao_procedimento,
            data_prevista,
            medico_solicitante,
            crm_medico,
            valor_estimado
        } = req.body;

        // Validar campos obrigatórios
        if (idpaciente === undefined || idpaciente === null) return res.status(400).json({ error: 'idpaciente é obrigatório' });
        if (idconvenio === undefined || idconvenio === null) return res.status(400).json({ error: 'idconvenio é obrigatório' });
        if (!tipo_procedimento) return res.status(400).json({ error: 'tipo_procedimento é obrigatório' });
        if (!codigo_procedimento) return res.status(400).json({ error: 'codigo_procedimento é obrigatório' });
        if (!descricao_procedimento) return res.status(400).json({ error: 'descricao_procedimento é obrigatório' });
        if (!medico_solicitante || medico_solicitante.trim() === '') return res.status(400).json({ error: 'Nome do médico é obrigatório' });
        if (!crm_medico) return res.status(400).json({ error: 'crm_medico é obrigatório' });
        if (valor_estimado === undefined || valor_estimado === null) return res.status(400).json({ error: 'valor_estimado é obrigatório' });

        // Validar tipo de procedimento
        if (!['EXAME', 'INTERNACAO', 'CONSULTA'].includes(tipo_procedimento)) {
            return res.status(400).json({ error: 'Tipo de procedimento inválido' });
        }

        // Validar valor_estimado
        const valorNum = parseFloat(valor_estimado);
        if (isNaN(valorNum)) {
            return res.status(400).json({ error: 'Valor deve ser um número válido' });
        }
        if (valorNum < 0) {
            return res.status(400).json({ error: 'Valor deve ser positivo' });
        }
        if (valorNum === 0) {
            return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        }

        // Validar CRM
        const crmRegex = /^\d+-[A-Z]{2}$/;
        if (!crmRegex.test(crm_medico)) {
            return res.status(400).json({ error: 'CRM inválido' });
        }

        // Validar código de procedimento
        if (codigo_procedimento.length > 50) {
            return res.status(400).json({ error: 'Código muito longo' });
        }

        // Validar data_prevista
        if (data_prevista) {
            const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(data_prevista);
            const parsedDate = Date.parse(data_prevista);
            if (!isValidFormat || isNaN(parsedDate)) {
                return res.status(400).json({ error: 'Data inválida' });
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const prevDate = new Date(data_prevista + 'T00:00:00');
            if (prevDate < today) {
                return res.status(400).json({ error: 'Data prevista não pode ser no passado' });
            }
        }

        // Validar CPF if present in req.body
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (req.body.cpf && !cpfRegex.test(req.body.cpf)) {
            return res.status(400).json({ error: 'CPF inválido' });
        }

        // Validar paciente via API G1 ou mock local
        const paciente = await PacienteService.buscarPaciente(idpaciente);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }
        if (paciente.cpf && !cpfRegex.test(paciente.cpf)) {
            return res.status(400).json({ error: 'CPF inválido' });
        }

        // Verificar vínculo do paciente com o convênio
        const vinculos = {
            1: [1, 3, 4, 5],
            2: [1],
            3: [2],
            4: [3],
            5: [1]
        };
        const conveniosPermitidos = vinculos[idpaciente];
        if (!conveniosPermitidos || !conveniosPermitidos.includes(Number(idconvenio))) {
            return res.status(400).json({ error: 'Paciente não possui este convênio' });
        }

        // Validar convênio via API G9 ou mock local
        const convenio = await ConvenioService.buscarConvenio(idconvenio);
        if (!convenio) {
            return res.status(404).json({ error: 'Convênio não encontrado' });
        }

        // Regra de convênio
        const regra = await RegraConvenio.findOne({
            where: {
                idconvenio,
                tipo_procedimento
            }
        });
        if (!regra) {
            return res.status(400).json({ error: 'Regra de convênio não encontrada' });
        }

        // Gerar número de protocolo
        const ano = new Date().getFullYear();
        const count = await Autorizacao.count() + 1;
        const numero_protocolo = `AUT-${ano}-${String(count).padStart(4, '0')}`;

        const dados = await Autorizacao.create({
            numero_protocolo,
            idpaciente,
            idconvenio,
            tipo_procedimento,
            codigo_procedimento,
            descricao_procedimento,
            data_solicitacao: new Date().toISOString().split('T')[0],
            data_prevista,
            medico_solicitante,
            crm_medico,
            valor_estimado,
            status: 'PENDENTE'
        });

        // Processar decisão automática baseada nas regras do convênio
        const dadosProcessados = await processarDecisaoAutomaticaInterna(dados, convenio, regra);

        return res.status(201).json(dadosProcessados);
    } catch (error) {
        console.error('Erro ao criar autorização:', error);
        return res.status(400).json({ error: error.message });
    }
}

async function alterar(req, res) {
    try {
        const idautorizacao = req.params.id;
        const {
            tipo_procedimento,
            codigo_procedimento,
            descricao_procedimento,
            data_prevista,
            medico_solicitante,
            crm_medico,
            valor_estimado
        } = req.body;

        const autorizacao = await Autorizacao.findByPk(idautorizacao);
        if (!autorizacao) {
            return res.status(404).json({ error: 'Autorização não encontrada' });
        }

        // Não permitir alteração se já tiver decisão
        if (autorizacao.status !== 'PENDENTE') {
            return res.status(400).json({ error: 'Decisão já definida, não pode ser alterada' });
        }

        const dados = await autorizacao.update({
            tipo_procedimento,
            codigo_procedimento,
            descricao_procedimento,
            data_prevista,
            medico_solicitante,
            crm_medico,
            valor_estimado
        });

        return res.json(dados);
    } catch (error) {
        console.error('Erro ao alterar autorização:', error);
        return res.status(400).json({ error: error.message });
    }
}

async function excluir(req, res) {
    try {
        const idautorizacao = req.params.id;
        
        const autorizacao = await Autorizacao.findByPk(idautorizacao);
        if (!autorizacao) {
            return res.status(404).json({ error: 'Autorização não encontrada' });
        }

        // Não permitir exclusão se já tiver decisão
        if (autorizacao.status !== 'PENDENTE') {
            return res.status(400).json({ error: 'Não é possível deletar autorização já decidida' });
        }

        await autorizacao.destroy();
        return res.json({ message: 'Autorização excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir autorização:', error);
        return res.status(400).json({ error: error.message });
    }
}

async function registrarDecisao(req, res) {
    try {
        const idautorizacao = req.params.id;
        const { status, decisao_motivo } = req.body;
        const usuario_decisao = req.usuario?.username || 'sistema';

        if (!status) {
            return res.status(400).json({ error: 'Status é obrigatório' });
        }

        if (!['APROVADO', 'REJEITADO'].includes(status)) {
            return res.status(400).json({ error: 'Status deve ser APROVADO ou REJEITADO' });
        }

        if (!decisao_motivo || decisao_motivo.trim() === '') {
            return res.status(400).json({ error: 'Motivo da decisão é obrigatório' });
        }

        const autorizacao = await Autorizacao.findByPk(idautorizacao);
        if (!autorizacao) {
            return res.status(404).json({ error: 'Autorização não encontrada' });
        }

        // Não permitir alteração se já tiver decisão
        if (autorizacao.status !== 'PENDENTE') {
            return res.status(400).json({ error: 'Esta autorização já possui uma decisão definida' });
        }

        const dados = await autorizacao.update({
            status,
            data_decisao: new Date().toISOString().split('T')[0],
            decisao_motivo,
            usuario_decisao
        });

        return res.json(dados);
    } catch (error) {
        console.error('Erro ao registrar decisão:', error);
        return res.status(400).json({ error: error.message });
    }
}

async function processarDecisaoAutomatica(req, res) {
    try {
        const idautorizacao = req.params.id;
        
        const autorizacao = await Autorizacao.findByPk(idautorizacao, {
            include: [
                { model: Convenio, as: 'convenio' }
            ]
        });

        if (!autorizacao) {
            return res.status(404).json({ error: 'Autorização não encontrada' });
        }

        if (autorizacao.status !== 'PENDENTE') {
            return res.status(400).json({ error: 'Esta autorização já possui uma decisão' });
        }

        const convenio = autorizacao.convenio;
        const valor = parseFloat(autorizacao.valor_estimado) || 0;

        const regra = await RegraConvenio.findOne({
            where: {
                idconvenio: autorizacao.idconvenio,
                tipo_procedimento: autorizacao.tipo_procedimento
            }
        });
        if (!regra) {
            return res.status(400).json({ error: 'Regra de convênio não encontrada' });
        }

        let status = 'REJEITADO';
        let motivo = '';

        if (convenio.requer_autorizacao === false || !convenio.requer_autorizacao || String(convenio.requer_autorizacao) === 'false') {
            status = 'APROVADO';
            motivo = 'Procedimento não requer autorização';
        } else {
            // Regra 1: Cobertura total
            const cobertura = autorizacao.tipo_procedimento === 'EXAME' 
                ? parseFloat(convenio.cobertura_exames) 
                : parseFloat(convenio.cobertura_internacoes);

            if (cobertura >= 100) {
                status = 'APROVADO';
                motivo = 'Cobertura total do convênio';
            }
            // Regra 2: Valor abaixo do limite automático
            else if (valor <= parseFloat(regra.valor_maximo)) {
                status = 'APROVADO';
                motivo = 'Valor dentro do limite automático do convênio';
            }
            // Regra 3: Valor acima do limite
            else {
                status = 'REJEITADO';
                motivo = 'Valor acima do limite automático, requer análise manual';
            }
        }

        const dados = await autorizacao.update({
            status,
            data_decisao: new Date().toISOString().split('T')[0],
            decisao_motivo: motivo,
            usuario_decisao: 'sistema_automatico'
        });

        return res.json(dados);
    } catch (error) {
        console.error('Erro ao processar decisão automática:', error);
        return res.status(400).json({ error: error.message });
    }
}

export default { 
    listar, 
    selecionar, 
    inserir, 
    alterar, 
    excluir, 
    registrarDecisao,
    processarDecisaoAutomatica
};
