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


router.get("/", getProjects);
router.get("/:id", getProjectById);


router.post("/", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), createProject);


router.put("/:id", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), updateProject);


router.delete("/:id", deleteProject);

export default router;
