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
  }
);

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query('DROP TABLE IF EXISTS `bybit_orders`;');
    await sequelize.query('DROP TABLE IF EXISTS `SequelizeMeta`;');
    console.log("Tables dropped.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}
run();
