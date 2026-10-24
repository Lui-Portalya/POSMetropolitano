"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { voidSale } from "@/lib/services/sales";

export async function voidSaleAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  try {
    voidSale(id);
  } catch {
    /* already voided or missing: page re-renders with current state */
  }
  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
  revalidatePath("/");
}
