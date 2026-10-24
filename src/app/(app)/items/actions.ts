"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { parseMoney } from "@/lib/money";
import { addCategory, createItem, deleteCategory, updateItem, type ItemInput } from "@/lib/services/items";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.coerce.number().int().positive(),
  price: z.string().transform((s, ctx) => {
    const c = parseMoney(s);
    if (c === null) ctx.addIssue({ code: "custom", message: "Invalid price" });
    return c ?? 0;
  }),
  stock: z.coerce.number().int().min(0).default(0),
});

function parseItem(fd: FormData): ItemInput {
  const p = itemSchema.parse({
    name: fd.get("name"),
    categoryId: fd.get("categoryId"),
    price: fd.get("price"),
    stock: fd.get("stock") || 0,
  });
  return {
    name: p.name,
    categoryId: p.categoryId,
    priceCents: p.price,
    trackStock: fd.get("trackStock") === "on",
    stock: p.stock,
    active: fd.get("active") === "on",
  };
}

export async function saveItem(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const input = parseItem(fd);
  if (id) updateItem(id, input);
  else createItem({ ...input, active: true });
  revalidatePath("/items");
  revalidatePath("/");
}

export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const name = z.string().trim().min(1).max(40).parse(fd.get("name"));
  addCategory(name);
  revalidatePath("/items");
  revalidatePath("/");
}

export async function removeCategory(fd: FormData) {
  await requireAdmin();
  try {
    deleteCategory(Number(fd.get("id")));
  } catch {
    /* category in use: ignore, the UI hides delete for used categories */
  }
  revalidatePath("/items");
}
