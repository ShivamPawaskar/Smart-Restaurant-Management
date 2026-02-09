import { Router } from "express";
import { getOverview } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/overview", authenticate, authorize("manager"), getOverview);

export default router;
