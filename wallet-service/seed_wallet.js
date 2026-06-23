
require("dotenv").config();
const { Sequelize, QueryTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const config = require("./config/config.js");
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const walletDb = new Sequelize(
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

async function seed() {
  const userId = "e6b1b0b0-6835-4c18-8fae-0f868f1c2c3b";
  console.log("Seeding wallets for user:", userId);

  try {
    await walletDb.authenticate();
    console.log("Database connection established.");

    const coins = await walletDb.query(
      "SELECT id, name FROM coins WHERE name IN ('BTC', 'USDT', 'ETH')",
      { type: QueryTypes.SELECT }
    );

    for (const coin of coins) {
      console.log(`Checking wallet for ${coin.name}...`);
      const [existing] = await walletDb.query(
        "SELECT id FROM user_wallets WHERE userId = :userId AND coinId = :coinId",
        { replacements: { userId, coinId: coin.id }, type: QueryTypes.SELECT }
      );

      if (!existing) {
        console.log(`Creating wallet for ${coin.name}...`);
        await walletDb.query(
          "INSERT INTO user_wallets (id, userId, coinId, address, balance, lockedBalance, createdAt, updatedAt) VALUES (:id, :userId, :coinId, :address, :balance, :lockedBalance, :now, :now)",
          {
            replacements: {
              id: uuidv4(),
              userId,
              coinId: coin.id,
              address: "0xTestAddress",
              balance: coin.name === "USDT" ? 10000 : 1,
              lockedBalance: 0,
              now: new Date()
            },
            type: QueryTypes.INSERT
          }
        );
      } else {
        console.log(`Updating balance for ${coin.name}...`);
        await walletDb.query(
          "UPDATE user_wallets SET balance = :balance WHERE id = :id",
          {
            replacements: {
              id: existing.id,
              balance: coin.name === "USDT" ? 10000 : 1
            },
            type: QueryTypes.UPDATE
          }
        );
      }
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();
