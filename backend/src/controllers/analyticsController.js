import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getOverview = asyncHandler(async (_req, res) => {
  const [stats] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN SUBSTR(created_at, 1, 10) = DATE('now', 'localtime') THEN 1 ELSE 0 END), 0) AS totalOrdersToday,
       COALESCE(SUM(CASE WHEN SUBSTR(created_at, 1, 10) = DATE('now', 'localtime') THEN total_price ELSE 0 END), 0) AS revenueToday,
       COALESCE(SUM(total_price), 0) AS totalRevenue,
       COALESCE(SUM(CASE WHEN status IN ('pending', 'preparing', 'ready') THEN 1 ELSE 0 END), 0) AS pendingOrders,
       COALESCE(SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END), 0) AS completedOrders
     FROM orders`
  );

  const [customers] = await query("SELECT COUNT(*) AS totalCustomers FROM users WHERE role = 'customer'");

  res.json({
    totalOrdersToday: Number(stats.totalOrdersToday || 0),
    revenueToday: Number(stats.revenueToday || 0),
    totalRevenue: Number(stats.totalRevenue || 0),
    pendingOrders: Number(stats.pendingOrders || 0),
    completedOrders: Number(stats.completedOrders || 0),
    totalCustomers: Number(customers.totalCustomers || 0)
  });
});
