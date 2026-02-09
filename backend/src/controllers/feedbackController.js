import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { emitRoleEvent } from "../config/socket.js";

export const createFeedback = asyncHandler(async (req, res) => {
  const { message, rating } = req.body;

  if (!message || !rating) {
    throw new ApiError(400, "message and rating are required");
  }

  const result = await query(
    "INSERT INTO feedback (customer_id, message, rating) VALUES (?, ?, ?)",
    [req.user.id, message, rating]
  );

  const [created] = await query(
    `SELECT f.id, f.message, f.rating, f.created_at AS createdAt, u.name AS customerName
     FROM feedback f
     JOIN users u ON u.id = f.customer_id
     WHERE f.id = ?`,
    [result.insertId]
  );

  emitRoleEvent("manager", "feedback:created", created);

  res.status(201).json({ message: "Feedback submitted" });
});

export const getFeedback = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT f.id, f.message, f.rating, f.created_at AS createdAt, u.name AS customerName
     FROM feedback f
     JOIN users u ON u.id = f.customer_id
     ORDER BY f.created_at DESC`
  );

  res.json(rows);
});
