import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listSalesForDate } from "@/lib/services/sales";
import { localToday } from "@/lib/services/summary";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : localToday();
  const sales = listSalesForDate(date);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales</h1>
        <form className="flex gap-2">
          <input type="date" name="date" defaultValue={date} className="rounded-lg border border-stone-300 px-2 py-1.5" />
          <button className="rounded-lg bg-amber-700 px-3 py-1.5 text-white">Go</button>
        </form>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {sales.length === 0 ? (
          <p className="p-6 text-center text-stone-500">No sales on {date}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="p-3">#</th>
                <th>Time</th>
                <th>Cashier</th>
                <th>Method</th>
                <th className="text-right">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">
                    <Link href={`/sales/${s.id}`} className="font-medium text-amber-800 underline">
                      {s.id}
                    </Link>
                  </td>
                  <td>{s.created_at.slice(11, 16)}</td>
                  <td>{s.cashier_name}</td>
                  <td className="capitalize">{s.payment_method}</td>
                  <td className={`text-right ${s.status === "voided" ? "line-through" : ""}`}>
                    {formatMoney(s.total_cents)}
                  </td>
                  <td className="p-3 capitalize">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
