import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

// Cryptographically secure 6-digit OTP
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Hash strings (like OTPs) with SHA-256
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Bcrypt password hash
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Bcrypt password compare
export const comparePassword = async (
  enteredPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(enteredPassword, hashedPassword);
};

// Generate JWT Access Token (stateless)
export const generateAccessToken = (user: any): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any,
  };

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_ACCESS_SECRET || "empms_access_default_secret",
    options
  );
};

// Generate JWT Refresh Token (stateless, verified cryptographically by secret)
export const generateRefreshToken = (user: any): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
  };

  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET || "empms_refresh_default_secret",
    options
  );
};

// Verify JWT Refresh Token cryptographically
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "empms_refresh_default_secret"
    ) as JwtPayload;
  } catch {
    return null;
  }
};
