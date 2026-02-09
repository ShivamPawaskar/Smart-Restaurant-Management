import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

dotenv.config({ path: path.resolve(".env") });

const schemaPath = path.resolve("sql/schema.sql");
const seedPath = path.resolve("sql/seed.sql");

const run = async () => {
  const sqlitePath = process.env.SQLITE_PATH || "./data/restaurant.sqlite";
  const resolvedDbPath = path.resolve(sqlitePath);
  await fs.mkdir(path.dirname(resolvedDbPath), { recursive: true });

  const db = await open({
    filename: resolvedDbPath,
    driver: sqlite3.Database
  });

  const schemaSql = await fs.readFile(schemaPath, "utf-8");
  const seedSql = await fs.readFile(seedPath, "utf-8");

  try {
    await db.exec("PRAGMA foreign_keys = ON;");
    await db.exec(schemaSql);
    await db.exec(seedSql);
    // eslint-disable-next-line no-console
    console.log(`SQLite schema and seed applied: ${resolvedDbPath}`);
  } finally {
    await db.close();
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
