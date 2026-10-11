import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../utils/api";
import { Badge, Skeleton, Button, Modal, Input, Select } from "../../lib/ui";
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from "../../lib/data/enums";
import { MemberSelectDropdown } from "../../components/MemberSelectDropdown/MemberSelectDropdown";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  Clock,
  Layers,
  Edit2,
  UserPlus,
  UserMinus,
  ShieldAlert,
} from "lucide-react";
import styles from "./ProjectDetail.module.scss";

interface UserMeta {
  _id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  phoneNumber?: string;
}

interface ProjectRecord {
  _id: string;
  projectName: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  deadline: string;
  projectManager?: UserMeta;
  assignedEmployees?: UserMeta[];
}

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isOwner = currentUser?.role === "owner";
  const isPM = currentUser?.role === "project_manager";

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Project Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Assignment resources
  const [availableEmployees, setAvailableEmployees] = useState<UserMeta[]>([]);
  const [availableManagers, setAvailableManagers] = useState<UserMeta[]>([]);

  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    startDate: "",
    deadline: "",
    priority: "Medium",
    status: "Pending",
    projectManager: "",
    assignedEmployees: [] as string[],
  });

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${id}`);
      const data: ProjectRecord = res.data.data;
      setProject(data);

      setFormData({
        projectName: data.projectName,
        description: data.description,
        startDate: data.startDate ? data.startDate.split("T")[0] : "",
        deadline: data.deadline ? data.deadline.split("T")[0] : "",
        priority: data.priority,
        status: data.status,
        projectManager: data.projectManager?._id || "",
        assignedEmployees: data.assignedEmployees ? data.assignedEmployees.map((e) => e._id) : [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAssignmentOptions = useCallback(async () => {
    try {
      const [empRes, pmRes] = await Promise.all([
        api.get("/employees?limit=100"),
        isOwner ? api.get("/employees?role=project_manager&limit=100") : Promise.resolve({ data: { data: [] } }),
      ]);
      setAvailableEmployees(empRes.data.data);
      if (isOwner) {
        setAvailableManagers(pmRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch assignment options", err);
    }
  }, [isOwner]);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchAssignmentOptions();
    }
  }, [id, fetchProject, fetchAssignmentOptions]);

  // Authorization check: Owner or Assigned PM
  const canEditProject =
    isOwner || (isPM && project?.projectManager?._id === currentUser?._id);

  // Quick remove member directly from team card
  const handleRemoveMember = async (memberId: string) => {
    if (!project || !canEditProject) return;
    try {
      const updatedAssigned = (project.assignedEmployees || [])
        .filter((e) => e._id !== memberId)
        .map((e) => e._id);

      await api.put(`/projects/${project._id}`, {
        assignedEmployees: updatedAssigned,
      });
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove member.");
    }
  };



  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      await api.put(`/projects/${id}`, formData);
      setIsEditModalOpen(false);
      fetchProject();
    } catch (err: any) {
      setModalError(
        err.response?.data?.message || "Failed to update project. Please verify inputs."
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.projectDetailContainer}>
        <Skeleton height={32} width={100} />
        <Skeleton height={140} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.projectDetailContainer}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/projects")}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className={styles.headerCard}>
          <p style={{ color: "var(--semantic-error)" }}>{error || "Project not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectDetailContainer}>
      <button type="button" className={styles.backBtn} onClick={() => navigate("/projects")}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header Project Card */}
      <div className={styles.headerCard}>
        <div className={styles.titleSection}>
          <h1 className={styles.projectName}>{project.projectName}</h1>
          <p className={styles.projectDesc}>{project.description}</p>
          <div className={styles.badges}>
            <Badge
              variant={
                project.status === "Completed"
                  ? "success"
                  : project.status === "In Progress"
                  ? "lime"
                  : "neutral"
              }
              size="sm"
            >
              {project.status}
            </Badge>

            <Badge
              variant={
                project.priority === "High"
                  ? "error"
                  : project.priority === "Medium"
                  ? "warning"
                  : "neutral"
              }
              size="sm"
            >
              {project.priority} Priority
            </Badge>
          </div>
        </div>

        <div className={styles.headerActions}>
          {canEditProject && (
            <Button
              variant="primary"
              size="sm"
              icon={<Edit2 size={15} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Project
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={() => navigate("/projects")}>
            View All Projects
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column: Timeline & Manager */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleGroup}>
              <Clock size={18} />
              <span className={styles.sectionTitle}>Project Schedule</span>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Start Date</span>
              <span className={styles.infoValue}>
                <Calendar size={13} style={{ display: "inline", marginRight: "6px" }} />
                {new Date(project.startDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Deadline</span>
              <span className={styles.infoValue}>
                <Calendar size={13} style={{ display: "inline", marginRight: "6px" }} />
                {new Date(project.deadline).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Project Manager</span>
              {project.projectManager ? (
                <span
                  className={`${styles.infoValue} ${styles.clickableUser}`}
                  onClick={() => navigate(`/employees/${project.projectManager?._id}`)}
                >
                  <User size={13} style={{ display: "inline", marginRight: "6px" }} />
                  {project.projectManager.name} ({project.projectManager.department})
                </span>
              ) : (
                <span className={styles.infoValue}>Unassigned</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>{project.status}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Team */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleGroup}>
              <Users size={18} />
              <span className={styles.sectionTitle}>
                Assigned Team Members ({project.assignedEmployees?.length || 0})
              </span>
            </div>
            {canEditProject && (
              <Button
                variant="ghost"
                size="sm"
                icon={<UserPlus size={14} />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Assign Members
              </Button>
            )}
          </div>

          {!project.assignedEmployees || project.assignedEmployees.length === 0 ? (
            <div className={styles.emptyTeam}>
              <Layers size={28} />
              <p>No team members assigned to this project yet.</p>
              {canEditProject && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<UserPlus size={14} />}
                  onClick={() => setIsEditModalOpen(true)}
                  style={{ marginTop: "12px" }}
                >
                  Assign First Member
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.teamList}>
              {project.assignedEmployees.map((emp) => (
                <div key={emp._id} className={styles.memberCard}>
                  <div
                    className={styles.memberAvatar}
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={styles.memberDetails}
                    onClick={() => navigate(`/employees/${emp._id}`)}
                  >
                    <span className={styles.memberName}>{emp.name}</span>
                    <span className={styles.memberDesignation}>
                      {emp.designation} • {emp.department}
                    </span>
                  </div>
                  {canEditProject && (
                    <button
                      type="button"
                      className={styles.removeMemberBtn}
                      onClick={() => handleRemoveMember(emp._id)}
                      title={`Remove ${emp.name} from project`}
                    >
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project & Assign Members Modal */}
      {canEditProject && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Project & Team Allocation"
          maxWidth="md"
        >
          {modalError && (
            <div className={styles.modalErrorAlert}>
              <ShieldAlert size={16} />
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleModalSubmit} className={styles.modalForm}>
            <Input
              label="Project Name"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              required
            />

            <div className={styles.formGroup}>
              <label className={styles.textareaLabel}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className={styles.modalRow}>
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>

            <div className={styles.modalRow}>
              <Select
                label="Priority"
                options={PROJECT_PRIORITIES as unknown as string[]}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              />
              <Select
                label="Status"
                options={PROJECT_STATUSES as unknown as string[]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              />
            </div>

            {/* Owner can re-assign the Project Manager */}
            {isOwner && availableManagers.length > 0 && (
              <Select
                label="Assigned Project Manager"
                options={availableManagers.map((m) => ({
                  value: m._id,
                  label: `${m.name} (${m.email})`,
                }))}
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                required
              />
            )}

            {/* Assign / Remove Team Members Dropdown */}
            <div className={styles.formGroup}>
              <MemberSelectDropdown
                label="Assign Team Members"
                options={availableEmployees}
                selectedIds={formData.assignedEmployees}
                onChange={(newIds) =>
                  setFormData({ ...formData, assignedEmployees: newIds })
                }
                placeholder="Search and assign team members..."
              />
            </div>

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

export default ProjectDetail;
