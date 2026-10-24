"use client";

import { useActionState } from "react";
import { addUser, changePassword, updateSettings, type FormState } from "@/app/(app)/admin/actions";

const input = "rounded-lg border border-stone-300 px-2 py-1.5";
const btn = "rounded-lg bg-amber-700 px-3 py-1.5 text-white disabled:opacity-60";

function Msg({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-red-600">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-green-700">{state.ok}</p>;
  return null;
}

export function NewUserForm() {
  const [state, action, pending] = useActionState(addUser, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="name" placeholder="Full name" required className={input} />
      <input name="username" placeholder="Username" required className={input} />
      <input name="password" type="password" placeholder="Password" required className={input} />
      <select name="role" className={input}>
        <option value="cashier">Cashier</option>
        <option value="admin">Admin</option>
      </select>
      <button disabled={pending} className={btn}>Add user</button>
      <Msg state={state} />
    </form>
  );
}

export function PasswordForm({ userId }: { userId: number }) {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <input name="password" type="password" placeholder="New password" required aria-label="New password" className={`${input} w-36`} />
      <button disabled={pending} className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm">Reset</button>
      <Msg state={state} />
    </form>
  );
}

export function SettingsForm(props: { storeName: string; taxRatePercent: number; receiptFooter: string }) {
  const [state, action, pending] = useActionState(updateSettings, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        Store name
        <input name="storeName" defaultValue={props.storeName} required className={`${input} mt-1 w-full`} />
      </label>
      <label className="text-sm">
        Tax rate (%)
        <input name="taxRatePercent" type="number" step="0.01" min={0} max={100} defaultValue={props.taxRatePercent} className={`${input} mt-1 w-full`} />
      </label>
      <label className="text-sm sm:col-span-2">
        Receipt footer
        <input name="receiptFooter" defaultValue={props.receiptFooter} className={`${input} mt-1 w-full`} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button disabled={pending} className={btn}>Save settings</button>
        <Msg state={state} />
      </div>
    </form>
  );
}
