import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { ROLES } from "../constants/enums.js";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// Get employees (scoped by role inside controller)
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);

// Owner & Project Manager operations
router.post("/", authorizeRoles(ROLES.OWNER), createEmployee);
router.put("/:id", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), updateEmployee);
router.delete("/:id", deleteEmployee); // Controller returns restricted 403

export default router;
