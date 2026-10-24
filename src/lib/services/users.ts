import bcrypt from "bcryptjs";
import type Database from "better-sqlite3";
import { getDb } from "../db/client";

export type User = {
  id: number;
  username: string;
  name: string;
  role: "admin" | "cashier";
  active: number;
};

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function listUsers(db: Database.Database = getDb()): User[] {
  return db.prepare("SELECT id, username, name, role, active FROM users ORDER BY username").all() as User[];
}

export function createUser(
  u: { username: string; name: string; password: string; role: "admin" | "cashier" },
  db: Database.Database = getDb(),
) {
  db.prepare("INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)").run(
    u.username,
    hashPassword(u.password),
    u.name,
    u.role,
  );
}

export function setUserActive(id: number, active: boolean, db: Database.Database = getDb()) {
  db.transaction(() => {
    if (!active) {
      const admins = db
        .prepare("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND active=1 AND id<>?")
        .get(id) as { c: number };
      const target = db.prepare("SELECT role FROM users WHERE id=?").get(id) as { role: string } | undefined;
      if (target?.role === "admin" && admins.c === 0) throw new Error("Cannot deactivate the last admin");
    }
    db.prepare("UPDATE users SET active=? WHERE id=?").run(active ? 1 : 0, id);
    if (!active) db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
  })();
}

export function resetPassword(id: number, password: string, db: Database.Database = getDb()) {
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(password), id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
  })();
}

/** Returns the user if credentials are valid and the account is active. */
export function verifyCredentials(
  username: string,
  password: string,
  db: Database.Database = getDb(),
): User | null {
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | (User & { password_hash: string })
    | undefined;
  // Compare against a dummy hash when the user is unknown to keep timing similar.
  const hash = row?.password_hash ?? "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4bQJ0yX3m6qGZ8e1c8Zk1W2l3Q5G";
  const ok = bcrypt.compareSync(password, hash);
  if (!row || !ok || !row.active) return null;
  return { id: row.id, username: row.username, name: row.name, role: row.role, active: row.active };
}
