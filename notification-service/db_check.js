const db = require("./models");

async function checkDb() {
  try {
    const otps = await db.Otp.findAll();
    console.log("OTPs in DB count:", otps.length);
    console.log("OTPs in DB:", JSON.stringify(otps, null, 2));

    const notifications = await db.OtpNotification.findAll();
    console.log("Notifications in DB count:", notifications.length);
    console.log("Notifications in DB:", JSON.stringify(notifications, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking DB:", error);
    process.exit(1);
  }
}

checkDb();
