import dotenv from "dotenv";
dotenv.config();

import { binanceConnector } from "./src/utils/binanceConnector";

async function reproduce() {
  const payload = {
    symbol: "BTCUSDT",
    qty: 0.001,
    price: 75000,
    side: "Buy",
    type: "Limit"
  };

  console.log("Reproducing Binance Limit Order with payload:", payload);

  try {
    const response = await binanceConnector.submitOrder({
      symbol: payload.symbol,
      side: payload.side.toUpperCase() as any,
      type: payload.type.toUpperCase() as any,
      quantity: payload.qty.toString(),
      price: payload.price.toString(),
    });

    console.log("✅ Success! Binance Response:", response);
  } catch (error: any) {
    console.error("❌ Failed! Error:");
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    if (error.response) {
      console.error("  Data:", error.response.data);
    }
  }
}

reproduce();
