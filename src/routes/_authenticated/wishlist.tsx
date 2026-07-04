import { createFileRoute, Link } from "@tanstack/react-router";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useAddToCart } from "@/hooks/use-cart";
import { resolveProductImage } from "@/lib/product-images";
import { currency, discountedPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Bloomora" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { data: items, isPending } = useWishlist();
  const toggle = useToggleWishlist();
  const add = useAddToCart();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Saved favorites</h1>
      {isPending ? <p className="mt-8 text-muted-foreground">Loading…</p> : !items || items.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center">
          <p className="font-display text-2xl">No favorites yet</p>
          <p className="mt-2 text-muted-foreground">Tap the heart on bouquets you love.</p>
          <Button asChild className="mt-6"><Link to="/shop">Discover bouquets</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => {
            const p = w.product!;
            const price = p.discount_percent > 0 ? discountedPrice(p.price, p.discount_percent) : p.price;
            return (
              <div key={w.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <Link to="/product/$slug" params={{ slug: p.slug }}>
                  <img src={resolveProductImage(p.image_url)} alt={p.name} className="aspect-square w-full rounded-xl object-cover" />
                </Link>
                <h3 className="mt-3 font-display text-lg">{p.name}</h3>
                <p className="text-sm font-semibold">{currency(price)}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => add.mutate({ productId: p.id })}>
                    <ShoppingBag className="mr-1.5 h-4 w-4" /> Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggle.mutate(p.id)}>
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
