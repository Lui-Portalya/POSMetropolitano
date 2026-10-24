import type Database from "better-sqlite3";
import { getDb } from "../db/client";

export type Settings = { storeName: string; taxRatePercent: number; receiptFooter: string };

export function getSettings(db: Database.Database = getDb()): Settings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    storeName: m.store_name ?? "POS Metropolitano",
    taxRatePercent: Number(m.tax_rate_percent ?? 0) || 0,
    receiptFooter: m.receipt_footer ?? "",
  };
}

export function saveSettings(s: Settings, db: Database.Database = getDb()) {
  const up = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db.transaction(() => {
    up.run("store_name", s.storeName);
    up.run("tax_rate_percent", String(s.taxRatePercent));
    up.run("receipt_footer", s.receiptFooter);
  })();
}
