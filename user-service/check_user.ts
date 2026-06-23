import * as DbModel from "./models";
import bcrypt from "bcrypt";
import { initDatabase } from "./src/database/database";

async function checkUser() {
    try {
        await initDatabase();
        const email = "debug_user_1776685795@test.com";
        const user = await DbModel.UserRegister.findOne({ where: { email } });
        if (user) {
            console.log("Debug user found:");
            console.log("Email:", user.email);
            console.log("DB Hash:", user.password);
            const testPassword = "Admin@123";
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log("Test bcrypt compare with 'Admin@123':", isMatch);
        } else {
            console.log("Debug user not found.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}

checkUser();
