import { Router } from "express";
import { body } from "express-validator";
import { getMe, login, signup, updateMyTableNumber } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

const router = Router();

router.post(
  "/signup",
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("role").isIn(["customer", "kitchen", "manager"]),
  body("tableNumber").optional().isInt({ min: 1 }),
  validateRequest,
  signup
);

router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  validateRequest,
  login
);

router.get("/me", authenticate, getMe);
router.patch(
  "/me/table-number",
  authenticate,
  body("tableNumber").isInt({ min: 1, max: 200 }),
  validateRequest,
  updateMyTableNumber
);

export default router;
