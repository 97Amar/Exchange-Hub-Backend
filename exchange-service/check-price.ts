import { binanceConnector } from "./src/utils/binanceConnector";
import dotenv from "dotenv";
dotenv.config();

async function checkPrice() {
  try {
    const ticker = await binanceConnector.getClient().prices({ symbol: 'BTCUSDT' });
    console.log("Current BTCUSDT Price:", ticker.BTCUSDT);
  } catch (error: any) {
    console.error("Failed to fetch price:", error.message);
  }
}

checkPrice();
