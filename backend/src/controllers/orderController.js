import { query } from "../config/db.js";
import { emitRoleEvent, emitUserEvent } from "../config/socket.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  buildOrderItems,
  canTransitionKitchenStatus,
  canTransitionManagerStatus
} from "../services/orderService.js";

const parseItems = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "Order items are required");
  }

  const [customer] = await query("SELECT table_number AS tableNumber FROM users WHERE id = ?", [
    req.user.id
  ]);
  if (!customer?.tableNumber) {
    throw new ApiError(400, "Please select your table number before placing an order");
  }

  const itemIds = [...new Set(items.map((item) => Number(item.menuItemId)).filter(Boolean))];
  if (!itemIds.length) {
    throw new ApiError(400, "Invalid order items");
  }

  const placeholders = itemIds.map(() => "?").join(",");
  const menuRows = await query(
    `SELECT id, name, price FROM menu_items WHERE id IN (${placeholders}) AND is_available = 1`,
    itemIds
  );

  const { detailedItems, totalPrice } = buildOrderItems(menuRows, items);

  const result = await query(
    `INSERT INTO orders (customer_id, items, total_price, status, payment_status)
     VALUES (?, ?, ?, 'pending', 'unpaid')`,
    [req.user.id, JSON.stringify(detailedItems), totalPrice]
  );

  const [created] = await query(
    `SELECT o.id, o.customer_id AS customerId, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = ?`,
    [result.insertId]
  );

  const payload = { ...created, items: detailedItems };
  emitRoleEvent("kitchen", "order:created", payload);
  emitRoleEvent("manager", "order:created", payload);
  emitUserEvent(req.user.id, "order:created", payload);

  res.status(201).json(payload);
});

export const getCustomerOrders = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, customer_id AS customerId, items, total_price AS totalPrice,
            status, payment_status AS paymentStatus, created_at AS createdAt
     FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.json(rows.map((row) => ({ ...row, items: parseItems(row.items) })));
});

export const getKitchenOrders = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.created_at AS createdAt, u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.status IN ('pending', 'preparing', 'ready')
     ORDER BY o.created_at ASC`
  );

  res.json(rows.map((row) => ({ ...row, items: parseItems(row.items) })));
});

export const updateKitchenOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const [order] = await query("SELECT id, customer_id AS customerId, status FROM orders WHERE id = ?", [orderId]);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!canTransitionKitchenStatus(order.status, status)) {
    throw new ApiError(400, `Invalid transition from ${order.status} to ${status}`);
  }

  await query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);

  const [updated] = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = ?`,
    [orderId]
  );

  const payload = { ...updated, items: parseItems(updated.items) };
  emitRoleEvent("kitchen", "order:updated", payload);
  emitRoleEvent("manager", "order:updated", payload);
  emitUserEvent(order.customerId, "order:updated", payload);

  res.json(payload);
});

export const getManagerOrders = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     ORDER BY o.created_at DESC`
  );

  res.json(rows.map((row) => ({ ...row, items: parseItems(row.items) })));
});

export const markServed = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const [order] = await query("SELECT id, customer_id AS customerId, status FROM orders WHERE id = ?", [orderId]);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!canTransitionManagerStatus(order.status, "served")) {
    throw new ApiError(400, "Only ready orders can be marked served");
  }

  await query("UPDATE orders SET status = 'served' WHERE id = ?", [orderId]);

  const [updated] = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = ?`,
    [orderId]
  );

  const payload = { ...updated, items: parseItems(updated.items) };
  emitRoleEvent("manager", "order:updated", payload);
  emitUserEvent(order.customerId, "order:updated", payload);

  res.json(payload);
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus } = req.body;

  if (!["unpaid", "paid"].includes(paymentStatus)) {
    throw new ApiError(400, "paymentStatus must be unpaid or paid");
  }

  const [order] = await query(
    "SELECT id, customer_id AS customerId, total_price AS totalPrice, payment_status AS paymentStatus FROM orders WHERE id = ?",
    [orderId]
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await query("UPDATE orders SET payment_status = ? WHERE id = ?", [paymentStatus, orderId]);

  if (paymentStatus === "paid") {
    await query(
      `INSERT INTO payments (order_id, amount, payment_method, status)
       VALUES (?, ?, 'cash', 'paid')
       ON CONFLICT(order_id) DO UPDATE SET amount = excluded.amount, status = excluded.status, paid_at = CURRENT_TIMESTAMP`,
      [orderId, order.totalPrice]
    );
  }

  const [updated] = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = ?`,
    [orderId]
  );

  const payload = { ...updated, items: parseItems(updated.items) };
  emitRoleEvent("manager", "order:updated", payload);
  emitUserEvent(order.customerId, "order:updated", payload);

  res.json(payload);
});

export const getPayments = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT p.id, p.order_id AS orderId, p.amount, p.payment_method AS paymentMethod,
            p.status, p.paid_at AS paidAt, u.name AS customerName
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN users u ON u.id = o.customer_id
     ORDER BY p.paid_at DESC`
  );

  res.json(rows);
});

