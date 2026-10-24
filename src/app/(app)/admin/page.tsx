import { requireAdmin } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/settings";
import { listUsers } from "@/lib/services/users";
import { NewUserForm, PasswordForm, SettingsForm } from "@/components/AdminForms";
import { toggleUser } from "./actions";

export default async function AdminPage() {
  const me = await requireAdmin();
  const users = listUsers();
  const settings = getSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Store settings</h2>
        <SettingsForm {...settings} />
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Users</h2>
        <NewUserForm />
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className={`flex flex-wrap items-center gap-3 py-2 ${u.active ? "" : "opacity-60"}`}>
              <div className="min-w-48 flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-stone-500">
                  {u.username} · {u.role}
                </p>
              </div>
              <PasswordForm userId={u.id} />
              {u.id !== me.id && (
                <form action={toggleUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                  <button className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm">
                    {u.active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
