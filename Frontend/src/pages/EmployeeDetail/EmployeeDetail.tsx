import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../utils/api";
import { Badge, Skeleton, Button, Modal, Input, Select } from "../../lib/ui";
import { DEPARTMENTS, DESIGNATIONS, USER_STATUSES } from "../../lib/data/enums";
import { validateIndianPhoneNumber, INDIAN_PHONE_PLACEHOLDER } from "../../utils/phoneUtils";
import {
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  FileCheck,
  ChevronRight,
  Edit2,
  ShieldAlert,
} from "lucide-react";
import styles from "./EmployeeDetail.module.scss";

interface EmployeeRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  designation: string;
  department: string;
  joiningDate: string;
  status: string;
  isVerified: boolean;
}

interface AssignedProject {
  _id: string;
  projectName: string;
  status: string;
  priority: string;
  startDate: string;
  deadline: string;
  projectManager?: {
    _id: string;
    name: string;
    email: string;
  };
}

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isOwner = currentUser?.role === "owner";
  const isPM = currentUser?.role === "project_manager";

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    designation: "",
    department: "",
    joiningDate: "",
    status: "Active",
    role: "employee",
    password: "",
  });

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/employees/${id}`);
      const empData: EmployeeRecord = res.data.data.employee;
      const projData: AssignedProject[] = res.data.data.projects || [];
      setEmployee(empData);
      setProjects(projData);

      setFormData({
        name: empData.name,
        phoneNumber: empData.phoneNumber,
        designation: empData.designation,
        department: empData.department,
        joiningDate: empData.joiningDate ? empData.joiningDate.split("T")[0] : "",
        status: empData.status,
        role: empData.role,
        password: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id, fetchEmployee]);

  // Authorization check: Owner OR PM who manages at least one of this employee's projects
  const canEditEmployee =
    isOwner ||
    (isPM &&
      projects.some(
        (p) => p.projectManager && p.projectManager._id === currentUser?._id
      ));

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (formData.phoneNumber && !validateIndianPhoneNumber(formData.phoneNumber)) {
      setModalError("Please enter a valid 10-digit Indian phone number (e.g. 9876543210 or +91 98765 43210).");
      return;
    }

    setModalLoading(true);

    try {
      const updatePayload: any = { ...formData };
      if (!updatePayload.password) delete updatePayload.password;
      // If PM is editing, don't submit role field unless Owner
      if (!isOwner) delete updatePayload.role;

      await api.put(`/employees/${id}`, updatePayload);
      setIsEditModalOpen(false);
      fetchEmployee();
    } catch (err: any) {
      setModalError(
        err.response?.data?.message || "Failed to update employee details."
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <Skeleton height={32} width={100} />
        <Skeleton height={140} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className={styles.detailContainer}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/employees")}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
        <div className={styles.headerCard}>
          <p style={{ color: "var(--semantic-error)" }}>{error || "Employee not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      <button type="button" className={styles.backBtn} onClick={() => navigate("/employees")}>
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Header Profile Card */}
      <div className={styles.headerCard}>
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.identityInfo}>
            <h1 className={styles.name}>{employee.name}</h1>
            <span className={styles.email}>{employee.email}</span>
            <div className={styles.badges}>
              <span className={styles.roleBadge}>
                <Shield size={12} />
                {employee.role.replace("_", " ")}
              </span>
              <Badge variant={employee.status === "Active" ? "success" : "neutral"} size="sm">
                {employee.status}
              </Badge>
              {employee.isVerified && (
                <Badge variant="info" size="sm">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {canEditEmployee && (
            <Button
              variant="primary"
              size="sm"
              icon={<Edit2 size={15} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Employee
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={() => navigate("/employees")}>
            View Directory
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column: Personnel Info */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleGroup}>
              <Briefcase size={18} />
              <span className={styles.sectionTitle}>Employee Profile</span>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>
                <Building size={13} style={{ display: "inline", marginRight: "6px" }} />
                {employee.department}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Designation</span>
              <span className={styles.infoValue}>
                <FileCheck size={13} style={{ display: "inline", marginRight: "6px" }} />
                {employee.designation}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Contact Phone</span>
              <span className={styles.infoValue}>
                <Phone size={13} style={{ display: "inline", marginRight: "6px" }} />
                {employee.phoneNumber}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>
                <Mail size={13} style={{ display: "inline", marginRight: "6px" }} />
                {employee.email}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Joining Date</span>
              <span className={styles.infoValue}>
                <Calendar size={13} style={{ display: "inline", marginRight: "6px" }} />
                {new Date(employee.joiningDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Projects */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleGroup}>
              <Briefcase size={18} />
              <span className={styles.sectionTitle}>Assigned Projects ({projects.length})</span>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className={styles.emptyProjects}>
              <Briefcase size={28} />
              <p>No active project assignments.</p>
            </div>
          ) : (
            <div className={styles.projectList}>
              {projects.map((proj: AssignedProject) => (
                <div
                  key={proj._id}
                  className={styles.projectCard}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                >
                  <div className={styles.projectInfo}>
                    <span className={styles.projectName}>{proj.projectName}</span>
                    <span className={styles.projectManager}>
                      PM: {proj.projectManager?.name || "Unassigned"} • Due{" "}
                      {new Date(proj.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.projectMeta}>
                    <Badge
                      variant={
                        proj.status === "Completed"
                          ? "success"
                          : proj.status === "In Progress"
                          ? "lime"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {proj.status}
                    </Badge>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Employee Modal */}
      {canEditEmployee && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Employee - ${employee.name}`}
          maxWidth="md"
        >
          {modalError && (
            <div className={styles.modalErrorAlert}>
              <ShieldAlert size={16} />
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleModalSubmit} className={styles.modalForm}>
            <div className={styles.modalRow}>
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
            </div>

            <div className={styles.modalRow}>
              <Select
                label="Department"
                options={DEPARTMENTS as unknown as string[]}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
              <Select
                label="Designation"
                options={DESIGNATIONS as unknown as string[]}
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>

            <div className={styles.modalRow}>
              <Select
                label="Status"
                options={USER_STATUSES as unknown as string[]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              />
              <Input
                label="Joining Date"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                required
              />
            </div>

            {isOwner && (
              <div className={styles.modalRow}>
                <Select
                  label="System Role"
                  options={[
                    { value: "employee", label: "Employee" },
                    { value: "project_manager", label: "Project Manager" },
                    { value: "owner", label: "Owner / Admin" },
                  ]}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
                <Input
                  label="Reset Password (Optional)"
                  isPassword
                  placeholder="Leave empty to keep current"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}

            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={modalLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDetail;
