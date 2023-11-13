import { SetupSequelizeParams } from './sequelize'

export const sequelizeCredentials : SetupSequelizeParams = {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'admin',
    database: 'bend-backend-task',
}

export const tokenSecret = "TOKENSECRETKEY";
export const hashSalt = "$2a$10$hj8x9ce.HPLIYCgF1bRLXO";