import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { hashPassword } from "../utils/tokenUtils.js";

dotenv.config();

const updateAllPasswords = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/empms_db";
    await mongoose.connect(mongoUri);
    console.log("[Password Reset] Connected to MongoDB.");

    const universalPassword = "Password@123";
    const hashedPassword = await hashPassword(universalPassword);

    const result = await User.updateMany({}, { $set: { password: hashedPassword } });
    console.log(`[Password Reset] Successfully updated ${result.modifiedCount} users to password: '${universalPassword}'.`);

    
    const users = await User.find({}, "name email role");
    console.log("\n--- Active Accounts with Password: Password@123 ---");
    users.forEach((u) => console.log(`• [${u.role.toUpperCase()}] ${u.name} -> ${u.email}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("[Password Reset Error]", err);
    process.exit(1);
  }
};

updateAllPasswords();
