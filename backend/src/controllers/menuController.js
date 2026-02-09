import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMenu = asyncHandler(async (_req, res) => {
  const rows = await query(
    "SELECT id, name, description, category, price, image_url AS imageUrl FROM menu_items WHERE is_available = 1 ORDER BY category, name"
  );
  res.json(rows);
});
