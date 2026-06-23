// import { Sequelize } from "sequelize";
// const config = require("../../config/config.js");


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
//     require("../../models");


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
import mysql from "mysql2/promise";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

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
    // Create DB if not exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
    );

    await connection.end();

    // Existing code
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");

    // Initialize models
    require("../../models");

    // await sequelize.sync();

    return sequelize;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

export { sequelize };
