import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { openDb } from "../src/lib/db/client";
import { createSale, getSale, voidSale, SaleError } from "../src/lib/services/sales";
import { dailySummary, localToday } from "../src/lib/services/summary";
import { createUser, verifyCredentials } from "../src/lib/services/users";

let db: Database.Database;
let userId: number;
let coffee: number;
let muffin: number;

beforeEach(() => {
  db = openDb(":memory:");
  createUser({ username: "vol", name: "Volunteer", password: "secret1", role: "cashier" }, db);
  userId = (db.prepare("SELECT id FROM users").get() as { id: number }).id;
  const cat = Number(db.prepare("INSERT INTO categories (name) VALUES ('Food')").run().lastInsertRowid);
  const ins = db.prepare("INSERT INTO items (name, category_id, price_cents, track_stock, stock) VALUES (?,?,?,?,?)");
  coffee = Number(ins.run("Coffee", cat, 150, 0, 0).lastInsertRowid);
  muffin = Number(ins.run("Muffin", cat, 225, 1, 3).lastInsertRowid);
});

const stock = (id: number) => (db.prepare("SELECT stock FROM items WHERE id=?").get(id) as { stock: number }).stock;

describe("createSale", () => {
  it("totals, computes change, decrements tracked stock only", () => {
    const id = createSale(userId, [{ itemId: coffee, qty: 2 }, { itemId: muffin, qty: 1 }], { method: "cash", tenderedCents: 1000 }, db);
    const { sale, items } = getSale(id, db)!;
    expect(sale.total_cents).toBe(525);
    expect(sale.change_cents).toBe(475);
    expect(items).toHaveLength(2);
    expect(stock(muffin)).toBe(2);
    expect(stock(coffee)).toBe(0);
  });

  it("applies the store tax rate", () => {
    db.prepare("UPDATE settings SET value='10' WHERE key='tax_rate_percent'").run();
    const id = createSale(userId, [{ itemId: coffee, qty: 2 }], { method: "card" }, db);
    expect(getSale(id, db)!.sale).toMatchObject({ subtotal_cents: 300, tax_cents: 30, total_cents: 330, change_cents: 0 });
  });

  it("rejects overselling, short cash and empty carts", () => {
    expect(() => createSale(userId, [{ itemId: muffin, qty: 4 }], { method: "card" }, db)).toThrow(SaleError);
    expect(() => createSale(userId, [{ itemId: coffee, qty: 1 }], { method: "cash", tenderedCents: 100 }, db)).toThrow(SaleError);
    expect(() => createSale(userId, [], { method: "card" }, db)).toThrow(SaleError);
    expect(stock(muffin)).toBe(3);
  });
});

describe("voidSale", () => {
  it("restores stock and excludes the sale from the summary", () => {
    const id = createSale(userId, [{ itemId: muffin, qty: 2 }], { method: "card" }, db);
    expect(dailySummary(localToday(), db).totalCents).toBe(450);
    voidSale(id, db);
    expect(stock(muffin)).toBe(3);
    const s = dailySummary(localToday(), db);
    expect(s.totalCents).toBe(0);
    expect(s.voidedCount).toBe(1);
    expect(() => voidSale(id, db)).toThrow(SaleError);
  });
});

describe("verifyCredentials", () => {
  it("accepts good passwords and rejects bad, unknown and inactive users", () => {
    expect(verifyCredentials("vol", "secret1", db)?.name).toBe("Volunteer");
    expect(verifyCredentials("VOL", "secret1", db)).not.toBeNull();
    expect(verifyCredentials("vol", "nope", db)).toBeNull();
    expect(verifyCredentials("ghost", "secret1", db)).toBeNull();
    db.prepare("UPDATE users SET active=0").run();
    expect(verifyCredentials("vol", "secret1", db)).toBeNull();
  });
});
