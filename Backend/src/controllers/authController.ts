import User from "../models/User.js";
import { ROLES } from "../constants/enums.js";
import {
  generateOTP,
  hashToken,
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils.js";
import { sendOTPEmail } from "../services/emailService.js";
import { validateRegisterInput, validateEmail, validateIndianPhoneNumber, formatIndianPhoneNumber } from "../utils/validators.js";


const isProduction = process.env.NODE_ENV === "production";

const getAccessTokenCookieOptions = () => ({
  httpOnly: false, 
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: 15 * 60 * 1000, 
  path: "/",
});

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true, 
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, 
  path: "/",
});


const getClearCookieOptions = (httpOnly = true) => ({
  httpOnly,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
  expires: new Date(0), 
});


export const register = async (req, res, next) => {
  try {
    const errors = validateRegisterInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const {
      name,
      email,
      password,
      phoneNumber,
      designation,
      department,
      joiningDate,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
        errors: [{ field: "email", message: "Email is already registered" }],
      });
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const hashedOTP = hashToken(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: ROLES.EMPLOYEE,
      phoneNumber: formatIndianPhoneNumber(phoneNumber.trim()),
      designation,
      department,
      joiningDate: new Date(joiningDate),
      status: "Active",
      isVerified: false,
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpires: otpExpires,
      emailVerificationLastSentAt: new Date(),
    });

    
    await sendOTPEmail(normalizedEmail, otp);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      data: {
        email: newUser.email,
        isVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOTP +emailVerificationOTPExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified. You can proceed to log in.",
      });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP was requested or code has been used. Please request a new OTP.",
      });
    }

    if (new Date() > user.emailVerificationOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const hashedInputOTP = hashToken(otp.toString().trim());
    if (hashedInputOTP !== user.emailVerificationOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check the code and try again.",
      });
    }

    
    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    user.emailVerificationLastSentAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You may now log in.",
    });
  } catch (error) {
    next(error);
  }
};


export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationLastSentAt"
    );

    
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an unverified account exists with that email, a new OTP has been sent.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified. Please log in.",
      });
    }

    
    const COOLDOWN_MS = 60 * 1000;
    if (
      user.emailVerificationLastSentAt &&
      Date.now() - new Date(user.emailVerificationLastSentAt).getTime() < COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (COOLDOWN_MS - (Date.now() - new Date(user.emailVerificationLastSentAt).getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds}s before requesting a new OTP.`,
      });
    }

    const otp = generateOTP();
    user.emailVerificationOTP = hashToken(otp);
    user.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailVerificationLastSentAt = new Date();
    await user.save();

    await sendOTPEmail(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email address.",
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      (req.headers["x-refresh-token"] as string);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || !decoded.id) {
      res.clearCookie("accessToken", getClearCookieOptions(false));
      res.clearCookie("refreshToken", getClearCookieOptions(true));
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.clearCookie("accessToken", getClearCookieOptions(false));
      res.clearCookie("refreshToken", getClearCookieOptions(true));
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (user.status !== "Active" || !user.isVerified) {
      res.clearCookie("accessToken", getClearCookieOptions(false));
      res.clearCookie("refreshToken", getClearCookieOptions(true));
      return res.status(403).json({
        success: false,
        message: "Account is no longer active or verified.",
      });
    }

    
    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, getAccessTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", getClearCookieOptions(false));
    res.clearCookie("refreshToken", getClearCookieOptions(true));

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber } = req.body;
    const user = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot be empty",
      });
    }

    if (!validateIndianPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number (e.g., +91 98765 43210 or 9876543210)",
      });
    }

    user.name = name.trim();
    user.phoneNumber = formatIndianPhoneNumber(phoneNumber.trim());
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};
