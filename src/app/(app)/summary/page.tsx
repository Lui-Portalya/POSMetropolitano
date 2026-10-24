import { formatMoney } from "@/lib/money";
import { dailySummary, localToday } from "@/lib/services/summary";

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : localToday();
  const s = dailySummary(date);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily summary</h1>
        <form className="no-print flex gap-2">
          <input type="date" name="date" defaultValue={date} className="rounded-lg border border-stone-300 px-2 py-1.5" />
          <button className="rounded-lg bg-amber-700 px-3 py-1.5 text-white">Go</button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total sales" value={formatMoney(s.totalCents)} />
        <Stat label="Transactions" value={String(s.salesCount)} />
        <Stat label="Voided" value={String(s.voidedCount)} />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">By payment method</h2>
        {s.byMethod.length === 0 ? (
          <p className="text-sm text-stone-500">No sales.</p>
        ) : (
          <ul className="divide-y">
            {s.byMethod.map((m) => (
              <li key={m.method} className="flex justify-between py-1.5">
                <span className="capitalize">
                  {m.method} <span className="text-stone-500">({m.count})</span>
                </span>
                <span className="font-medium">{formatMoney(m.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Items sold</h2>
        {s.topItems.length === 0 ? (
          <p className="text-sm text-stone-500">No items sold.</p>
        ) : (
          <ul className="divide-y">
            {s.topItems.map((i) => (
              <li key={i.name} className="flex justify-between py-1.5">
                <span>
                  {i.name} <span className="text-stone-500">× {i.qty}</span>
                </span>
                <span>{formatMoney(i.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
