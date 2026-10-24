"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { createSale, SaleError } from "@/lib/services/sales";

const schema = z.object({
  lines: z.array(z.object({ itemId: z.number().int(), qty: z.number().int().positive() })).min(1),
  method: z.enum(["cash", "card", "other"]),
  tenderedCents: z.number().int().nonnegative().optional(),
});

export async function checkout(input: unknown): Promise<{ saleId: number } | { error: string }> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid order." };
  try {
    const saleId = createSale(user.id, parsed.data.lines, {
      method: parsed.data.method,
      tenderedCents: parsed.data.tenderedCents,
    });
    return { saleId };
  } catch (e) {
    if (e instanceof SaleError) return { error: e.message };
    throw e;
  }
}
