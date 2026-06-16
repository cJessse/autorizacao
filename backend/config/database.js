import { Sequelize } from "sequelize";

const banco = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        },
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
      })
    : new Sequelize({
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
