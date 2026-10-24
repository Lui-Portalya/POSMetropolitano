import { getDb } from "./client";
import { hashPassword } from "../services/users";

const db = getDb();

const adminExists = db.prepare("SELECT 1 FROM users WHERE role='admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)").run(
    "admin",
    hashPassword("admin123"),
    "Administrator",
    "admin",
  );
  console.log("Created admin user: admin / admin123  (change this password after first login)");
}

const hasItems = db.prepare("SELECT 1 FROM items").get();
if (!hasItems) {
  const cat = db.prepare("INSERT INTO categories (name, sort_order) VALUES (?, ?)");
  const item = db.prepare(
    "INSERT INTO items (name, category_id, price_cents, track_stock, stock) VALUES (?,?,?,?,?)",
  );
  const drinks = Number(cat.run("Drinks", 1).lastInsertRowid);
  const food = Number(cat.run("Food", 2).lastInsertRowid);
  const sweets = Number(cat.run("Pastries", 3).lastInsertRowid);
  item.run("Coffee", drinks, 150, 0, 0);
  item.run("Tea", drinks, 125, 0, 0);
  item.run("Hot Chocolate", drinks, 200, 0, 0);
  item.run("Bottled Water", drinks, 100, 1, 48);
  item.run("Soda", drinks, 150, 1, 36);
  item.run("Ham Sandwich", food, 450, 1, 20);
  item.run("Empanada", food, 300, 1, 30);
  item.run("Croissant", sweets, 250, 1, 18);
  item.run("Muffin", sweets, 225, 1, 18);
  item.run("Brownie", sweets, 200, 1, 24);
  console.log("Seeded sample menu");
}
