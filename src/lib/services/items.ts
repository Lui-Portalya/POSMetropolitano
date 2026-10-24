import type Database from "better-sqlite3";
import { getDb } from "../db/client";

export type Category = { id: number; name: string; sort_order: number };
export type Item = {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price_cents: number;
  track_stock: number;
  stock: number;
  active: number;
};

export function listCategories(db: Database.Database = getDb()): Category[] {
  return db.prepare("SELECT * FROM categories ORDER BY sort_order, name").all() as Category[];
}

export function addCategory(name: string, db: Database.Database = getDb()) {
  const next = (db.prepare("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM categories").get() as { n: number }).n;
  db.prepare("INSERT INTO categories (name, sort_order) VALUES (?, ?)").run(name, next);
}

export function deleteCategory(id: number, db: Database.Database = getDb()) {
  const used = db.prepare("SELECT COUNT(*) AS c FROM items WHERE category_id = ?").get(id) as { c: number };
  if (used.c > 0) throw new Error("Category still has items");
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}

export function listItems(opts: { activeOnly?: boolean } = {}, db: Database.Database = getDb()): Item[] {
  return db
    .prepare(
      `SELECT i.*, c.name AS category_name FROM items i
       JOIN categories c ON c.id = i.category_id
       ${opts.activeOnly ? "WHERE i.active = 1" : ""}
       ORDER BY c.sort_order, c.name, i.name`,
    )
    .all() as Item[];
}

export type ItemInput = {
  name: string;
  categoryId: number;
  priceCents: number;
  trackStock: boolean;
  stock: number;
  active: boolean;
};

export function createItem(i: ItemInput, db: Database.Database = getDb()) {
  db.prepare(
    "INSERT INTO items (name, category_id, price_cents, track_stock, stock, active) VALUES (?,?,?,?,?,?)",
  ).run(i.name, i.categoryId, i.priceCents, i.trackStock ? 1 : 0, i.stock, i.active ? 1 : 0);
}

export function updateItem(id: number, i: ItemInput, db: Database.Database = getDb()) {
  db.prepare(
    "UPDATE items SET name=?, category_id=?, price_cents=?, track_stock=?, stock=?, active=? WHERE id=?",
  ).run(i.name, i.categoryId, i.priceCents, i.trackStock ? 1 : 0, i.stock, i.active ? 1 : 0, id);
}
