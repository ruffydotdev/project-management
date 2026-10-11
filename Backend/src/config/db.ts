import mongoose from "mongoose";
import { autoSeedIfEmpty } from "../scripts/seed.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/empms_db");
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    
    await autoSeedIfEmpty(false);
  } catch (error: any) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
