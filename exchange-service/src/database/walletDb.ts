import { Sequelize, QueryTypes } from "sequelize";
const config = require("../../config/config.js");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

export const walletDb = new Sequelize(
  "wallet_db",
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
    port: dbConfig.port,
  }
);
