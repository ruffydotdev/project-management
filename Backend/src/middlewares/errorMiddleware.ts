import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${err.stack || err.message}`);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      errors: [
        {
          field,
          message: `This ${field} is already in use`,
        },
      ],
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors).map((el: any) => ({
      field: el.path,
      message: el.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for parameter: ${err.path}`,
    });
  }

  // Fallback 500 error
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error occurred",
  });
};
