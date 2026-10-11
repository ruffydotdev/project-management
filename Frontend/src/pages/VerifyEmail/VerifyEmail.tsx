import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import api from "../../utils/api";
import { Input, Button } from "../../lib/ui";
import { ShieldAlert, CheckCircle2, RotateCw } from "lucide-react";
import styles from "./VerifyEmail.module.scss";

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !otp.trim()) {
      setError("Please enter your email and 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify-email", {
        email: email.trim(),
        otp: otp.trim(),
      });
      setSuccessMsg(res.data.message || "Email verified! Redirecting to login...");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed. Please check the code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Please specify the email to receive the code.");
      return;
    }

    setIsResending(true);
    try {
      const res = await api.post("/auth/resend-otp", { email: email.trim() });
      setSuccessMsg(res.data.message || "A new code has been sent.");
      setCooldown(60); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoMark} />
          <h1 className={styles.title}>Verify your email</h1>
          <p className={styles.subtitle}>
            Enter the 6-digit code sent to your email address
          </p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Input
            label="6-Digit Verification Code"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            className={styles.otpInput}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitBtn}
          >
            Verify Email
          </Button>
        </form>

        <div className={styles.resendSection}>
          <span className={styles.resendPrompt}>Didn't receive the code?</span>
          <button
            type="button"
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            {isResending ? (
              <RotateCw size={14} className={styles.spin} />
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              "Resend Code"
            )}
          </button>
        </div>

        <div className={styles.footer}>
          Return to{" "}
          <Link to="/auth/login" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
