import db from "./models";

async function checkDb() {
  try {
    const otps = await db.Otp.findAll();
    console.log("OTPs in DB:", JSON.parse(JSON.stringify(otps)));

    const notifications = await db.OtpNotification.findAll();
    console.log("Notifications in DB:", JSON.parse(JSON.stringify(notifications)));
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking DB:", error);
    process.exit(1);
  }
}

checkDb();
