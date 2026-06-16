import banco from "../config/database.js";
import { DataTypes } from "sequelize";

const Paciente = banco.define(
    'paciente',
    {
        idpaciente: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        cpf: {
            type: DataTypes.STRING(14),
            allowNull: false,
            unique: true
        },
        data_nascimento: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        telefone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }
);

export default Paciente;
