"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/app/(app)/actions";
import { formatMoney } from "@/lib/money";

type Cat = { id: number; name: string };
type MenuItem = { id: number; name: string; categoryId: number; priceCents: number; stock: number | null };
type Method = "cash" | "card" | "other";

export function SellScreen({
  categories,
  items,
  taxRatePercent,
}: {
  categories: Cat[];
  items: MenuItem[];
  taxRatePercent: number;
}) {
  const router = useRouter();
  const [catId, setCatId] = useState<number | null>(categories[0]?.id ?? null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [method, setMethod] = useState<Method>("cash");
  const [tendered, setTendered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const lines = Object.entries(cart).map(([id, qty]) => ({ item: byId.get(Number(id))!, qty }));
  const subtotal = lines.reduce((s, l) => s + l.item.priceCents * l.qty, 0);
  const tax = Math.round((subtotal * taxRatePercent) / 100);
  const total = subtotal + tax;
  const tenderedCents = tendered === "" ? null : Math.round(parseFloat(tendered) * 100);
  const change = tenderedCents !== null && !Number.isNaN(tenderedCents) ? tenderedCents - total : null;
  const canPay =
    lines.length > 0 && (method !== "cash" || tendered === "" || (change !== null && change >= 0));

  function add(item: MenuItem) {
    setError(null);
    setCart((c) => {
      const next = (c[item.id] ?? 0) + 1;
      if (item.stock !== null && next > item.stock) return c;
      return { ...c, [item.id]: next };
    });
  }
  function dec(id: number) {
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      const res = await checkout({
        lines: lines.map((l) => ({ itemId: l.item.id, qty: l.qty })),
        method,
        tenderedCents: method === "cash" && tenderedCents !== null ? tenderedCents : undefined,
      });
      if ("error" in res) setError(res.error);
      else router.push(`/sales/${res.saleId}?new=1`);
    });
  }

  const visible = items.filter((i) => i.categoryId === catId);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className={`rounded-full px-5 py-2.5 text-base font-medium ${
                c.id === catId ? "bg-amber-700 text-white" : "bg-white text-stone-700 shadow-sm"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {items.length === 0 && <p className="text-stone-500">No menu items yet. An admin can add them under Menu.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((i) => {
            const out = i.stock !== null && i.stock <= (cart[i.id] ?? 0);
            return (
              <button
                key={i.id}
                disabled={out}
                onClick={() => add(i)}
                className="flex min-h-28 flex-col items-start justify-between rounded-2xl bg-white p-4 text-left shadow-sm active:scale-95 disabled:opacity-40"
              >
                <span className="text-lg font-semibold leading-tight">{i.name}</span>
                <span className="text-amber-800">{formatMoney(i.priceCents)}</span>
                {i.stock !== null && (
                  <span className={`text-xs ${i.stock <= 5 ? "text-red-600" : "text-stone-500"}`}>
                    {i.stock} left
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="h-fit space-y-3 rounded-2xl bg-white p-4 shadow lg:sticky lg:top-4">
        <h2 className="text-lg font-bold">Current order</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-stone-500">Tap an item to add it.</p>
        ) : (
          <ul className="divide-y">
            {lines.map(({ item, qty }) => (
              <li key={item.id} className="flex items-center gap-2 py-2">
                <span className="flex-1">{item.name}</span>
                <button aria-label={`Remove one ${item.name}`} onClick={() => dec(item.id)} className="h-9 w-9 rounded-lg bg-stone-200 text-lg">
                  −
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button aria-label={`Add one ${item.name}`} onClick={() => add(item)} className="h-9 w-9 rounded-lg bg-stone-200 text-lg">
                  +
                </button>
                <span className="w-16 text-right">{formatMoney(item.priceCents * qty)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-1 border-t pt-3 text-sm">
          {tax > 0 && (
            <>
              <Row label="Subtotal" value={formatMoney(subtotal)} />
              <Row label={`Tax (${taxRatePercent}%)`} value={formatMoney(tax)} />
            </>
          )}
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["cash", "card", "other"] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-lg py-2 text-sm font-medium capitalize ${
                method === m ? "bg-amber-700 text-white" : "bg-stone-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <QuickCash label="Exact" onClick={() => setTendered((total / 100).toFixed(2))} />
              {[5, 10, 20, 50].map((n) => (
                <QuickCash key={n} label={`$${n}`} onClick={() => setTendered(String(n))} />
              ))}
            </div>
            <label className="block text-sm">
              Cash received
              <input
                inputMode="decimal"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-lg"
              />
            </label>
            {change !== null && (
              <p className={`text-lg font-semibold ${change < 0 ? "text-red-600" : "text-green-700"}`}>
                {change < 0 ? `Short ${formatMoney(-change)}` : `Change ${formatMoney(change)}`}
              </p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCart({});
              setTendered("");
              setError(null);
            }}
            disabled={lines.length === 0}
            className="rounded-lg bg-stone-200 px-4 py-3 disabled:opacity-40"
          >
            Clear
          </button>
          <button
            onClick={pay}
            disabled={!canPay || pending}
            className="flex-1 rounded-lg bg-green-700 py-3 text-lg font-bold text-white hover:bg-green-800 disabled:opacity-40"
          >
            {pending ? "Saving…" : `Charge ${formatMoney(total)}`}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function QuickCash({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900">
      {label}
    </button>
  );
}
