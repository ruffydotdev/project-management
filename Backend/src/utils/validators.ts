import { DEPARTMENTS, DESIGNATIONS } from "../constants/enums.js";


export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== "string") return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+=\-[\]{}|;:,.<>~`])[A-Za-z\d@$!%*?&^#()_+=\-[\]{}|;:,.<>~`]{8,}$/;
  return regex.test(password);
};

export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^\S+@\S+\.\S+$/.test(email.trim());
};


export const validateIndianPhoneNumber = (phone: string) => {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return regex.test(cleaned);
};

export const formatIndianPhoneNumber = (phone: string) => {
  if (!phone) return phone;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  
  const match = cleaned.match(/(?:(?:\+91|91|0))?([6-9]\d{9})$/);
  if (match) {
    const num = match[1];
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
};

export const validateRegisterInput = (body) => {
  const errors = [];

  if (!body.name || !body.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!body.email || !validateEmail(body.email)) {
    errors.push({ field: "email", message: "A valid email address is required" });
  }

  if (!body.password) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (!validatePasswordStrength(body.password)) {
    errors.push({
      field: "password",
      message:
        "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  if (body.password !== body.confirmPassword) {
    errors.push({ field: "confirmPassword", message: "Passwords do not match" });
  }

  if (!body.phoneNumber || !body.phoneNumber.trim()) {
    errors.push({ field: "phoneNumber", message: "Phone number is required" });
  } else if (!validateIndianPhoneNumber(body.phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: "Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210 or 9876543210)",
    });
  }

  if (!body.designation || !DESIGNATIONS.includes(body.designation)) {
    errors.push({ field: "designation", message: "Please select a valid designation" });
  }

  if (!body.department || !DEPARTMENTS.includes(body.department)) {
    errors.push({ field: "department", message: "Please select a valid department" });
  }

  if (!body.joiningDate) {
    errors.push({ field: "joiningDate", message: "Joining date is required" });
  }

  return errors;
};
