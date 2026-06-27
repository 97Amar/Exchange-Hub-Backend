// import { Sequelize } from "sequelize";
// const config = require("../../config/config.js");
// import UserRegister from "../../models/user_regester";
// import Repository from "../../models/repository";

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
//     UserRegister.initialize(sequelize);
//     Repository.initialize(sequelize);

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
import UserRegister from "../../models/user_regester";
import Repository from "../../models/repository";

import mysql from "mysql2/promise"; // ✅ ADDED

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
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
  }
);

export const initDatabase = async () => {
  try {
    // ✅ STEP 1: ensure database exists (SAFE ADDITION)
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      port: dbConfig.port,
      ssl: {
        rejectUnauthorized: true,
      },
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
    );

    await connection.end();

    // ✅ STEP 2: Sequelize connect
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");

    // Initialize models (UNCHANGED)
    UserRegister.initialize(sequelize);
    Repository.initialize(sequelize);

    // Optional (UNCHANGED)
    // await sequelize.sync();

    return sequelize;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

export { sequelize };