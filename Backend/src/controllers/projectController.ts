import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { ROLES, PROJECT_STATUSES, PROJECT_PRIORITIES } from "../constants/enums.js";


export const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      priority,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    
    if (req.user.role === ROLES.OWNER) {
      
    } else if (req.user.role === ROLES.PROJECT_MANAGER) {
      
      query.projectManager = req.user._id;
    } else {
      
      query.assignedEmployees = req.user._id;
    }

    
    if (search && search.trim()) {
      query.projectName = new RegExp(search.trim(), "i");
    }

    
    if (status && PROJECT_STATUSES.includes(status)) {
      query.status = status;
    }

    
    if (priority && PROJECT_PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    const sortOptions = {};
    const validSortFields = ["projectName", "startDate", "deadline", "priority", "status", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate("projectManager", "name email designation department")
      .populate("assignedEmployees", "name email designation department")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
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


export const createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      description,
      startDate,
      deadline,
      priority = "Medium",
      status = "Pending",
      projectManager,
      assignedEmployees = [],
    } = req.body;

    const errors = [];

    if (!projectName || !projectName.trim()) errors.push({ field: "projectName", message: "Project name is required" });
    if (!description || !description.trim()) errors.push({ field: "description", message: "Description is required" });
    if (!startDate) errors.push({ field: "startDate", message: "Start date is required" });
    if (!deadline) errors.push({ field: "deadline", message: "Deadline is required" });

    if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
      errors.push({ field: "deadline", message: "Deadline must be on or after start date" });
    }

    if (!priority || !PROJECT_PRIORITIES.includes(priority)) {
      errors.push({ field: "priority", message: "Invalid priority" });
    }

    if (!status || !PROJECT_STATUSES.includes(status)) {
      errors.push({ field: "status", message: "Invalid status" });
    }

    
    let pmId = projectManager;
    if (req.user.role === ROLES.PROJECT_MANAGER) {
      
      pmId = req.user._id;
    } else if (!pmId || !mongoose.Types.ObjectId.isValid(pmId)) {
      errors.push({ field: "projectManager", message: "Valid project manager is required" });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    
    const pmUser = await User.findById(pmId);
    if (!pmUser || (pmUser.role !== ROLES.PROJECT_MANAGER && pmUser.role !== ROLES.OWNER)) {
      return res.status(400).json({
        success: false,
        message: "Assigned user is not an eligible Project Manager",
        errors: [{ field: "projectManager", message: "Selected user does not have project manager privileges" }],
      });
    }

    
    const validEmployeeIds = [];
    if (Array.isArray(assignedEmployees) && assignedEmployees.length > 0) {
      for (const empId of assignedEmployees) {
        if (!mongoose.Types.ObjectId.isValid(empId)) continue;
        const emp = await User.findById(empId);
        if (emp && emp.status === "Active") {
          validEmployeeIds.push(emp._id);
        }
      }
    }

    const newProject = await Project.create({
      projectName: projectName.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      deadline: new Date(deadline),
      priority,
      status,
      projectManager: pmUser._id,
      assignedEmployees: validEmployeeIds,
    });

    const populated = await Project.findById(newProject._id)
      .populate("projectManager", "name email designation department")
      .populate("assignedEmployees", "name email designation department");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};


export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    
    if (req.user.role === ROLES.PROJECT_MANAGER && !project.projectManager.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update projects assigned to you as Project Manager.",
      });
    }

    
    if (req.user.role === ROLES.EMPLOYEE) {
      return res.status(403).json({
        success: false,
        message: "Employees have read-only access to projects.",
      });
    }

    const {
      projectName,
      description,
      startDate,
      deadline,
      priority,
      status,
      projectManager,
      assignedEmployees,
    } = req.body;

    if (projectName) project.projectName = projectName.trim();
    if (description) project.description = description.trim();
    if (startDate) project.startDate = new Date(startDate);
    if (deadline) project.deadline = new Date(deadline);

    if (project.deadline < project.startDate) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be on or after start date",
        errors: [{ field: "deadline", message: "Deadline cannot be earlier than start date" }],
      });
    }

    if (priority && PROJECT_PRIORITIES.includes(priority)) {
      project.priority = priority;
    }

    if (status && PROJECT_STATUSES.includes(status)) {
      project.status = status;
    }

    
    if (projectManager && req.user.role === ROLES.OWNER) {
      if (mongoose.Types.ObjectId.isValid(projectManager)) {
        const pmUser = await User.findById(projectManager);
        if (pmUser && (pmUser.role === ROLES.PROJECT_MANAGER || pmUser.role === ROLES.OWNER)) {
          project.projectManager = pmUser._id;
        }
      }
    }

    
    if (Array.isArray(assignedEmployees)) {
      const validEmployeeIds = [];
      for (const empId of assignedEmployees) {
        if (!mongoose.Types.ObjectId.isValid(empId)) continue;
        const emp = await User.findById(empId);
        if (emp && emp.status === "Active") {
          validEmployeeIds.push(emp._id);
        }
      }
      project.assignedEmployees = validEmployeeIds;
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("projectManager", "name email designation department")
      .populate("assignedEmployees", "name email designation department");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    
    const isOwner = req.user.role === ROLES.OWNER;
    const isAssignedPM =
      req.user.role === ROLES.PROJECT_MANAGER &&
      project.projectManager &&
      project.projectManager.toString() === req.user._id.toString();

    if (!isOwner && !isAssignedPM) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this project.",
      });
    }

    await Project.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
    }

    const project = await Project.findById(id)
      .populate("projectManager", "name email designation department phoneNumber status")
      .populate("assignedEmployees", "name email designation department phoneNumber status");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    
    if (req.user.role === ROLES.OWNER) {
      
    } else if (req.user.role === ROLES.PROJECT_MANAGER) {
      
      const isManager = project.projectManager && (project.projectManager as any)._id?.equals(req.user._id);
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this project",
        });
      }
    } else {
      
      const isAssigned = project.assignedEmployees.some((emp: any) =>
        emp._id?.equals(req.user._id)
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this project",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};
