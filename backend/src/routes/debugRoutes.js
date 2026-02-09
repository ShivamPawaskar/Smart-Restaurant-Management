import { Router } from "express";
import { getConnection } from "../config/db.js";

const router = Router();

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const deleteOrderCascade = async (db, orderId) => {
  await db.run("DELETE FROM payments WHERE order_id = ?", [orderId]);
  await db.run("DELETE FROM orders WHERE id = ?", [orderId]);
};

const deleteUserCascade = async (db, userId) => {
  const userOrders = await db.all("SELECT id FROM orders WHERE customer_id = ?", [userId]);
  for (const order of userOrders) {
    await deleteOrderCascade(db, order.id);
  }
  await db.run("DELETE FROM waiter_calls WHERE customer_id = ?", [userId]);
  await db.run("DELETE FROM feedback WHERE customer_id = ?", [userId]);
  await db.run("DELETE FROM users WHERE id = ?", [userId]);
};

const clearTableSafe = async (db, table) => {
  if (table === "users") {
    await db.run("DELETE FROM payments");
    await db.run("DELETE FROM orders");
    await db.run("DELETE FROM waiter_calls");
    await db.run("DELETE FROM feedback");
    await db.run("DELETE FROM users");
    return;
  }

  if (table === "orders") {
    await db.run("DELETE FROM payments");
    await db.run("DELETE FROM orders");
    return;
  }

  await db.run(`DELETE FROM "${table}"`);
};

router.get("/db", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).send("Not found");
    }

    const db = await getConnection();
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    const requestedTable = req.query.table ? String(req.query.table) : "";
    const tableNames = new Set(tables.map((t) => t.name));
    const activeTable = tableNames.has(requestedTable) ? requestedTable : (tables[0]?.name || "");
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    let rows = [];
    let columns = [];
    if (activeTable) {
      rows = await db.all(`SELECT rowid AS __rowid__, * FROM "${activeTable}" ORDER BY rowid DESC LIMIT ?`, [limit]);
      columns = rows.length ? Object.keys(rows[0]).filter((c) => c !== "__rowid__") : [];
      if (!columns.length) {
        const info = await db.all(`PRAGMA table_info("${activeTable}")`);
        columns = info.map((col) => col.name);
      }
    }

    const tableLinks = tables
      .map((table) => {
        const active = table.name === activeTable;
        return `<a href="/debug/db?table=${encodeURIComponent(table.name)}&limit=${limit}" style="
          display:inline-block;padding:6px 10px;margin:4px;border-radius:8px;
          text-decoration:none;border:1px solid ${active ? "#ef4f45" : "#334155"};
          color:${active ? "#fecaca" : "#cbd5e1"};background:${active ? "rgba(239,79,69,0.15)" : "#0f172a"};
        ">${escapeHtml(table.name)}</a>`;
      })
      .join("");

    const head = columns.map((c) => `<th style="padding:10px;border:1px solid #334155;text-align:left;">${escapeHtml(c)}</th>`).join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${columns
            .map(
              (column) =>
                `<td style="padding:10px;border:1px solid #334155;vertical-align:top;max-width:360px;word-break:break-word;">${escapeHtml(
                  row[column]
                )}</td>`
            )
            .join("")}
            <td style="padding:10px;border:1px solid #334155;white-space:nowrap;">
              <a href="/debug/db/delete?table=${encodeURIComponent(activeTable)}&rowid=${encodeURIComponent(row.__rowid__)}&limit=${limit}" 
                 onclick="return confirm('Delete this row from ${escapeHtml(activeTable)}?')"
                 style="display:inline-block;padding:5px 8px;border-radius:6px;border:1px solid #7f1d1d;background:#450a0a;color:#fecaca;text-decoration:none;">
                 Delete
              </a>
            </td>
          </tr>`
      )
      .join("");

    res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SQLite Browser</title>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; margin: 20px; background: #020617; color: #e2e8f0; }
      .wrap { max-width: 1400px; margin: 0 auto; }
      table { border-collapse: collapse; width: 100%; background: #0b1220; }
      h1 { margin: 0 0 12px; }
      .meta { margin-bottom: 12px; color: #94a3b8; }
      .bar { margin: 12px 0; }
      input, button { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; padding: 6px 10px; }
      button { cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>SQLite Data Viewer</h1>
      <div class="meta">Database: backend/data/restaurant.sqlite</div>
      <div class="bar">${tableLinks || "<span>No tables found</span>"}</div>
      <form method="get" action="/debug/db" class="bar">
        <input type="hidden" name="table" value="${escapeHtml(activeTable)}" />
        <label>Rows:</label>
        <input type="number" min="1" max="200" name="limit" value="${limit}" />
        <button type="submit">Reload</button>
      </form>
      <div class="bar">
        <a href="/debug/db/clear-table?table=${encodeURIComponent(activeTable)}&limit=${limit}"
           onclick="return confirm('Delete ALL rows from ${escapeHtml(activeTable)}?')"
           style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #7f1d1d;background:#450a0a;color:#fecaca;text-decoration:none;">
           Clear Current Table
        </a>
      </div>
      <div class="meta">Table: <strong>${escapeHtml(activeTable || "N/A")}</strong> | Showing ${rows.length} rows</div>
      <table>
        <thead><tr>${head}<th style="padding:10px;border:1px solid #334155;text-align:left;">Actions</th></tr></thead>
        <tbody>${body || `<tr><td style="padding:12px;border:1px solid #334155;" colspan="${Math.max(columns.length + 1, 1)}">No rows</td></tr>`}</tbody>
      </table>
    </div>
  </body>
</html>`);
  } catch (error) {
    next(error);
  }
});

router.get("/db/delete", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).send("Not found");
    }

    const table = String(req.query.table || "");
    const rowid = Number(req.query.rowid);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    if (!table || !Number.isFinite(rowid)) {
      return res.redirect("/debug/db");
    }

    const db = await getConnection();
    const tableRows = await db.all(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const allowedTables = new Set(tableRows.map((t) => t.name));
    if (!allowedTables.has(table)) {
      return res.redirect("/debug/db");
    }

    if (table === "users") {
      await deleteUserCascade(db, rowid);
    } else if (table === "orders") {
      await deleteOrderCascade(db, rowid);
    } else {
      await db.run(`DELETE FROM "${table}" WHERE rowid = ?`, [rowid]);
    }
    return res.redirect(`/debug/db?table=${encodeURIComponent(table)}&limit=${limit}`);
  } catch (error) {
    next(error);
  }
});

router.get("/db/clear-table", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).send("Not found");
    }

    const table = String(req.query.table || "");
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    if (!table) {
      return res.redirect("/debug/db");
    }

    const db = await getConnection();
    const tableRows = await db.all(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const allowedTables = new Set(tableRows.map((t) => t.name));
    if (!allowedTables.has(table)) {
      return res.redirect("/debug/db");
    }

    await clearTableSafe(db, table);
    return res.redirect(`/debug/db?table=${encodeURIComponent(table)}&limit=${limit}`);
  } catch (error) {
    next(error);
  }
});

export default router;