export const payOrderByCustomer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const paymentMethod = ["upi", "card", "cash"].includes(req.body?.paymentMethod)
    ? req.body.paymentMethod
    : "upi";

  const [order] = await query(
    `SELECT id, customer_id AS customerId, total_price AS totalPrice, status, payment_status AS paymentStatus
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.customerId !== req.user.id) {
    throw new ApiError(403, "You can only pay your own orders");
  }

  if (order.status !== "served") {
    throw new ApiError(400, "Bill can be paid after order is served");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order is already paid");
  }

  await query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [orderId]);
  await query(
    `INSERT INTO payments (order_id, amount, payment_method, status)
     VALUES (?, ?, ?, 'paid')
     ON CONFLICT(order_id) DO UPDATE SET amount = excluded.amount, payment_method = excluded.payment_method, status = excluded.status, paid_at = CURRENT_TIMESTAMP`,
    [orderId, order.totalPrice, paymentMethod]
  );

  const [updatedOrder] = await query(
    `SELECT o.id, o.customer_id AS customerId, o.items, o.total_price AS totalPrice,
            o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
            u.name AS customerName, u.table_number AS tableNumber
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     WHERE o.id = ?`,
    [orderId]
  );

  const [payment] = await query(
    `SELECT id, order_id AS orderId, amount, payment_method AS paymentMethod, status, paid_at AS paidAt
     FROM payments
     WHERE order_id = ?`,
    [orderId]
  );

  const payload = {
    ...updatedOrder,
    items: parseItems(updatedOrder.items),
    receipt: {
      receiptNo: payment?.id,
      orderId: payment?.orderId ?? Number(orderId),
      amount: payment?.amount ?? order.totalPrice,
      paymentMethod: payment?.paymentMethod ?? paymentMethod,
      paymentStatus: payment?.status ?? "paid",
      paidAt: payment?.paidAt ?? new Date().toISOString()
    }
  };
  emitRoleEvent("manager", "payment:paid", payload);
  emitRoleEvent("manager", "order:updated", payload);
  emitUserEvent(req.user.id, "order:updated", payload);

  res.json(payload);
});

export const createWaiterCall = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const [customer] = await query(
    "SELECT id, name, table_number AS tableNumber FROM users WHERE id = ?",
    [req.user.id]
  );

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
  if (!customer.tableNumber) {
    throw new ApiError(400, "Please select your table number first");
  }

  const result = await query(
    `INSERT INTO waiter_calls (customer_id, table_number, message, status)
     VALUES (?, ?, ?, 'open')`,
    [req.user.id, customer.tableNumber, message || "Need assistance at table"]
  );

  const [created] = await query(
    `SELECT wc.id, wc.customer_id AS customerId, wc.table_number AS tableNumber, wc.message,
            wc.status, wc.created_at AS createdAt, wc.resolved_at AS resolvedAt, u.name AS customerName
     FROM waiter_calls wc
     JOIN users u ON u.id = wc.customer_id
     WHERE wc.id = ?`,
    [result.insertId]
  );

  emitRoleEvent("manager", "waiter:called", created);
  emitUserEvent(req.user.id, "waiter:called", created);
  res.status(201).json(created);
});

export const getWaiterCalls = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT wc.id, wc.customer_id AS customerId, wc.table_number AS tableNumber, wc.message,
            wc.status, wc.created_at AS createdAt, wc.resolved_at AS resolvedAt, u.name AS customerName
     FROM waiter_calls wc
     JOIN users u ON u.id = wc.customer_id
     ORDER BY wc.created_at DESC`
  );

  res.json(rows);
});

export const resolveWaiterCall = asyncHandler(async (req, res) => {
  const { callId } = req.params;
  const [call] = await query("SELECT id, customer_id AS customerId FROM waiter_calls WHERE id = ?", [
    callId
  ]);

  if (!call) {
    throw new ApiError(404, "Waiter call not found");
  }

  await query(
    "UPDATE waiter_calls SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
    [callId]
  );

  const [updated] = await query(
    `SELECT wc.id, wc.customer_id AS customerId, wc.table_number AS tableNumber, wc.message,
            wc.status, wc.created_at AS createdAt, wc.resolved_at AS resolvedAt, u.name AS customerName
     FROM waiter_calls wc
     JOIN users u ON u.id = wc.customer_id
     WHERE wc.id = ?`,
    [callId]
  );

  emitRoleEvent("manager", "waiter:updated", updated);
  emitUserEvent(call.customerId, "waiter:updated", updated);
  res.json(updated);
});
