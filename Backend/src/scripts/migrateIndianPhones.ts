import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const updatePhonesToIndian = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/empms_db";
    await mongoose.connect(mongoUri);
    console.log("[Indian Phone Migration] Connected to MongoDB.");

    const users = await User.find({});
    console.log(`[Indian Phone Migration] Updating ${users.length} users...`);

    let count = 0;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      let newPhone = "";
      if (u.role === "owner") {
        newPhone = "+91 98200 11000";
      } else if (u.role === "project_manager") {
        const idx = (i % 3) + 1;
        newPhone = `+91 98200 2200${idx}`;
      } else {
        const suffix = (1000 + (i % 8999)).toString().padStart(4, "0");
        newPhone = `+91 98199 ${suffix}`;
      }
      u.phoneNumber = newPhone;
      await u.save();
      count++;
      console.log(`Updated: ${u.name} (${u.role}) -> ${newPhone}`);
    }

    console.log(`\nSuccessfully migrated ${count} users to Indian phone format.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("[Migration Error]", err);
    process.exit(1);
  }
};

updatePhonesToIndian();
