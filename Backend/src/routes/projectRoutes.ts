import express from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { ROLES } from "../constants/enums.js";

const router = express.Router();

router.use(authenticate);

// View projects (scoped by role)
router.get("/", getProjects);
router.get("/:id", getProjectById);

// Create project (Owner or Project Manager)
router.post("/", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), createProject);

// Update project (Owner or Project Manager)
router.put("/:id", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), updateProject);

// Delete project (Restricted 403 per spec)
router.delete("/:id", deleteProject);

export default router;
