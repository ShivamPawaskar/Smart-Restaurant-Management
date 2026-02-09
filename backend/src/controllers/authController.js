import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  hashPassword,
  newSessionId,
  signToken,
  verifyPassword
} from "../services/authService.js";

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, tableNumber, staffPasscode } = req.body;
  const STAFF_SIGNUP_PASSCODE = "12345";

  if (["kitchen", "manager"].includes(role) && staffPasscode !== STAFF_SIGNUP_PASSCODE) {
    throw new ApiError(403, "Invalid staff passcode");
  }

  const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length) {
    throw new ApiError(409, "Email already in use");
  }

  const hashedPassword = await hashPassword(password);
  const sessionId = newSessionId();

  const result = await query(
    `INSERT INTO users (name, email, password, role, table_number, session_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, hashedPassword, role, role === "customer" ? tableNumber : null, sessionId]
  );

  const token = signToken({
    id: result.insertId,
    role,
    sessionId,
    name,
    email
  });

  res.status(201).json({
    token,
    user: { id: result.insertId, name, email, role, tableNumber: role === "customer" ? tableNumber : null }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const [user] = await query(
    "SELECT id, name, email, role, table_number AS tableNumber FROM users WHERE id = ?",
    [req.user.id]
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(user);
});

export const updateMyTableNumber = asyncHandler(async (req, res) => {
  const { tableNumber } = req.body;

  if (req.user.role !== "customer") {
    throw new ApiError(403, "Only customers can update table number");
  }

  await query("UPDATE users SET table_number = ? WHERE id = ?", [tableNumber, req.user.id]);

  const [user] = await query(
    "SELECT id, name, email, role, table_number AS tableNumber FROM users WHERE id = ?",
    [req.user.id]
  );

  res.json(user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const rows = await query(
    "SELECT id, name, email, password, role, table_number FROM users WHERE email = ?",
    [email]
  );

  if (!rows.length) {
    throw new ApiError(401, "Invalid credentials");
  }

  const user = rows[0];
  let valid = await verifyPassword(password, user.password);

  // Backward-compatible path: previously seeded users might have plain-text passwords.
  if (!valid && user.password === password) {
    valid = true;
    const migratedHash = await hashPassword(password);
    await query("UPDATE users SET password = ? WHERE id = ?", [migratedHash, user.id]);
  }

  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const sessionId = newSessionId();
  await query("UPDATE users SET session_id = ? WHERE id = ?", [sessionId, user.id]);

  const token = signToken({
    id: user.id,
    role: user.role,
    sessionId,
    name: user.name,
    email: user.email
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tableNumber: user.table_number
    }
  });
});
