import { Sequelize } from "sequelize";
import config from '../config.js';

const sequelize = new Sequelize(
    config.database.database,
    config.database.user,
    config.database.password,
    {
        dialect: 'postgres',
        host: config.database.host,
        port: config.database.port,
        logging: false
    },
);

export const dbAuth = sequelize.authenticate();
sequelize.sync({ alter: true });

export default sequelize;