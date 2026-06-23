
require("dotenv").config();
const { Sequelize } = require("sequelize");

const config = require("./config/config.js");
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log,
    port: dbConfig.port,
  }
);

async function fix() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    console.log("Altering binance_orders table...");
    await sequelize.query("ALTER TABLE binance_orders MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'NEW'");
    
    console.log("Altering bybit_orders table...");
    await sequelize.query("ALTER TABLE bybit_orders MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'New'");

    console.log("Schema fix complete!");
  } catch (err) {
    console.error("Schema fix failed:", err);
  } finally {
    process.exit(0);
  }
}

fix();
