import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import config from "./env.js";

const dbPromise = (async () => {
  const resolvedPath = path.resolve(config.sqlitePath);
  if (config.sqlitePath !== ":memory:") {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  }

  const db = await open({
    filename: config.sqlitePath === ":memory:" ? ":memory:" : resolvedPath,
    driver: sqlite3.Database
  });
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
})();

const isReadQuery = (sql) => /^\s*(select|pragma)/i.test(sql);

export const query = async (sql, params = []) => {
  const db = await dbPromise;
  if (isReadQuery(sql)) {
    return db.all(sql, params);
  }

  const result = await db.run(sql, params);
  return { insertId: result.lastID, affectedRows: result.changes };
};

export const getConnection = async () => dbPromise;

export default dbPromise;
