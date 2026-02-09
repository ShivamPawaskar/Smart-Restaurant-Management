import { Router } from "express";
import { body } from "express-validator";
import {
  createWaiterCall,
  createOrder,
  getCustomerOrders,
  getKitchenOrders,
  getManagerOrders,
  getPayments,
  getWaiterCalls,
  markServed,
  payOrderByCustomer,
  resolveWaiterCall,
  updateKitchenOrderStatus,
  updatePaymentStatus
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("customer"),
  body("items").isArray({ min: 1 }),
  body("items.*.menuItemId").isInt({ min: 1 }),
  body("items.*.quantity").isInt({ min: 1 }),
  validateRequest,
  createOrder
);

router.get("/me", authenticate, authorize("customer"), getCustomerOrders);
router.get("/kitchen", authenticate, authorize("kitchen"), getKitchenOrders);
router.patch(
  "/:orderId/kitchen-status",
  authenticate,
  authorize("kitchen"),
  body("status").isIn(["preparing", "ready"]),
  validateRequest,
  updateKitchenOrderStatus
);

router.get("/manager", authenticate, authorize("manager"), getManagerOrders);
router.patch("/:orderId/serve", authenticate, authorize("manager"), markServed);
router.patch(
  "/:orderId/payment",
  authenticate,
  authorize("manager"),
  body("paymentStatus").isIn(["unpaid", "paid"]),
  validateRequest,
  updatePaymentStatus
);
router.get("/payments", authenticate, authorize("manager"), getPayments);
router.patch(
  "/:orderId/pay",
  authenticate,
  authorize("customer"),
  body("paymentMethod").optional().isIn(["upi", "card", "cash"]),
  validateRequest,
  payOrderByCustomer
);
router.post(
  "/waiter-call",
  authenticate,
  authorize("customer"),
  body("message").optional().isString().isLength({ min: 3, max: 200 }),
  validateRequest,
  createWaiterCall
);
router.get("/waiter-calls", authenticate, authorize("manager"), getWaiterCalls);
router.patch("/waiter-calls/:callId/resolve", authenticate, authorize("manager"), resolveWaiterCall);

export default router;
