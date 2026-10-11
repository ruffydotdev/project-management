import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { loginUser } from "../../store/slice/auth/authSlice";
import { Input, Button } from "../../lib/ui";
import { ShieldAlert } from "lucide-react";
import styles from "./Login.module.scss";

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, verificationEmail } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(loginUser({ email: email.trim(), password }));
    if (loginUser.fulfilled.match(result)) {
      navigate("/");
    } else if (
      loginUser.rejected.match(result) &&
      (result.payload as any)?.requiresVerification
    ) {
      navigate(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoMark} />
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your EMPMS dashboard account</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {verificationEmail && (
          <div className={styles.infoAlert}>
            <span>Your account requires email verification.</span>
            <Link
              to={`/auth/verify-email?email=${encodeURIComponent(verificationEmail)}`}
              className={styles.verifyLink}
            >
              Verify now
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
            }}
            error={formErrors.email}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
            }}
            error={formErrors.password}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitBtn}
          >
            Sign in
          </Button>
        </form>

        <div className={styles.footer}>
          Don't have an account?{" "}
          <Link to="/auth/signup" className={styles.link}>
            Register
          </Link>
        </div>

        <div className={styles.credentialsHint}>
          <span>Demo Credentials:</span>
          <code>owner@empms.com / Password@123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
