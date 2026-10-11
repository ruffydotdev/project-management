import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { hashPassword } from "../utils/tokenUtils.js";
import { ROLES } from "../constants/enums.js";

dotenv.config();

/**
 * Creates or updates a default/dummy Owner user without clearing other data.
 */
export const seedDefaultOwner = async () => {
  const defaultOwnerData = {
    name: process.env.DEFAULT_OWNER_NAME || "Default Owner",
    email: (process.env.DEFAULT_OWNER_EMAIL || "owner@empms.com").toLowerCase().trim(),
    password: process.env.DEFAULT_OWNER_PASSWORD || "Password@123",
    role: ROLES.OWNER,
    phoneNumber: "+1 555-0100",
    designation: "Team Lead",
    department: "Engineering/Development",
    joiningDate: new Date("2023-01-01"),
    status: "Active",
    isVerified: true,
  };

  const existingOwner = await User.findOne({
    $or: [{ email: defaultOwnerData.email }, { role: ROLES.OWNER }],
  });

  if (existingOwner) {
    // If an owner already exists, ensure it is verified and active
    if (!existingOwner.isVerified || existingOwner.status !== "Active") {
      existingOwner.isVerified = true;
      existingOwner.status = "Active";
      await existingOwner.save();
      console.log(`[Seed Owner] Existing owner (${existingOwner.email}) verified and activated.`);
    } else {
      console.log(`[Seed Owner] Owner already exists: ${existingOwner.email} (Role: ${existingOwner.role})`);
    }
    return existingOwner;
  }

  const hashedPassword = await hashPassword(defaultOwnerData.password);
  const createdOwner = await User.create({
    ...defaultOwnerData,
    password: hashedPassword,
  });

  console.log("\n==========================================");
  console.log("[Seed Owner] Successfully created Default Owner!");
  console.log(`Email:    ${defaultOwnerData.email}`);
  console.log(`Password: ${defaultOwnerData.password}`);
  console.log(`Role:     ${defaultOwnerData.role}`);
  console.log("==========================================\n");

  return createdOwner;
};

// If run directly via CLI (e.g., npm run seed:owner)
const isDirectRun = process.argv[1]?.endsWith("seedOwner.js");
if (isDirectRun) {
  const run = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/empms_db";
      await mongoose.connect(mongoUri);
      console.log("[Seed Owner] Connected to MongoDB.");

      await seedDefaultOwner();

      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error("[Seed Owner Error]", err);
      process.exit(1);
    }
  };
  run();
}
