import { generateToken } from "../src/utils/jwt";
import { redisClient, connectRedis } from "../../shared/utils/redis";
import jwt from "jsonwebtoken";

const testAuth = async () => {
  console.log("🚀 Starting Redis-based Auth Verification...");

  const userId = "test-user-123";
  const payload = { id: userId, email: "test@example.com" };

  console.log("1. Generating token and storing in Redis...");
  const token = await generateToken(payload);
  console.log("Token generated:", token);

  await connectRedis();
  const storedToken = await redisClient.get(`auth:${userId}`);
  
  if (storedToken === token) {
    console.log("✅ Token successfully stored in Redis.");
  } else {
    console.log("❌ Token NOT found in Redis or mismatch.");
    process.exit(1);
  }

  console.log("2. Verifying token signature...");
  const decoded = jwt.decode(token) as any;
  if (decoded && decoded.id === userId) {
    console.log("✅ Token signature/payload is correct.");
  } else {
    console.log("❌ Token payload mismatch.");
    process.exit(1);
  }

  console.log("3. Testing revocation (deleting from Redis)...");
  await redisClient.del(`auth:${userId}`);
  const deletedToken = await redisClient.get(`auth:${userId}`);
  
  if (!deletedToken) {
    console.log("✅ Token successfully revoked from Redis.");
  } else {
    console.log("❌ Token still exists in Redis.");
    process.exit(1);
  }

  console.log("🎉 All tests passed!");
  process.exit(0);
};

testAuth().catch((err) => {
  console.error("💥 Test failed:", err);
  process.exit(1);
});
