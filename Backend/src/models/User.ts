import mongoose, { Document, Model } from "mongoose";
import { ROLES, DEPARTMENTS, DESIGNATIONS, USER_STATUSES } from "../constants/enums.js";

export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string;
  phoneNumber: string;
  designation: string;
  department: string;
  joiningDate: Date;
  status: string;
  isVerified: boolean;
  emailVerificationOTP?: string;
  emailVerificationOTPExpires?: Date;
  emailVerificationLastSentAt?: Date;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): Record<string, any>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      enum: DESIGNATIONS,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: DEPARTMENTS,
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "Active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },
    emailVerificationLastSentAt: {
      type: Date,
      select: false,
    },
    refreshTokens: [
      {
        tokenHash: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to return safe JSON without sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpires;
  delete obj.emailVerificationLastSentAt;
  delete obj.refreshTokens;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
