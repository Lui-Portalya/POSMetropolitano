import { requireAdmin } from "@/lib/auth/guards";
import { listCategories, listItems } from "@/lib/services/items";
import { saveCategory, removeCategory, saveItem } from "./actions";

const input = "rounded-lg border border-stone-300 px-2 py-1.5";

export default async function ItemsPage() {
  await requireAdmin();
  const categories = listCategories();
  const items = listItems();
  const used = new Set(items.map((i) => i.category_id));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Menu</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Categories</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <form key={c.id} action={removeCategory} className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm">
              {c.name}
              <input type="hidden" name="id" value={c.id} />
              {!used.has(c.id) && (
                <button aria-label={`Delete ${c.name}`} className="text-red-600">
                  ×
                </button>
              )}
            </form>
          ))}
          <form action={saveCategory} className="flex gap-2">
            <input name="name" placeholder="New category" required className={input} />
            <button className="rounded-lg bg-amber-700 px-3 py-1.5 text-white">Add</button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Add item</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-stone-500">Create a category first.</p>
        ) : (
          <ItemForm categories={categories} />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Items</h2>
        {items.map((i) => (
          <div key={i.id} className={`rounded-2xl bg-white p-3 shadow-sm ${i.active ? "" : "opacity-60"}`}>
            <ItemForm categories={categories} item={i} />
          </div>
        ))}
      </section>
    </div>
  );
}

function ItemForm({
  categories,
  item,
}: {
  categories: { id: number; name: string }[];
  item?: { id: number; name: string; category_id: number; price_cents: number; track_stock: number; stock: number; active: number };
}) {
  return (
    <form action={saveItem} className="flex flex-wrap items-center gap-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input name="name" defaultValue={item?.name} placeholder="Name" required className={`${input} w-44`} />
      <select name="categoryId" defaultValue={item?.category_id} className={input}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="price"
        defaultValue={item ? (item.price_cents / 100).toFixed(2) : ""}
        placeholder="Price"
        inputMode="decimal"
        required
        className={`${input} w-24`}
      />
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" name="trackStock" defaultChecked={!!item?.track_stock} /> Track stock
      </label>
      <input name="stock" type="number" min={0} defaultValue={item?.stock ?? 0} aria-label="Stock" className={`${input} w-20`} />
      {item && (
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="active" defaultChecked={!!item.active} /> Active
        </label>
      )}
      <button className="rounded-lg bg-amber-700 px-3 py-1.5 text-white">{item ? "Save" : "Add item"}</button>
    </form>
  );
}
