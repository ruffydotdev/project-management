import mongoose from "mongoose";
import User from "../models/User.js";
import Project from "../models/Project.js";
import { ROLES, DEPARTMENTS, DESIGNATIONS, USER_STATUSES } from "../constants/enums.js";
import { hashPassword } from "../utils/tokenUtils.js";
import { validatePasswordStrength, validateEmail, validateIndianPhoneNumber, formatIndianPhoneNumber } from "../utils/validators.js";

// GET /api/employees
export const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      department,
      designation,
      status,
      role,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    // Role-based visibility scoping
    if (req.user.role === ROLES.OWNER) {
      // Owner sees all
    } else if (req.user.role === ROLES.PROJECT_MANAGER) {
      // PM sees themselves and employees who are assigned to PM's projects
      const myProjects = await Project.find({ projectManager: req.user._id }).select("assignedEmployees");
      const assignedEmployeeIds = new Set<string>();
      assignedEmployeeIds.add(req.user._id.toString());
      myProjects.forEach((p) => {
        p.assignedEmployees.forEach((empId) => assignedEmployeeIds.add(empId.toString()));
      });
      query._id = { $in: Array.from(assignedEmployeeIds).map((id) => new mongoose.Types.ObjectId(id)) };
    } else {
      // Employee only sees colleagues on their assigned projects + themselves
      const myProjects = await Project.find({ assignedEmployees: req.user._id }).select("assignedEmployees projectManager");
      const colleagueIds = new Set<string>();
      colleagueIds.add(req.user._id.toString());
      myProjects.forEach((p) => {
        if (p.projectManager) colleagueIds.add(p.projectManager.toString());
        p.assignedEmployees.forEach((empId) => colleagueIds.add(empId.toString()));
      });
      query._id = { $in: Array.from(colleagueIds).map((id) => new mongoose.Types.ObjectId(id)) };
    }

    // Search by name or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Filter by department
    if (department && DEPARTMENTS.includes(department)) {
      query.department = department;
    }

    // Filter by designation
    if (designation && DESIGNATIONS.includes(designation)) {
      query.designation = designation;
    }

    // Filter by status
    if (status && USER_STATUSES.includes(status)) {
      query.status = status;
    }

    // Filter by role
    if (role && Object.values(ROLES).includes(role)) {
      query.role = role;
    }

    const sortOptions = {};
    const validSortFields = ["name", "email", "joiningDate", "createdAt", "department", "designation", "status"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select("-password -emailVerificationOTP -emailVerificationOTPExpires -refreshTokens");

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees (Owner only)
export const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = ROLES.EMPLOYEE,
      phoneNumber,
      designation,
      department,
      joiningDate,
      status = "Active",
    } = req.body;

    const errors = [];

    if (!name || !name.trim()) errors.push({ field: "name", message: "Name is required" });
    if (!email || !validateEmail(email)) errors.push({ field: "email", message: "Valid email is required" });
    if (!password || !validatePasswordStrength(password)) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 chars and include uppercase, lowercase, number, and special symbol.",
      });
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      errors.push({ field: "phoneNumber", message: "Phone number is required" });
    } else if (!validateIndianPhoneNumber(phoneNumber)) {
      errors.push({
        field: "phoneNumber",
        message: "Please enter a valid 10-digit Indian mobile number (e.g., +91 98765 43210 or 9876543210)",
      });
    }
    if (!designation || !DESIGNATIONS.includes(designation)) errors.push({ field: "designation", message: "Invalid designation" });
    if (!department || !DEPARTMENTS.includes(department)) errors.push({ field: "department", message: "Invalid department" });
    if (!joiningDate) errors.push({ field: "joiningDate", message: "Joining date is required" });
    if (role && !Object.values(ROLES).includes(role)) errors.push({ field: "role", message: "Invalid role specified" });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
        errors: [{ field: "email", message: "An employee with this email already exists" }],
      });
    }

    const hashedPassword = await hashPassword(password);
    const formattedPhone = formatIndianPhoneNumber(phoneNumber.trim());

    // Direct creation by owner sets isVerified: true
    const newEmployee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phoneNumber: formattedPhone,
      designation,
      department,
      joiningDate: new Date(joiningDate),
      status,
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: newEmployee.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id (Owner only)
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format",
      });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // If requester is a Project Manager, ensure employee is assigned to at least one of their projects
    if (req.user.role === ROLES.PROJECT_MANAGER && !employee._id.equals(req.user._id)) {
      const pmProject = await Project.findOne({
        projectManager: req.user._id,
        assignedEmployees: employee._id,
      });
      if (!pmProject) {
        return res.status(403).json({
          success: false,
          message: "You can only update details of employees assigned to your projects.",
        });
      }
    }

    // Whitelist editable fields to prevent mass assignment
    const { name, phoneNumber, designation, department, joiningDate, status, role, password } = req.body;

    if (phoneNumber) {
      if (!validateIndianPhoneNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number (e.g., +91 98765 43210 or 9876543210)",
        });
      }
      employee.phoneNumber = formatIndianPhoneNumber(phoneNumber.trim());
    }
    if (designation && DESIGNATIONS.includes(designation)) employee.designation = designation;
    if (department && DEPARTMENTS.includes(department)) employee.department = department;
    if (joiningDate) employee.joiningDate = new Date(joiningDate);
    if (status && USER_STATUSES.includes(status)) employee.status = status;

    // Prevent accidental self-demotion or removal of the last owner
    if (role && Object.values(ROLES).includes(role)) {
      if (employee._id.equals(req.user._id) && role !== ROLES.OWNER) {
        return res.status(400).json({
          success: false,
          message: "You cannot demote your own owner account.",
        });
      }
      employee.role = role;
    }

    if (password) {
      if (!validatePasswordStrength(password)) {
        return res.status(400).json({
          success: false,
          message: "Password does not meet complexity requirements",
        });
      }
      employee.password = await hashPassword(password);
    }

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format",
      });
    }

    // Only Owner can delete employees
    if (req.user.role !== ROLES.OWNER) {
      return res.status(403).json({
        success: false,
        message: "Only the system owner can delete employees.",
      });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Prevent owner from deleting their own account
    if (employee._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    // Remove employee from all assigned project arrays
    await Project.updateMany(
      { assignedEmployees: employee._id },
      { $pull: { assignedEmployees: employee._id } }
    );

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format",
      });
    }

    const employee = await User.findById(id).select(
      "-password -emailVerificationOTP -emailVerificationOTPExpires -refreshTokens"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Role-based scoping check
    if (req.user.role === ROLES.OWNER) {
      // Owner can see any employee
    } else if (req.user.role === ROLES.PROJECT_MANAGER) {
      // PM can see themselves and employees assigned to their projects
      if (!employee._id.equals(req.user._id)) {
        const sharedProject = await Project.findOne({
          projectManager: req.user._id,
          assignedEmployees: employee._id,
        });
        if (!sharedProject) {
          return res.status(403).json({
            success: false,
            message: "Access denied to this employee record",
          });
        }
      }
    } else {
      // Employee can see themselves or colleagues on the same project
      if (!employee._id.equals(req.user._id)) {
        const sharedProject = await Project.findOne({
          assignedEmployees: req.user._id,
          $or: [
            { assignedEmployees: employee._id },
            { projectManager: employee._id },
          ],
        });
        if (!sharedProject) {
          return res.status(403).json({
            success: false,
            message: "Access denied to this employee record",
          });
        }
      }
    }

    // Also fetch projects associated with this employee
    const employeeProjects = await Project.find({
      $or: [{ assignedEmployees: employee._id }, { projectManager: employee._id }],
    })
      .select("projectName status priority startDate deadline projectManager")
      .populate("projectManager", "name email");

    return res.status(200).json({
      success: true,
      data: {
        employee: employee.toSafeObject(),
        projects: employeeProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};
