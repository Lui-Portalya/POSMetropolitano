import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/settings";
import { logout } from "../(auth)/login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { storeName } = getSettings();
  const links = [
    { href: "/", label: "Sell" },
    { href: "/sales", label: "Sales" },
    { href: "/summary", label: "Summary" },
    ...(user.role === "admin"
      ? [
          { href: "/items", label: "Menu" },
          { href: "/admin", label: "Admin" },
        ]
      : []),
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print flex flex-wrap items-center gap-x-6 gap-y-2 bg-amber-800 px-4 py-2 text-white">
        <span className="font-bold">{storeName}</span>
        <nav className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-sm hover:bg-amber-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="ml-auto flex items-center gap-3 text-sm">
          <span>{user.name}</span>
          <button className="rounded-md bg-amber-900 px-3 py-1.5 hover:bg-amber-950">Sign out</button>
        </form>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
