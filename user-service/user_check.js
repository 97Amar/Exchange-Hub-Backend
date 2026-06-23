const db = require("./models");

async function checkUser() {
  try {
    const user = await db.UserRegister.findOne({ where: { email: "amarjeet@yopmail.com" } });
    if (user) {
      console.log("User found:", JSON.stringify(user, null, 2));
    } else {
      console.log("User not found.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error checking user:", error);
    process.exit(1);
  }
}

// We need to initialize the models
// Usually index.js does this if we require it
checkUser();
