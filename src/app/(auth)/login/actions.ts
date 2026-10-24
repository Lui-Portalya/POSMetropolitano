"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth/session";
import { verifyCredentials } from "@/lib/services/users";

export type LoginState = { error?: string; username?: string };

const schema = z.object({ username: z.string().trim().min(1), password: z.string().min(1) });

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your username and password.", username };
  const user = verifyCredentials(parsed.data.username, parsed.data.password);
  if (!user) return { error: "Incorrect username or password.", username };
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
