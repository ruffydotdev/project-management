import express from "express";
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateProfile);

export default router;
