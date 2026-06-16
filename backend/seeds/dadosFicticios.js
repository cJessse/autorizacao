import banco from '../config/database.js';
import Paciente from '../models/Paciente.js';
import Convenio from '../models/Convenio.js';
import RegraConvenio from '../models/RegraConvenio.js';
import Autorizacao from '../models/Autorizacao.js';
import bcrypt from 'bcryptjs';
import '../models/relacionamentos.js';

async function seed() {
    try {
        console.log('Conectando ao banco de dados...');
        await banco.sync({ force: true });
        console.log('Banco de dados sincronizado.');

        console.log('Inserindo pacientes (mock G1)...');
        const pacientes = await Paciente.bulkCreate([
            { idpaciente: 1, nome: 'João Silva', cpf: '123.456.789-00', data_nascimento: '1980-01-15', telefone: '11999999999', email: 'joao@email.com' },
            { idpaciente: 2, nome: 'Maria Santos', cpf: '987.654.321-00', data_nascimento: '1990-05-20', telefone: '11888888888', email: 'maria@email.com' },
            { idpaciente: 3, nome: 'Pedro Oliveira', cpf: '456.789.123-00', data_nascimento: '1975-10-30', telefone: '11777777777', email: 'pedro@email.com' },
            { idpaciente: 4, nome: 'Ana Costa', cpf: '321.654.987-00', data_nascimento: '1985-03-12', telefone: '11666666666', email: 'ana@email.com' },
            { idpaciente: 5, nome: 'Carlos Lima', cpf: '789.123.456-00', data_nascimento: '1992-08-25', telefone: '11555555555', email: 'carlos@email.com' }
        ]);
        console.log(`${pacientes.length} pacientes inseridos.`);

        console.log('Inserindo convênios (mock G9)...');
        const convenios = await Convenio.bulkCreate([
            { 
                idconvenio: 1, 
                nome: 'Unimed', 
                cnpj: '12.345.678/0001-90', 
                tipo: 'PARTICIPAR', 
                cobertura_exames: 80.00, 
                cobertura_internacoes: 90.00, 
                valor_maximo_automatico: 5000.00, 
                requer_autorizacao: true 
            },
            { 
                idconvenio: 2, 
                nome: 'Bradesco Saúde', 
                cnpj: '98.765.432/0001-10', 
                tipo: 'PARTICIPAR', 
                cobertura_exames: 100.00, 
                cobertura_internacoes: 100.00, 
                valor_maximo_automatico: 10000.00, 
                requer_autorizacao: false 
            },
            { 
                idconvenio: 3, 
                nome: 'SulAmérica', 
                cnpj: '45.678.912/0001-23', 
                tipo: 'NAO_PARTICIPAR', 
                cobertura_exames: 70.00, 
                cobertura_internacoes: 80.00, 
                valor_maximo_automatico: 3000.00, 
                requer_autorizacao: true 
            }
        ]);
        console.log(`${convenios.length} convênios inseridos.`);

        console.log('Inserindo regras de convênio...');
        const regras = await RegraConvenio.bulkCreate([
            { idregra: 1, idconvenio: 1, tipo_procedimento: 'EXAME', valor_maximo: 2000.00, descricao: 'Exames simples até R$ 2.000,00' },
            { idregra: 2, idconvenio: 1, tipo_procedimento: 'INTERNACAO', valor_maximo: 5000.00, descricao: 'Internações até R$ 5.000,00' },
            { idregra: 3, idconvenio: 2, tipo_procedimento: 'EXAME', valor_maximo: 10000.00, descricao: 'Exames até R$ 10.000,00' },
            { idregra: 4, idconvenio: 2, tipo_procedimento: 'INTERNACAO', valor_maximo: 10000.00, descricao: 'Internações até R$ 10.000,00' },
            { idregra: 5, idconvenio: 3, tipo_procedimento: 'EXAME', valor_maximo: 1500.00, descricao: 'Exames simples até R$ 1.500,00' },
            { idregra: 6, idconvenio: 3, tipo_procedimento: 'INTERNACAO', valor_maximo: 3000.00, descricao: 'Internações até R$ 3.000,00' }
        ]);
        console.log(`${regras.length} regras inseridas.`);

        console.log('Inserindo autorizações de exemplo...');
        const autorizacoes = await Autorizacao.bulkCreate([
            {
                idautorizacao: 1,
                numero_protocolo: 'AUT-2024-0001',
                idpaciente: 1,
                idconvenio: 1,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX001',
                descricao_procedimento: 'Ressonância Magnética',
                data_solicitacao: '2024-01-15',
                data_prevista: '2024-01-20',
                medico_solicitante: 'Dr. Carlos Mendes',
                crm_medico: '12345-SP',
                valor_estimado: 1500.00,
                status: 'APROVADO',
                data_decisao: '2024-01-15',
                decisao_motivo: 'Dentro do limite automático do convênio',
                usuario_decisao: 'sistema_automatico'
            },
            {
                idautorizacao: 2,
                numero_protocolo: 'AUT-2024-0002',
                idpaciente: 2,
                idconvenio: 1,
                tipo_procedimento: 'INTERNACAO',
                codigo_procedimento: 'INT001',
                descricao_procedimento: 'Cirurgia Cardíaca',
                data_solicitacao: '2024-01-16',
                data_prevista: '2024-01-25',
                medico_solicitante: 'Dr. Ana Pereira',
                crm_medico: '54321-SP',
                valor_estimado: 25000.00,
                status: 'REJEITADO',
                data_decisao: '2024-01-16',
                decisao_motivo: 'Valor acima do limite automático, requer análise manual',
                usuario_decisao: 'sistema_automatico'
            },
            {
                idautorizacao: 3,
                numero_protocolo: 'AUT-2024-0003',
                idpaciente: 3,
                idconvenio: 2,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX002',
                descricao_procedimento: 'Tomografia Computadorizada',
                data_solicitacao: '2024-01-17',
                data_prevista: '2024-01-22',
                medico_solicitante: 'Dr. Roberto Alves',
                crm_medico: '67890-SP',
                valor_estimado: 8000.00,
                status: 'APROVADO',
                data_decisao: '2024-01-17',
                decisao_motivo: 'Cobertura total do convênio',
                usuario_decisao: 'sistema_automatico'
            },
            {
                idautorizacao: 4,
                numero_protocolo: 'AUT-2024-0004',
                idpaciente: 4,
                idconvenio: 3,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX003',
                descricao_procedimento: 'Hemograma Completo',
                data_solicitacao: '2024-01-18',
                data_prevista: '2024-01-19',
                medico_solicitante: 'Dra. Julia Fernandes',
                crm_medico: '11111-SP',
                valor_estimado: 200.00,
                status: 'APROVADO',
                data_decisao: '2024-01-18',
                decisao_motivo: 'Dentro do limite automático do convênio',
                usuario_decisao: 'sistema_automatico'
            },
            {
                idautorizacao: 5,
                numero_protocolo: 'AUT-2024-0005',
                idpaciente: 5,
                idconvenio: 1,
                tipo_procedimento: 'EXAME',
                codigo_procedimento: 'EX004',
                descricao_procedimento: 'Endoscopia',
                data_solicitacao: '2024-01-19',
                data_prevista: '2024-01-25',
                medico_solicitante: 'Dr. Marcos Souza',
                crm_medico: '22222-SP',
                valor_estimado: 3000.00,
                status: 'PENDENTE'
            },
            {
                idautorizacao: 6,
                numero_protocolo: 'AUT-2024-0006',
                idpaciente: 1,
                idconvenio: 3,
                tipo_procedimento: 'INTERNACAO',
                codigo_procedimento: 'INT002',
                descricao_procedimento: 'Apendicectomia',
                data_solicitacao: '2024-01-20',
                data_prevista: '2024-01-22',
                medico_solicitante: 'Dr. Fernando Costa',
                crm_medico: '33333-SP',
                valor_estimado: 4000.00,
                status: 'REJEITADO',
                data_decisao: '2024-01-20',
                decisao_motivo: 'Valor acima do limite automático, requer análise manual',
                usuario_decisao: 'sistema_automatico'
            }
        ]);
        console.log(`${autorizacoes.length} autorizações inseridas.`);

        console.log('Seed concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro durante o seed:', error);
        process.exit(1);
    }
}

seed();
