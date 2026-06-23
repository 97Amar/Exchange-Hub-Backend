import { sendMail } from "./src/grpc/client/mail.client";

async function test() {
  try {
    console.log("Starting gRPC test...");
    const res: any = await sendMail("amarjeet_final@yopmail.com", "Final Test", '{"service":"ONBOARD"}');
    console.log("Result:", res);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
