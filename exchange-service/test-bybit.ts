import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const API_KEY = process.env.BYBIT_API_KEY || "";
const API_SECRET = process.env.BYBIT_API_SECRET || "";
const TESTNET = process.env.BYBIT_TESTNET === "true";

const restClient = new RestClientV5({
  key: API_KEY,
  secret: API_SECRET,
  testnet: TESTNET,
});

async function checkConnection() {
  console.log("🔄 Testing Bybit API Connection...");
  console.log(`- Testnet Configuration: ${TESTNET ? "Enabled" : "Disabled"}`);
  console.log(`- API Key Status: ${API_KEY}`);

  if (!API_KEY || !API_SECRET) {
    console.error("\n❌ ERROR: Invalid API Keys.");
    console.error(
      "Please update your BYBIT_API_KEY and BYBIT_API_SECRET in the /data/exchange-hub/bybit-service/.env file.",
    );
    return;
  }

  try {
    const response = await restClient.getWalletBalance({
      accountType: "UNIFIED",
    });
    console.log("response--------------", response);
    if (response.retCode === 0) {
      console.log("\n✅ Connection Successful!");
      console.log("--- Account Information ---");
      const list = response.result.list[0];
      console.log(`Total Equity: ${list?.totalEquity || 0} USD`);
      console.log(`Account Type: ${list?.accountType || "N/A"}`);
      console.log("---------------------------");
    } else {
      console.error("\n❌ Connection Failed. Bybit returned an error:");
      console.error(response.retMsg);
    }
  } catch (err: any) {
    console.error("\n❌ Network or unexpected error occurred:");
    console.error(err.message);
  }
}

checkConnection();
