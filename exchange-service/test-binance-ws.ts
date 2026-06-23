import "dotenv/config";
import { BinanceWS } from "../src/socket/binance";

console.log("🚀 Starting Binance WS Test Script...");
console.log("Market Type:", process.env.BINANCE_MARKET_TYPE || "spot");
console.log("Account:", process.env.account || "mainnet");

const binanceWS = new BinanceWS((data) => {
  console.log("📥 Received Data:", JSON.stringify(data, null, 2));
  process.exit(0);
});

console.log("Connecting…");
binanceWS.connect([]);
console.log("Subscribing to BTCUSDT…");
binanceWS.subscribe("BTCUSDT");

// Timeout if no data received
setTimeout(() => {
  console.error("❌ Timeout: No data received from Binance WS in 10s");
  process.exit(1);
}, 10000);
