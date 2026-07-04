import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Flower2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { heroImage } from "@/lib/product-images";

const featuredQueryOptions = () =>
  queryOptions({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, is_best_seller, discount_percent, is_featured")
        .or("is_featured.eq.true,is_best_seller.eq.true")
        .order("is_featured", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug, description").order("name");
      return data ?? [];
    },
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bloomora — Luxury Bouquets Delivered" },
      { name: "description", content: "Hand-arranged seasonal bouquets for birthdays, weddings, anniversaries and more. Same-day delivery available." },
      { property: "og:title", content: "Bloomora — Luxury Bouquets Delivered" },
      { property: "og:description", content: "Hand-arranged seasonal bouquets, delivered fresh." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQueryOptions());
    context.queryClient.ensureQueryData(categoriesQueryOptions());
  },
  component: Home,
  errorComponent: ({ error }) => <div className="p-10 text-center text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQueryOptions());
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-soft-radial">
        <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wider text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> New season collection
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-balance md:text-7xl">
              Petal-fresh bouquets, <span className="text-primary italic">delivered with love.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Hand-arranged by our florists each morning. Choose by occasion, mood, or simply what makes you smile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/shop">Shop the collection <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/shop" search={{ category: "wedding" } as never}>Wedding bouquets</Link></Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div className="flex flex-col items-start gap-1"><Truck className="h-4 w-4 text-primary" /> Same-day delivery</div>
              <div className="flex flex-col items-start gap-1"><Flower2 className="h-4 w-4 text-primary" /> 7-day freshness</div>
              <div className="flex flex-col items-start gap-1"><ShieldCheck className="h-4 w-4 text-primary" /> Petal guarantee</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-bloom-gradient blur-2xl opacity-70" />
            <img
              src={heroImage}
              alt="Luxury blush pink bouquet"
              width={1600}
              height={1280}
              className="mx-auto h-full max-h-[560px] w-auto rounded-[2rem] object-cover shadow-petal"
            />
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="border-y border-border/60 bg-primary text-primary-foreground">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6">
          <p className="font-medium">✿ Spring sale — up to 20% off selected bouquets</p>
          <Link to="/shop" className="story-link text-primary-foreground/95 underline-offset-4 hover:text-primary-foreground">Shop the sale →</Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Shop by occasion</h2>
            <p className="mt-2 text-muted-foreground">Find the perfect arrangement for the moment.</p>
          </div>
          <Link to="/shop" className="hidden text-sm text-primary hover:underline sm:inline-block">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug } as never}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-bloom-gradient p-5 transition hover:-translate-y-1 hover:shadow-petal"
            >
              <span className="font-display text-lg leading-tight">{c.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED & BEST SELLERS */}
      <section className="container mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl">Best sellers & featured</h2>
          <p className="mt-2 text-muted-foreground">The bouquets our customers reach for again and again.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      </section>

      {/* PERSONALITY */}
      <section className="bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-3xl md:text-4xl">Find your floral mood</h2>
            <p className="mt-2 text-muted-foreground">Romantic, cheerful, elegant, or calm — let your feeling lead the way.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { key: "romantic", label: "Romantic", desc: "Soft pinks & blush roses" },
              { key: "cheerful", label: "Cheerful", desc: "Bright yellows & sunlight" },
              { key: "elegant", label: "Elegant", desc: "White & ivory perfection" },
              { key: "calm", label: "Calm", desc: "Lavender & muted tones" },
            ].map((p) => (
              <Link key={p.key} to="/shop" search={{ personality: p.key } as never}
                className="group rounded-2xl border border-border/60 bg-card p-6 text-center transition hover:-translate-y-1 hover:shadow-petal">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-bloom-gradient" />
                <h3 className="font-display text-xl">{p.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
