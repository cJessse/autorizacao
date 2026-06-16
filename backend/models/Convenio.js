import banco from "../config/database.js";
import { DataTypes } from "sequelize";

const Convenio = banco.define(
    'convenio',
    {
        idconvenio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        cnpj: {
            type: DataTypes.STRING(18),
            allowNull: false,
            unique: true
        },
        tipo: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['PARTICIPAR', 'NAO_PARTICIPAR']]
            }
        },
        cobertura_exames: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
        cobertura_internacoes: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
        valor_maximo_automatico: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        requer_autorizacao: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }
);

export default Convenio;
