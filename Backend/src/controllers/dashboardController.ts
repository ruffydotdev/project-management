import User from "../models/User.js";
import Project from "../models/Project.js";
import { ROLES } from "../constants/enums.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let stats = {
      role: userRole,
      totalEmployees: 0,
      totalProjects: 0,
      projectsInProgress: 0,
      completedProjects: 0,
      pendingProjects: 0,
      recentProjects: [],
      monthlyActivity: [
        { label: "Mon", count: 12 },
        { label: "Tue", count: 18 },
        { label: "Wed", count: 25 },
        { label: "Thu", count: 32 },
        { label: "Fri", count: 28 },
        { label: "Sat", count: 10 },
        { label: "Sun", count: 6 },
      ],
    };

    if (userRole === ROLES.OWNER) {
      // Company-wide stats
      stats.totalEmployees = await User.countDocuments();
      stats.totalProjects = await Project.countDocuments();
      stats.projectsInProgress = await Project.countDocuments({ status: "In Progress" });
      stats.completedProjects = await Project.countDocuments({ status: "Completed" });
      stats.pendingProjects = await Project.countDocuments({ status: "Pending" });

      stats.recentProjects = await Project.find()
        .populate("projectManager", "name email")
        .populate("assignedEmployees", "name")
        .sort({ createdAt: -1 })
        .limit(5);
    } else if (userRole === ROLES.PROJECT_MANAGER) {
      // PM assigned projects
      stats.totalProjects = await Project.countDocuments({ projectManager: userId });
      stats.projectsInProgress = await Project.countDocuments({
        projectManager: userId,
        status: "In Progress",
      });
      stats.completedProjects = await Project.countDocuments({
        projectManager: userId,
        status: "Completed",
      });
      stats.pendingProjects = await Project.countDocuments({
        projectManager: userId,
        status: "Pending",
      });

      // Count distinct team members assigned across PM's projects
      const pmProjects = await Project.find({ projectManager: userId }).select("assignedEmployees");
      const teamSet = new Set();
      pmProjects.forEach((p) => {
        p.assignedEmployees.forEach((e) => teamSet.add(e.toString()));
      });
      stats.totalEmployees = teamSet.size;

      stats.recentProjects = await Project.find({ projectManager: userId })
        .populate("projectManager", "name email")
        .populate("assignedEmployees", "name")
        .sort({ createdAt: -1 })
        .limit(5);
    } else {
      // Employee assigned projects
      stats.totalProjects = await Project.countDocuments({ assignedEmployees: userId });
      stats.projectsInProgress = await Project.countDocuments({
        assignedEmployees: userId,
        status: "In Progress",
      });
      stats.completedProjects = await Project.countDocuments({
        assignedEmployees: userId,
        status: "Completed",
      });
      stats.pendingProjects = await Project.countDocuments({
        assignedEmployees: userId,
        status: "Pending",
      });

      // Count colleagues
      const empProjects = await Project.find({ assignedEmployees: userId }).select("assignedEmployees");
      const colleagueSet = new Set();
      empProjects.forEach((p) => {
        p.assignedEmployees.forEach((e) => colleagueSet.add(e.toString()));
      });
      stats.totalEmployees = colleagueSet.size;

      stats.recentProjects = await Project.find({ assignedEmployees: userId })
        .populate("projectManager", "name email")
        .populate("assignedEmployees", "name")
        .sort({ createdAt: -1 })
        .limit(5);
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics calculated successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
