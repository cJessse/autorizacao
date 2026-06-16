import banco from "../config/database.js";
import { DataTypes } from "sequelize";

const Autorizacao = banco.define(
    'autorizacao',
    {
        idautorizacao: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        numero_protocolo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        idpaciente: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        idconvenio: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        tipo_procedimento: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['EXAME', 'INTERNACAO', 'CONSULTA']]
            }
        },
        codigo_procedimento: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        descricao_procedimento: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        data_solicitacao: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        data_prevista: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        medico_solicitante: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        crm_medico: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        valor_estimado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'PENDENTE',
            validate: {
                isIn: [['PENDENTE', 'APROVADO', 'REJEITADO']]
            }
        },
        data_decisao: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        decisao_motivo: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        usuario_decisao: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }
);

export default Autorizacao;
