import type Database from "better-sqlite3";
import { getDb } from "../db/client";
import { getSettings } from "./settings";

export type PaymentMethod = "cash" | "card" | "other";
export type CartLine = { itemId: number; qty: number };

export type Sale = {
  id: number;
  user_id: number;
  cashier_name: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_method: PaymentMethod;
  amount_paid_cents: number;
  change_cents: number;
  status: "completed" | "voided";
  created_at: string;
};

export type SaleItem = {
  id: number;
  item_id: number;
  name_snapshot: string;
  unit_price_cents: number;
  qty: number;
  line_total_cents: number;
};

export class SaleError extends Error {}

type ItemRow = { id: number; name: string; price_cents: number; track_stock: number; stock: number; active: number };

export function createSale(
  userId: number,
  lines: CartLine[],
  payment: { method: PaymentMethod; tenderedCents?: number },
  db: Database.Database = getDb(),
): number {
  if (lines.length === 0) throw new SaleError("The cart is empty");
  const merged = new Map<number, number>();
  for (const l of lines) {
    if (!Number.isInteger(l.qty) || l.qty <= 0) throw new SaleError("Invalid quantity");
    merged.set(l.itemId, (merged.get(l.itemId) ?? 0) + l.qty);
  }
  const { taxRatePercent } = getSettings(db);

  return db.transaction(() => {
    const getItem = db.prepare("SELECT * FROM items WHERE id = ?");
    const decStock = db.prepare("UPDATE items SET stock = stock - ? WHERE id = ?");
    const priced: { item: ItemRow; qty: number; line: number }[] = [];
    let subtotal = 0;
    for (const [itemId, qty] of merged) {
      const item = getItem.get(itemId) as ItemRow | undefined;
      if (!item || !item.active) throw new SaleError("An item in the cart is no longer available");
      if (item.track_stock && item.stock < qty) throw new SaleError(`Not enough stock for ${item.name}`);
      const line = item.price_cents * qty;
      subtotal += line;
      priced.push({ item, qty, line });
    }
    const tax = Math.round((subtotal * taxRatePercent) / 100);
    const total = subtotal + tax;

    let paid = total;
    let change = 0;
    if (payment.method === "cash") {
      paid = payment.tenderedCents ?? total;
      if (paid < total) throw new SaleError("Cash received is less than the total");
      change = paid - total;
    }

    const saleId = Number(
      db
        .prepare(
          `INSERT INTO sales (user_id, subtotal_cents, tax_cents, total_cents, payment_method, amount_paid_cents, change_cents)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(userId, subtotal, tax, total, payment.method, paid, change).lastInsertRowid,
    );
    const insLine = db.prepare(
      `INSERT INTO sale_items (sale_id, item_id, name_snapshot, unit_price_cents, qty, line_total_cents)
       VALUES (?,?,?,?,?,?)`,
    );
    for (const { item, qty, line } of priced) {
      insLine.run(saleId, item.id, item.name, item.price_cents, qty, line);
      if (item.track_stock) decStock.run(qty, item.id);
    }
    return saleId;
  })();
}

export function voidSale(saleId: number, db: Database.Database = getDb()) {
  db.transaction(() => {
    const sale = db.prepare("SELECT status FROM sales WHERE id = ?").get(saleId) as { status: string } | undefined;
    if (!sale) throw new SaleError("Sale not found");
    if (sale.status === "voided") throw new SaleError("Sale is already voided");
    db.prepare("UPDATE sales SET status = 'voided' WHERE id = ?").run(saleId);
    db.prepare(
      `UPDATE items SET stock = stock + COALESCE(
         (SELECT SUM(qty) FROM sale_items WHERE sale_id = ? AND item_id = items.id), 0)
       WHERE track_stock = 1 AND id IN (SELECT item_id FROM sale_items WHERE sale_id = ?)`,
    ).run(saleId, saleId);
  })();
}

const SALE_SELECT = `SELECT s.*, u.name AS cashier_name FROM sales s JOIN users u ON u.id = s.user_id`;

export function getSale(id: number, db: Database.Database = getDb()) {
  const sale = db.prepare(`${SALE_SELECT} WHERE s.id = ?`).get(id) as Sale | undefined;
  if (!sale) return null;
  const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id").all(id) as SaleItem[];
  return { sale, items };
}

/** `date` is a local-time YYYY-MM-DD. */
export function listSalesForDate(date: string, db: Database.Database = getDb()): Sale[] {
  return db
    .prepare(`${SALE_SELECT} WHERE date(s.created_at) = ? ORDER BY s.id DESC`)
    .all(date) as Sale[];
}
