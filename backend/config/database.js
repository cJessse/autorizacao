import { Sequelize } from "sequelize";

const banco = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5434,
    database: 'autorizacao_db',
    username: 'postgres',
    password: 'postgres',
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    },
    logging: false
});

export default banco;
