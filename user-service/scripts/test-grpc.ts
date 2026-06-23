import { sendMail } from "../src/grpc /client/mail-client";

/**
 * gRPC TEST SCRIPT
 *
 * This script allows you to manually trigger a gRPC call from the
 * User Service to the Notification Service to see if everything
 * is connected correctly.
 */

async function runTest() {
  console.log("🚀 Starting gRPC Test: User Service -> Notification Service");

  const testEmail = "learner@yopmail.com";
  const testOtp = "123456";

  try {
    console.log(`📡 Sending OTP ${testOtp} to ${testEmail}...`);

    // 1. Call the gRPC client function
    const response = await sendMail(
      testEmail,
      "Your Test OTP",
      `Your secret OTP code is: ${testOtp}`,
      testEmail, // username
      "EMAIL",
    );

    // 2. Check the response
    console.log("✅ gRPC user service side Response received:");
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Message: ${response.message}`);

    console.log(
      "\n🎊 Test Successful! Check the Notification Service logs to see the hit.",
    );
  } catch (error: any) {
    console.error("❌ gRPC Test Failed!");
    console.error(`   Error: ${error.message}`);
    console.log(
      "\n💡 Tip: Make sure the Notification Service is running on port 50051",
    );
  }
}

// Run the test
runTest();
