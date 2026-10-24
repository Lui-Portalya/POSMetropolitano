import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/money";
import { getSale } from "@/lib/services/sales";
import { getSettings } from "@/lib/services/settings";
import { PrintButton } from "@/components/PrintButton";
import { voidSaleAction } from "./actions";

export default async function SaleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const data = getSale(Number(id));
  if (!data) notFound();
  const { sale, items } = data;
  const settings = getSettings();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {isNew && (
        <div className="no-print rounded-xl bg-green-100 p-4 text-center text-green-900">
          <p className="text-lg font-bold">Sale complete</p>
          {sale.payment_method === "cash" && sale.change_cents > 0 && (
            <p className="text-2xl font-bold">Change: {formatMoney(sale.change_cents)}</p>
          )}
          <Link href="/" className="mt-2 inline-block rounded-lg bg-green-700 px-5 py-2 font-semibold text-white">
            New sale
          </Link>
        </div>
      )}

      <article className="space-y-3 rounded-2xl bg-white p-6 text-sm shadow">
        <header className="text-center">
          <h1 className="text-lg font-bold">{settings.storeName}</h1>
          <p className="text-stone-500">
            Receipt #{sale.id} · {sale.created_at.slice(0, 16)}
          </p>
          <p className="text-stone-500">Cashier: {sale.cashier_name}</p>
          {sale.status === "voided" && <p className="font-bold text-red-600">VOIDED</p>}
        </header>
        <ul className="divide-y border-y">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between py-1.5">
              <span>
                {i.qty} × {i.name_snapshot}
              </span>
              <span>{formatMoney(i.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1">
          {sale.tax_cents > 0 && (
            <>
              <Line label="Subtotal" value={formatMoney(sale.subtotal_cents)} />
              <Line label="Tax" value={formatMoney(sale.tax_cents)} />
            </>
          )}
          <Line label="Total" value={formatMoney(sale.total_cents)} bold />
          <Line label={`Paid (${sale.payment_method})`} value={formatMoney(sale.amount_paid_cents)} />
          {sale.change_cents > 0 && <Line label="Change" value={formatMoney(sale.change_cents)} />}
        </dl>
        {settings.receiptFooter && <p className="text-center text-stone-500">{settings.receiptFooter}</p>}
      </article>

      <div className="no-print flex gap-2">
        <PrintButton />
        <Link href="/sales" className="rounded-lg bg-stone-200 px-4 py-2">
          Back to sales
        </Link>
        {user.role === "admin" && sale.status === "completed" && (
          <form action={voidSaleAction} className="ml-auto">
            <input type="hidden" name="id" value={sale.id} />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-white">Void sale</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
