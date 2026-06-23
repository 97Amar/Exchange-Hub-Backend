import * as path from "path";
import * as dotenv from "dotenv";

// Load environment from exchange-service
dotenv.config({ path: path.join(__dirname, "../.env") });

const Binance = require("binance-api-node").default || require("binance-api-node");

const client = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  httpBase: process.env.HTTP_BASE || "https://testnet.binance.vision",
  wsBase: process.env.WS_BASE || "wss://testnet.binance.vision/ws",
  wsApi: "wss://testnet.binance.vision/ws-api/v3"
});

setTimeout(() => {
  console.log("Forcing script exit...");
  process.exit(1);
}, 10000);

async function test() {
  try {
    console.log("Requesting account info (verifying API keys)");
    const acc = await client.accountInfo();
    console.log("Account info success:", acc.canTrade);

    console.log("Initializing user ws stream...");
    client.ws.user((msg: any) => {
      console.log("Received via user stream:", msg);
    });
    console.log("User ws stream call completed. Waiting for messages...");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
