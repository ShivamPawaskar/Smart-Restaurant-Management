import { Router } from "express";
import { body } from "express-validator";
import { createFeedback, getFeedback } from "../controllers/feedbackController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("customer"),
  body("message").isString().isLength({ min: 3, max: 500 }),
  body("rating").isInt({ min: 1, max: 5 }),
  validateRequest,
  createFeedback
);

router.get("/", authenticate, authorize("manager"), getFeedback);

export default router;
