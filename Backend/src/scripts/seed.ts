import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Project from "../models/Project.js";
import { hashPassword } from "../utils/tokenUtils.js";
import { ROLES, DEPARTMENTS, DESIGNATIONS, PROJECT_STATUSES, PROJECT_PRIORITIES } from "../constants/enums.js";

dotenv.config();

const firstNames = [
  "Liam", "Noah", "Oliver", "James", "Elijah", "William", "Lucas", "Henry", "Alexander", "Mason",
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Amelia", "Harper", "Evelyn", "Abigail",
  "Daniel", "Ethan", "Mateo", "Sebastian", "Jack", "Aria", "Chloe", "Grace", "Zoey", "Nora"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const projectTitles = [
  "Enterprise Cloud Data Platform",
  "Mobile Payment Integration",
  "AI Customer Insights Engine",
  "Global SSO & IAM Security Gateway",
  "Next-Gen SaaS Analytics Dashboard",
  "Zero-Trust Network Perimeter",
  "Warehouse Automated Supply Chain",
  "Real-Time Telemetry & Log Monitoring",
  "Customer Support Portal & Chatbot",
  "Automated Payroll & Tax Reconciliation",
  "Dark-Mode Micro-Frontend Design System",
  "Kubernetes High-Availability Cluster",
  "GraphQL Federation Gateway",
  "Multi-Tenant Tenant Isolation Engine",
  "GDPR Compliance & Audit Pipeline",
  "E-Commerce Checkout Optimization",
  "Dynamic Rate Limiting & Proxy Routing",
  "Developer Documentation & SDK Portal",
  "Mobile Asset Tracking Application",
  "Automated CI/CD Deployment Orchestrator",
  "Search & Elastic Discovery Pipeline",
  "Lead Scoring & CRM Synchronization",
  "Video Conferencing WebRTC Platform",
  "Financial Forecasting Model",
  "Distributed Caching with Redis Cluster",
  "Cross-Region Database Replication",
  "Incident Management Incident Response",
  "Fraud Detection & Risk Scoring",
  "Inventory Sync & RFID Integration",
  "Mobile Offline-First Synchronization",
  "Marketing Automation & Campaign Engine",
  "Smart Document OCR Extractor",
  "Customer Feedback & Sentiment Analyzer",
  "Secure File Vault with KMS Encryption",
  "Automated QA Regression Test Suite",
  "API Monetization & Usage Billing",
  "Internal Developer Portal (Backstage)",
  "Real-Time Collaborative Document Editor",
  "Serverless Edge Computing Workers",
  "Supply Chain Carbon Footprint Tracker",
  "HR Onboarding & Compliance Portal",
  "Biometric Authentication WebAuthn API",
  "IoT Sensor Data Ingestion Pipeline",
  "High-Performance Kafka Stream Processor",
  "Self-Service IT Helpdesk Ticketing",
  "Global CDN Asset Optimization Service",
  "Personalized Recommendation Engine",
  "Enterprise Slack & Teams Integration Bot",
  "Disaster Recovery & Failover Automation",
  "Network Vulnerability Scanner & Patching"
];

export const autoSeedIfEmpty = async (force: boolean = false) => {
  try {
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();

    // If already populated and not forced, keep existing data intact
    if (!force && userCount >= 20 && projectCount >= 40) {
      console.log(`[Database Auto-Seed] Database already populated (${userCount} users, ${projectCount} projects).`);
      return;
    }

    console.log("[Database Auto-Seed] Bootstrapping dummy data (50 projects & 20 employees)...");

    if (force) {
      await User.deleteMany({});
      await Project.deleteMany({});
    }

    const defaultPassword = "Password@123";
    const hashedPassword = await hashPassword(defaultPassword);

    // 1. Ensure Owner exists
    let owner = await User.findOne({ role: ROLES.OWNER });
    if (!owner) {
      owner = await User.create({
        name: "Angela Vance",
        email: "owner@empms.com",
        password: hashedPassword,
        role: ROLES.OWNER,
        phoneNumber: "+91 98200 11000",
        designation: "Team Lead",
        department: "Engineering/Development",
        joiningDate: new Date("2023-01-01"),
        status: "Active",
        isVerified: true,
      });
    }

    // 2. Ensure PMs exist
    const pmEmails = ["pm.marcus@empms.com", "pm.elena@empms.com", "pm.david@empms.com"];
    const pmPhones = ["+91 98200 22001", "+91 98200 22002", "+91 98200 22003"];
    const pms = [];
    for (let pIdx = 0; pIdx < pmEmails.length; pIdx++) {
      const email = pmEmails[pIdx];
      let pm = await User.findOne({ email });
      if (!pm) {
        pm = await User.create({
          name: email.includes("marcus") ? "Marcus Wright" : email.includes("elena") ? "Elena Rostova" : "David Kim",
          email,
          password: hashedPassword,
          role: ROLES.PROJECT_MANAGER,
          phoneNumber: pmPhones[pIdx],
          designation: "Project Manager",
          department: email.includes("elena") ? "Design" : "Engineering/Development",
          joiningDate: new Date("2023-03-01"),
          status: "Active",
          isVerified: true,
        });
      }
      pms.push(pm);
    }

    // 3. Ensure 20 Employees exist
    const employees = [];
    for (let i = 0; i < 20; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[(i * 3) % lastNames.length];
      const fullName = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i > 5 ? i : ""}@empms.com`;

      let emp = await User.findOne({ email });
      if (!emp) {
        const empPhoneSuffix = (1000 + i).toString().padStart(4, "0");
        emp = await User.create({
          name: fullName,
          email,
          password: hashedPassword,
          role: ROLES.EMPLOYEE,
          phoneNumber: `+91 98199 ${empPhoneSuffix}`,
          designation: DESIGNATIONS[i % DESIGNATIONS.length],
          department: DEPARTMENTS[i % DEPARTMENTS.length],
          joiningDate: new Date(2023, i % 12, (i % 28) + 1),
          status: i === 19 ? "Inactive" : "Active",
          isVerified: true,
        });
      }
      employees.push(emp);
    }

    // 4. Ensure 50 Projects exist
    const allManagers = [owner, ...pms];
    const existingProjectCount = await Project.countDocuments();
    if (existingProjectCount < 50) {
      const projectDocs = [];
      for (let i = existingProjectCount; i < 50; i++) {
        const title = projectTitles[i] || `Enterprise Initiative ${i + 1}`;
        const pm = allManagers[i % allManagers.length];

        const numAssigned = 2 + (i % 4);
        const assigned = [];
        for (let j = 0; j < numAssigned; j++) {
          const emp = employees[(i * 2 + j) % employees.length];
          if (!assigned.includes(emp._id)) {
            assigned.push(emp._id);
          }
        }

        const startTimestamp = new Date("2026-01-01").getTime() + i * 5 * 24 * 60 * 60 * 1000;
        const startDate = new Date(startTimestamp);
        const deadline = new Date(startTimestamp + (30 + (i % 60)) * 24 * 60 * 60 * 1000);

        projectDocs.push({
          projectName: title,
          description: `Deliver scalable, enterprise-grade architecture for ${title}. Coordinates cross-functional milestones, security compliance, and performance metrics.`,
          startDate,
          deadline,
          priority: PROJECT_PRIORITIES[i % PROJECT_PRIORITIES.length],
          status: PROJECT_STATUSES[i % PROJECT_STATUSES.length],
          projectManager: pm._id,
          assignedEmployees: assigned,
        });
      }

      if (projectDocs.length > 0) {
        await Project.create(projectDocs);
      }
    }

    console.log("[Database Auto-Seed] Auto-seeding ready: 1 Owner, 3 PMs, 20 Employees, 50 Projects.");
  } catch (err) {
    console.error("[Database Auto-Seed Error]", err);
  }
};

// If run directly from terminal via CLI: `npm run seed`
const isCliRun = process.argv[1]?.replace(/\\/g, "/").endsWith("seed.ts");
if (isCliRun) {
  const runCli = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/empms_db";
      await mongoose.connect(mongoUri);
      console.log("[Seed CLI] Connected to MongoDB...");
      await autoSeedIfEmpty(true); // force full re-seed
      await mongoose.connection.close();
      process.exit(0);
    } catch (e) {
      console.error("[Seed CLI Error]", e);
      process.exit(1);
    }
  };
  runCli();
}
