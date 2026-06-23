// import { Sequelize } from "sequelize";
// const config = require("../../config/config.js");
// import Bybit from "../../models/bybit";
// import Binance from "../../models/binance";

// const env = process.env.NODE_ENV || "development";
// const dbConfig = config[env];

// const sequelize = new Sequelize(
//   dbConfig.database,
//   dbConfig.username,
//   dbConfig.password,
//   {
//     host: dbConfig.host,
//     dialect: dbConfig.dialect,
//     logging: dbConfig.logging,
//     port: dbConfig.port,
//   }
// );

// export const initDatabase = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connection has been established successfully.");

//     // Initialize models
//     Bybit.initialize(sequelize);
//     Binance.initialize(sequelize);

//     // Sync models if needed (optional, migrations are usually preferred)
//     // await sequelize.sync(); 

//     return sequelize;
//   } catch (error) {
//     console.error("❌ Unable to connect to the database:", error);
//     throw error;
//   }
// };

// export { sequelize };


import { Sequelize } from "sequelize";
const config = require("../../config/config.js");
import Bybit from "../../models/bybit";
import Binance from "../../models/binance";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// main sequelize connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    port: dbConfig.port,
  }
);

export const initDatabase = async () => {
  try {

    // 🔥 SAFE FIX: ensure database exists
    const bootstrapSequelize = new Sequelize({
      host: dbConfig.host,
      username: dbConfig.username,
      password: dbConfig.password,
      dialect: dbConfig.dialect,
      logging: false,
    });

    await bootstrapSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`
    );

    await bootstrapSequelize.close();

    // normal connection
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");

    // Initialize models
    Bybit.initialize(sequelize);
    Binance.initialize(sequelize);

    // optional (uncomment if you want auto tables)
    // await sequelize.sync();

    return sequelize;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

export { sequelize };