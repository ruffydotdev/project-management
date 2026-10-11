import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import api from "../../utils/api";
import {
  Button,
  Input,
  Select,
  Badge,
  Pagination,
  Modal,
  Skeleton,
  EmptyState,
} from "../../lib/ui";
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from "../../lib/data/enums";
import { MemberSelectDropdown } from "../../components/MemberSelectDropdown/MemberSelectDropdown";
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import styles from "./Projects.module.scss";

interface UserRef {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  department?: string;
}

interface ProjectItem {
  _id: string;
  projectName: string;
  description: string;
  startDate: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed";
  projectManager: UserRef;
  assignedEmployees: UserRef[];
  createdAt: string;
}

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const initialPriority = searchParams.get("priority") || "";

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isOwner = currentUser?.role === "owner";
  const isPM = currentUser?.role === "project_manager";
  const canManageProjects = isOwner || isPM;

  
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [availableManagers, setAvailableManagers] = useState<UserRef[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<UserRef[]>([]);

  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedPriority, setSelectedPriority] = useState(initialPriority);

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    priority: "Medium",
    status: "Pending",
    projectManager: "",
    assignedEmployees: [] as string[],
  });

  
  const fetchAssignmentOptions = async () => {
    try {
      const [resPM, resEmp] = await Promise.all([
        api.get("/employees?role=project_manager&limit=100"),
        api.get("/employees?limit=100"),
      ]);
      setAvailableManagers(resPM.data.data);
      setAvailableEmployees(resEmp.data.data);
    } catch (err) {
      console.error("Failed to fetch assignment users", err);
    }
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
      };

      const res = await api.get("/projects", { params });
      setProjects(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.total);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedStatus, selectedPriority]);

  useEffect(() => {
    fetchProjects();
    if (canManageProjects) {
      fetchAssignmentOptions();
    }
  }, [fetchProjects, canManageProjects]);

  
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      projectName: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "Medium",
      status: "Pending",
      projectManager: currentUser?.role === "project_manager" ? currentUser._id : (availableManagers[0]?._id || ""),
      assignedEmployees: [],
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  
  const handleOpenEdit = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormData({
      projectName: proj.projectName,
      description: proj.description,
      startDate: proj.startDate ? proj.startDate.split("T")[0] : "",
      deadline: proj.deadline ? proj.deadline.split("T")[0] : "",
      priority: proj.priority,
      status: proj.status,
      projectManager: proj.projectManager?._id || "",
      assignedEmployees: proj.assignedEmployees.map((e) => e._id),
    });
    setModalError(null);
    setIsModalOpen(true);
  };



  const handleDeleteProject = async (proj: ProjectItem) => {
    if (!window.confirm(`Are you sure you want to delete project "${proj.projectName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${proj._id}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (new Date(formData.deadline) < new Date(formData.startDate)) {
      setModalError("Deadline cannot be earlier than start date.");
      return;
    }

    setModalLoading(true);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
      } else {
        await api.post("/projects", formData);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setModalError(
        err.response?.data?.message || "Failed to save project. Please check the fields."
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            Monitor development roadmaps, milestones, and assigned team members.
          </p>
        </div>
        {canManageProjects && (
          <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={handleOpenCreate}>
            New Project
          </Button>
        )}
      </div>

      {}
      <div className={styles.filterToolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by project name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.selectFilters}>
          <Select
            placeholder="All Statuses"
            options={PROJECT_STATUSES as unknown as string[]}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          />

          <Select
            placeholder="All Priorities"
            options={PROJECT_PRIORITIES as unknown as string[]}
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          />
        </div>
      </div>

      {}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Project Manager</th>
                <th>Team</th>
                {canManageProjects && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height={20} width={180} /></td>
                    <td><Skeleton height={20} width={140} /></td>
                    <td><Skeleton height={20} width={70} /></td>
                    <td><Skeleton height={20} width={80} /></td>
                    <td><Skeleton height={20} width={120} /></td>
                    <td><Skeleton height={20} width={120} /></td>
                    {canManageProjects && <td><Skeleton height={20} width={40} /></td>}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={canManageProjects ? 7 : 6}>
                    <EmptyState
                      icon={<Briefcase size={32} />}
                      title="No projects found"
                      description="No projects match your current filters. Create a new project to get started."
                      action={
                        canManageProjects ? (
                          <Button variant="secondary" size="sm" onClick={handleOpenCreate}>
                            Create Project
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const canEditThis =
                    isOwner ||
                    (isPM && proj.projectManager?._id === currentUser?._id);

                  return (
                    <tr
                      key={proj._id}
                      onClick={() => navigate(`/projects/${proj._id}`)}
                      className={styles.clickableRow}
                    >
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.projectName}>{proj.projectName}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.timelineCell}>
                          <span className={styles.deadline}>
                            {new Date(proj.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            proj.priority === "High"
                              ? "error"
                              : proj.priority === "Medium"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {proj.priority}
                        </Badge>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <span className={styles.pmName}>
                          {proj.projectManager?.name || "Unassigned"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.assignedTeam}>
                          <span className={styles.teamBadge}>
                            {proj.assignedEmployees?.length || 0} members
                          </span>
                        </div>
                      </td>
                      {canManageProjects && (
                        <td onClick={(e) => e.stopPropagation()}>
                          {canEditThis ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                onClick={() => handleOpenEdit(proj)}
                                title="Edit project"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                style={{ color: "var(--color-danger, #ef4444)" }}
                                onClick={() => handleDeleteProject(proj)}
                                title="Delete project"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <span className={styles.readOnlyText}>View only</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={limit}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(sz) => {
            setLimit(sz);
            setPage(1);
          }}
          itemLabel="projects"
        />
      </div>

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Edit Project" : "Create New Project"}
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
            placeholder="e.g. Real-time Telemetry Dashboard"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            required
          />

          <div className={styles.formGroup}>
            <label className={styles.textareaLabel}>Description</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Outline project objectives and milestones..."
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

          {}
          {isOwner && (
            <Select
              label="Assign Project Manager"
              options={availableManagers.map((m) => ({ value: m._id, label: `${m.name} (${m.email})` }))}
              value={formData.projectManager}
              onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
              required
            />
          )}

          {}
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
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={modalLoading}>
              {editingProject ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
