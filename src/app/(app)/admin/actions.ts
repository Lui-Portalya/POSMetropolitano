"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { saveSettings } from "@/lib/services/settings";
import { createUser, resetPassword, setUserActive } from "@/lib/services/users";

export type FormState = { error?: string; ok?: string };

const newUser = z.object({
  username: z.string().trim().min(3).max(32),
  name: z.string().trim().min(1).max(60),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cashier"]),
});

export async function addUser(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = newUser.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    createUser(parsed.data);
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) return { error: "That username is taken." };
    throw e;
  }
  revalidatePath("/admin");
  return { ok: "User created." };
}

export async function toggleUser(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) return;
  try {
    setUserActive(id, fd.get("active") === "1");
  } catch {
    /* last admin guard */
  }
  revalidatePath("/admin");
}

export async function changePassword(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const pw = z.string().min(6, "Password must be at least 6 characters").safeParse(fd.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  resetPassword(Number(fd.get("id")), pw.data);
  return { ok: "Password updated." };
}

const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(60),
  taxRatePercent: z.coerce.number().min(0).max(100),
  receiptFooter: z.string().trim().max(120),
});

export async function updateSettings(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Check the settings values." };
  saveSettings(parsed.data);
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}
