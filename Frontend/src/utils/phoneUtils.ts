/**
 * Helper utilities for validating and formatting Indian phone numbers.
 * Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9,
 * optionally prefixed with +91, 91, or 0.
 */

export const validateIndianPhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return regex.test(cleaned);
};

export const formatIndianPhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const match = cleaned.match(/(?:(?:\+91|91|0))?([6-9]\d{9})$/);
  if (match) {
    const num = match[1];
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
};

export const INDIAN_PHONE_PLACEHOLDER = "+91 98765 43210";
