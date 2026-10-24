import { listCategories, listItems } from "@/lib/services/items";
import { getSettings } from "@/lib/services/settings";
import { SellScreen } from "@/components/SellScreen";

export default function SellPage() {
  const items = listItems({ activeOnly: true }).map((i) => ({
    id: i.id,
    name: i.name,
    categoryId: i.category_id,
    priceCents: i.price_cents,
    stock: i.track_stock ? i.stock : null,
  }));
  const categories = listCategories().filter((c) => items.some((i) => i.categoryId === c.id));
  const { taxRatePercent } = getSettings();
  return <SellScreen categories={categories} items={items} taxRatePercent={taxRatePercent} />;
}
