export const ROLES = {
  OWNER: "owner",
  PROJECT_MANAGER: "project_manager",
  EMPLOYEE: "employee",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const DEPARTMENTS = [
  "Engineering/Development",
  "HR",
  "Marketing",
  "Sales",
  "Finance & Accounting",
  "Operations",
  "Design",
  "QA",
  "Customer Support",
  "IT & Infrastructure",
] as const;

export type DepartmentType = typeof DEPARTMENTS[number];

export const DESIGNATIONS = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "QA Engineer",
  "DevOps Engineer",
  "Project Manager",
  "Team Lead",
  "HR Executive",
  "Marketing Executive",
  "Sales Executive",
  "Accountant",
  "Operations Executive",
  "Customer Support Executive",
  "IT Support Engineer",
] as const;

export type DesignationType = typeof DESIGNATIONS[number];

export const PROJECT_STATUSES = ["Pending", "In Progress", "Completed"] as const;
export type ProjectStatusType = typeof PROJECT_STATUSES[number];

export const PROJECT_PRIORITIES = ["Low", "Medium", "High"] as const;
export type ProjectPriorityType = typeof PROJECT_PRIORITIES[number];

export const USER_STATUSES = ["Active", "Inactive"] as const;
export type UserStatusType = typeof USER_STATUSES[number];
