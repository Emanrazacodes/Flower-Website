import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  personality: z.string().optional(),
  max: z.number().optional(),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Bouquets — Bloomora" },
      { name: "description", content: "Browse our full collection of luxury floral bouquets. Filter by occasion, mood, and price." },
      { property: "og:title", content: "Shop Bouquets — Bloomora" },
      { property: "og:description", content: "Hand-arranged bouquets for every occasion." },
    ],
  }),
  validateSearch: searchSchema,
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [maxPrice, setMaxPrice] = useState(search.max ?? 60000);
  useEffect(() => { setQ(search.q ?? ""); }, [search.q]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name, slug").order("name")).data ?? [],
  });

  const { data: products, isPending } = useQuery({
    queryKey: ["shop-products", search],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("id, name, slug, price, image_url, is_best_seller, discount_percent, category:categories(slug)")
        .order("created_at", { ascending: false });
      if (search.q) query = query.ilike("name", `%${search.q}%`);
      if (search.personality) query = query.eq("personality_type", search.personality as never);
      if (search.max) query = query.lte("price", search.max);
      const { data, error } = await query;
      if (error) throw error;
      let rows = data ?? [];
      if (search.category) rows = rows.filter((p) => p.category?.slug === search.category);
      return rows;
    },
  });

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl">Our bouquets</h1>
        <p className="mt-2 text-muted-foreground">Filter by occasion, mood, and price to find the one.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); updateSearch({ q: q || undefined }); }}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
            </div>
          </form>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Occasion</h3>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => updateSearch({ category: undefined })}
                className={`rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${!search.category ? "bg-secondary font-medium text-primary" : ""}`}>
                All occasions
              </button>
              {categories?.map((c) => (
                <button key={c.id} onClick={() => updateSearch({ category: c.slug })}
                  className={`rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${search.category === c.slug ? "bg-secondary font-medium text-primary" : ""}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {["romantic", "cheerful", "elegant", "calm"].map((p) => (
                <button key={p} onClick={() => updateSearch({ personality: search.personality === p ? undefined : p })}
                  className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                    search.personality === p ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Max price</h3>
            <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])}
              onValueCommit={(v) => updateSearch({ max: v[0] })} min={5000} max={60000} step={500} />
            <p className="mt-2 text-xs text-muted-foreground">Up to Rs {maxPrice.toLocaleString("en-PK")}</p>
          </div>

          {(search.q || search.category || search.personality || search.max) && (
            <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>Clear filters</Button>
          )}
        </aside>

        <section>
          {isPending ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/40" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (<ProductCard key={p.id} product={p} />))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="font-display text-xl">No bouquets match your filters</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search.</p>
              <Button asChild variant="outline" className="mt-5"><Link to="/shop">Reset</Link></Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
