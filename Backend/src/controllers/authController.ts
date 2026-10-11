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

// Cookie configuration for tokens
const isProduction = process.env.NODE_ENV === "production";

const getAccessTokenCookieOptions = () => ({
  httpOnly: false, // Accessible to JS client for Authorization header extraction if needed
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes (matches access token expiry)
  path: "/",
});

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true, // Secure HttpOnly for maximum protection against XSS
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});

// Clear cookie options without maxAge (avoids Express deprecation notice)
const getClearCookieOptions = (httpOnly = true) => ({
  httpOnly,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
});

// POST /api/auth/register
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

    // Check existing email
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
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with forced 'employee' role (public registration must never grant privileged role)
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

    // Send OTP via email
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

// POST /api/auth/verify-email
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

    // Mark verified and clear OTP fields
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

// POST /api/auth/resend-otp
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

    // Generic response if user not found to prevent enumeration
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

    // Cooldown check (60 seconds)
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

// POST /api/auth/login
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

    // Generate stateless tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store both tokens in cookies
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

// POST /api/auth/refresh (Stateless: decode and verify JWT, grant new access token)
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

    // Decode and verify refresh token cryptographically
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

    // Generate new stateless access token and rotated refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie("accessToken", newAccessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
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

// GET /api/auth/me
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

// PUT /api/auth/me (User updates their own details: name, phoneNumber)
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
