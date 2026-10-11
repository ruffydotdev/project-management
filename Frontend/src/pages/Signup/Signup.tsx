import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../utils/api";
import { Input, Select, Button } from "../../lib/ui";
import { DEPARTMENTS, DESIGNATIONS } from "../../lib/data/enums";
import { validateIndianPhoneNumber, INDIAN_PHONE_PLACEHOLDER } from "../../utils/phoneUtils";
import { Check, X, ShieldAlert } from "lucide-react";
import styles from "./Signup.module.scss";

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    department: "",
    designation: "",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password rules validation
  const passwordRules = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*?&^#()_+=\-[\]{}|;:,.<>~`]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = "Enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = "Phone number is required";
    } else if (!validateIndianPhoneNumber(formData.phoneNumber)) {
      errs.phoneNumber = "Enter a valid 10-digit Indian phone number (e.g. 9876543210 or +91 98765 43210)";
    }
    if (!formData.department) errs.department = "Department is required";
    if (!formData.designation) errs.designation = "Designation is required";
    if (!formData.joiningDate) errs.joiningDate = "Joining date is required";

    if (!formData.password) {
      errs.password = "Password is required";
    } else if (!isPasswordValid) {
      errs.password = "Password does not meet all security requirements";
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post("/auth/register", formData);
      navigate(`/auth/verify-email?email=${encodeURIComponent(formData.email.trim())}`);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        err.response.data.errors.forEach((e: { field: string; message: string }) => {
          fieldErrors[e.field] = e.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setGeneralError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoMark} />
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Register for EMPMS employee access</p>
        </div>

        {generalError && (
          <div className={styles.errorAlert}>
            <ShieldAlert size={16} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.row}>
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Connor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
          </div>

          <div className={styles.row}>
            <Input
              label="Phone Number"
              placeholder={INDIAN_PHONE_PLACEHOLDER}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              error={formErrors.phoneNumber}
              required
            />
            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              error={formErrors.joiningDate}
              required
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Department"
              placeholder="Select department..."
              options={DEPARTMENTS as unknown as string[]}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              error={formErrors.department}
              required
            />
            <Select
              label="Designation"
              placeholder="Select designation..."
              options={DESIGNATIONS as unknown as string[]}
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              error={formErrors.designation}
              required
            />
          </div>

          <div className={styles.row}>
            <Input
              label="Password"
              isPassword
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              required
            />
            <Input
              label="Confirm Password"
              isPassword
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={formErrors.confirmPassword}
              required
            />
          </div>

          {/* Password Requirements Checklist */}
          {formData.password.length > 0 && (
            <div className={styles.passwordRules}>
              <div className={styles.ruleItem}>
                {passwordRules.length ? <Check size={14} className={styles.ruleMet} /> : <X size={14} className={styles.ruleUnmet} />}
                <span>8+ Characters</span>
              </div>
              <div className={styles.ruleItem}>
                {passwordRules.upper ? <Check size={14} className={styles.ruleMet} /> : <X size={14} className={styles.ruleUnmet} />}
                <span>Uppercase Letter</span>
              </div>
              <div className={styles.ruleItem}>
                {passwordRules.lower ? <Check size={14} className={styles.ruleMet} /> : <X size={14} className={styles.ruleUnmet} />}
                <span>Lowercase Letter</span>
              </div>
              <div className={styles.ruleItem}>
                {passwordRules.number ? <Check size={14} className={styles.ruleMet} /> : <X size={14} className={styles.ruleUnmet} />}
                <span>Number</span>
              </div>
              <div className={styles.ruleItem}>
                {passwordRules.special ? <Check size={14} className={styles.ruleMet} /> : <X size={14} className={styles.ruleUnmet} />}
                <span>Special Character</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className={styles.submitBtn}
          >
            Create account
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account?{" "}
          <Link to="/auth/login" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
