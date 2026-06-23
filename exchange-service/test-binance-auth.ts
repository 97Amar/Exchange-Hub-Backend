import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = (process.env.BINANCE_API_KEY || "").trim();
const API_SECRET = (process.env.BINANCE_SECRET_KEY || "").trim();
const BASE_URL = "https://testnet.binance.vision";

console.log("Diagnostic Test for Binance Testnet with binance-api-node");
console.log("API_KEY prefix:", API_KEY.substring(0, 5) + "...");
console.log("BASE_URL:", BASE_URL);

async function testConnection() {
  try {
    // 1. Test public endpoint (no auth)
    const timeRes = await axios.get(`${BASE_URL}/api/v3/time`);
    console.log("✅ Public API connection successful. Server time:", timeRes.data.serverTime);

    // 2. Test authenticated endpoint (Get Account Information) using binance-api-node
    const Binance = require('binance-api-node').default || require('binance-api-node');
    const client = Binance({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      httpBase: BASE_URL
    });

    console.log("Attempting authenticated request to client.accountInfo()");
    try {
      const accountInfo = await client.accountInfo();
      console.log("✅ Authenticated request successful!");
      console.log("Account Info (partial):", JSON.stringify(accountInfo).substring(0, 100) + "...");
    } catch (e: any) {
      console.error("❌ binance-api-node Error caught:");
      console.error("  Message:", e.message);
      console.error("  Code:", e.code);
      console.error("  Headers:", e.headers);
      console.error("  Full error properties:", Object.keys(e));
    }
  } catch (error: any) {
    if (error.response) {
      console.error("❌ Outer API Error:", error.response.status, error.response.data);
    } else {
      console.error("❌ Outer Request Error:", error.message);
    }
  }
}

testConnection();
