import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

const globalForDb = globalThis as unknown as { __posDb?: Database.Database };

export function openDb(file: string): Database.Database {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__posDb) {
    const file = process.env.POS_DB_PATH ?? path.join(process.cwd(), "data", "pos.db");
    globalForDb.__posDb = openDb(file);
  }
  return globalForDb.__posDb;
}
