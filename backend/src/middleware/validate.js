import { validationResult } from "express-validator";

export const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({ status: 400, message: "Validation failed", errors: errors.array() });
  }
  return next();
};
