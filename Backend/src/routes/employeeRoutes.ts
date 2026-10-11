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


router.use(authenticate);


router.get("/", getEmployees);
router.get("/:id", getEmployeeById);


router.post("/", authorizeRoles(ROLES.OWNER), createEmployee);
router.put("/:id", authorizeRoles(ROLES.OWNER, ROLES.PROJECT_MANAGER), updateEmployee);
router.delete("/:id", deleteEmployee); 

export default router;
