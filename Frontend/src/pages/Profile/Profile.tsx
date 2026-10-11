import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { setUser } from "../../store/slice/auth/authSlice";
import api from "../../utils/api";
import { Button, Input, Badge } from "../../lib/ui";
import { validateIndianPhoneNumber, INDIAN_PHONE_PLACEHOLDER } from "../../utils/phoneUtils";
import {
  User as UserIcon,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import styles from "./Profile.module.scss";

export const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setErrorMessage("Phone number is required.");
      return;
    } else if (!validateIndianPhoneNumber(formData.phoneNumber)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (e.g., 9876543210 or +91 98765 43210).");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/auth/me", {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      });

      if (res.data?.data?.user) {
        dispatch(setUser(res.data.data.user));
        setSuccessMessage("Your profile information was updated successfully.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.profileContainer}>
      {}
      <div className={styles.profileHeader}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>
            Manage your personal profile details and view employment records.
          </p>
        </div>
      </div>

      {}
      <div className={styles.bannerCard}>
        <div className={styles.avatarSection}>
          <div className={styles.largeAvatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.identityInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userEmail}>{user.email}</span>
            <div className={styles.badges}>
              <span className={styles.roleBadge}>
                <Shield size={12} />
                {user.role.replace("_", " ")}
              </span>
              <Badge variant={user.status === "Active" ? "success" : "neutral"} size="sm">
                {user.status}
              </Badge>
              {user.isVerified && (
                <Badge variant="info" size="sm">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className={styles.bannerStats}>
          <div className={styles.statItem}>
            <span className={statStyles(styles.statLabel)}>Designation</span>
            <span className={styles.statValue}>{user.designation}</span>
          </div>
          <div className={styles.statItem}>
            <span className={statStyles(styles.statLabel)}>Department</span>
            <span className={styles.statValue}>{user.department}</span>
          </div>
        </div>
      </div>

      {}
      <div className={styles.contentGrid}>
        {}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <Briefcase size={18} />
            <span className={styles.sectionTitle}>Company Details</span>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email (Login ID)</span>
              <span className={styles.infoValue}>
                <Mail size={13} style={{ display: "inline", marginRight: "6px" }} />
                {user.email}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>
                <Building size={13} style={{ display: "inline", marginRight: "6px" }} />
                {user.department}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Designation</span>
              <span className={styles.infoValue}>
                <FileCheck size={13} style={{ display: "inline", marginRight: "6px" }} />
                {user.designation}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Joining Date</span>
              <span className={styles.infoValue}>
                <Calendar size={13} style={{ display: "inline", marginRight: "6px" }} />
                {new Date(user.joiningDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Employment Status</span>
              <span className={styles.infoValue}>{user.status}</span>
            </div>
          </div>
        </div>

        {}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <UserIcon size={18} />
            <span className={styles.sectionTitle}>Personal Information</span>
          </div>

          {successMessage && (
            <div className={`${styles.alertBox} ${styles.success}`}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className={`${styles.alertBox} ${styles.error}`}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.editForm}>
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Phone Number"
              placeholder={INDIAN_PHONE_PLACEHOLDER}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
            />

            <div className={styles.formNotice}>
              Notice: Your department, designation, role, and email are company-managed credentials. If any of those need modification, reach out to your Project Manager or Owner.
            </div>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


function statStyles(className: string) {
  return className;
}

export default Profile;
