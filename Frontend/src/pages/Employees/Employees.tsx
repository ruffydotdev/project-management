import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
import { DEPARTMENTS, DESIGNATIONS, USER_STATUSES } from "../../lib/data/enums";
import { validateIndianPhoneNumber, INDIAN_PHONE_PLACEHOLDER } from "../../utils/phoneUtils";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import styles from "./Employees.module.scss";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "project_manager" | "employee";
  phoneNumber: string;
  designation: string;
  department: string;
  joiningDate: string;
  status: "Active" | "Inactive";
  isVerified: boolean;
}

export const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isOwner = currentUser?.role === "owner";
  const isPM = currentUser?.role === "project_manager";
  const canEdit = isOwner || isPM;

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    phoneNumber: "",
    designation: "",
    department: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        search: search.trim() || undefined,
        department: selectedDept || undefined,
        status: selectedStatus || undefined,
      };

      const res = await api.get("/employees", { params });
      setEmployees(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.total);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      phoneNumber: "",
      designation: "",
      department: "",
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "", // Optional on edit
      role: emp.role,
      phoneNumber: emp.phoneNumber,
      designation: emp.designation,
      department: emp.department,
      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
      status: emp.status,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!window.confirm(`Are you sure you want to delete employee "${emp.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/employees/${emp._id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete employee.");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (formData.phoneNumber && !validateIndianPhoneNumber(formData.phoneNumber)) {
      setModalError("Please enter a valid 10-digit Indian phone number (e.g. 9876543210 or +91 98765 43210).");
      return;
    }

    setModalLoading(true);

    try {
      if (editingEmployee) {
        // Edit flow
        const updatePayload: any = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;
        await api.put(`/employees/${editingEmployee._id}`, updatePayload);
      } else {
        // Create flow
        await api.post("/employees", formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setModalError(
        err.response?.data?.message || "Failed to save employee. Please verify all fields."
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employee Directory</h1>
          <p className={styles.subtitle}>
            Manage and view company personnel, departments, and roles.
          </p>
        </div>
        {isOwner && (
          <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={handleOpenCreate}>
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or email..."
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
            placeholder="All Departments"
            options={DEPARTMENTS as unknown as string[]}
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          />

          <Select
            placeholder="All Statuses"
            options={USER_STATUSES as unknown as string[]}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton height={20} width={120} /></td>
                    <td><Skeleton height={20} width={140} /></td>
                    <td><Skeleton height={20} width={110} /></td>
                    <td><Skeleton height={20} width={130} /></td>
                    <td><Skeleton height={20} width={90} /></td>
                    <td><Skeleton height={20} width={60} /></td>
                    {canEdit && <td><Skeleton height={20} width={40} /></td>}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6}>
                    <EmptyState
                      icon={<Users size={32} />}
                      title="No employees found"
                      description="Try adjusting your search criteria or add a new team member."
                      action={
                        isOwner ? (
                          <Button variant="secondary" size="sm" onClick={handleOpenCreate}>
                            Add Employee
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp._id}
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    className={styles.clickableRow}
                  >
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.nameDetails}>
                          <span className={styles.empName}>{emp.name}</span>
                          <span className={styles.empEmail}>{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.roleCell}>
                        <span className={styles.designation}>{emp.designation}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.department}>{emp.department}</span>
                    </td>
                    <td>
                      <Badge
                        variant={emp.status === "Active" ? "success" : "neutral"}
                        size="sm"
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit employee details"
                          >
                            <Edit2 size={15} />
                          </button>
                          {isOwner && (
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              style={{ color: "var(--color-danger, #ef4444)" }}
                              onClick={() => handleDeleteEmployee(emp)}
                              title="Delete employee"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
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
          itemLabel="employees"
        />
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
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
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingEmployee} // Email immutable once registered
              required
            />
          </div>

          <div className={styles.modalRow}>
            <Input
              label={editingEmployee ? "Reset Password (Leave blank to keep)" : "Password"}
              isPassword
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
              placeholder={editingEmployee ? "••••••••" : "Min 8 chars, Aa1@"}
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
            <Select
              label="Status"
              options={USER_STATUSES as unknown as string[]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            />
          </div>

          <div className={styles.modalRow}>
            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              required
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
              {editingEmployee ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;
