"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">POS Metropolitano</h1>
          <p className="text-sm text-stone-500">Sign in to continue</p>
        </div>
        <label className="block text-sm font-medium">
          Username
          <input
            name="username"
            autoComplete="username"
            autoFocus
            defaultValue={state.username}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-amber-700 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
