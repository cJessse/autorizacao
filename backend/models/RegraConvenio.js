import banco from "../config/database.js";
import { DataTypes } from "sequelize";

const RegraConvenio = banco.define(
    'regra_convenio',
    {
        idregra: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        idconvenio: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        tipo_procedimento: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['EXAME', 'INTERNACAO']]
            }
        },
        valor_maximo: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }
);

export default RegraConvenio;
