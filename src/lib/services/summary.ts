import type Database from "better-sqlite3";
import { getDb } from "../db/client";

export type DailySummary = {
  date: string;
  salesCount: number;
  voidedCount: number;
  totalCents: number;
  taxCents: number;
  byMethod: { method: string; count: number; totalCents: number }[];
  topItems: { name: string; qty: number; totalCents: number }[];
};

export function dailySummary(date: string, db: Database.Database = getDb()): DailySummary {
  const day = "date(s.created_at) = ?";
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(total_cents),0) AS t, COALESCE(SUM(tax_cents),0) AS x
       FROM sales s WHERE ${day} AND status = 'completed'`,
    )
    .get(date) as { c: number; t: number; x: number };
  const voided = db
    .prepare(`SELECT COUNT(*) AS c FROM sales s WHERE ${day} AND status = 'voided'`)
    .get(date) as { c: number };
  const byMethod = db
    .prepare(
      `SELECT payment_method AS method, COUNT(*) AS count, SUM(total_cents) AS totalCents
       FROM sales s WHERE ${day} AND status = 'completed' GROUP BY payment_method ORDER BY totalCents DESC`,
    )
    .all(date) as DailySummary["byMethod"];
  const topItems = db
    .prepare(
      `SELECT si.name_snapshot AS name, SUM(si.qty) AS qty, SUM(si.line_total_cents) AS totalCents
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE ${day} AND s.status = 'completed' GROUP BY si.name_snapshot ORDER BY qty DESC`,
    )
    .all(date) as DailySummary["topItems"];
  return {
    date,
    salesCount: totals.c,
    voidedCount: voided.c,
    totalCents: totals.t,
    taxCents: totals.x,
    byMethod,
    topItems,
  };
}

export function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
