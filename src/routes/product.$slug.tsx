import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveProductImage } from "@/lib/product-images";
import { currency, discountedPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { useAddToCart } from "@/hooks/use-cart";
import { useToggleWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Bloomora` },
      { name: "description", content: "Luxury hand-arranged bouquet from Bloomora." },
    ],
  }),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const addToCart = useAddToCart();
  const toggleWish = useToggleWishlist();
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: product, isPending } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", product?.id],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id")
        .eq("product_id", product!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Please sign in to review.");
      const { error } = await supabase.from("reviews").upsert({
        user_id: user.id, product_id: product.id, rating, comment: comment.trim() || null,
      }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review posted");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", product?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (!product) return null;

  const discount = product.discount_percent ?? 0;
  const finalPrice = discount > 0 ? discountedPrice(Number(product.price), discount) : Number(product.price);
  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/shop" className="hover:text-primary">Shop</Link> / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-secondary/30 shadow-petal">
          <img src={resolveProductImage(product.image_url)} alt={product.name} className="aspect-square w-full object-cover" />
        </div>
        <div>
          {product.category && <Badge variant="secondary" className="mb-3">{product.category.name}</Badge>}
          <h1 className="font-display text-4xl md:text-5xl">{product.name}</h1>
          {reviews && reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2"><StarRating value={Math.round(avgRating)} /><span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span></div>
          )}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{currency(finalPrice)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{currency(Number(product.price))}</span>
                <Badge className="bg-accent text-accent-foreground">−{discount}%</Badge>
              </>
            )}
          </div>
          <p className="mt-5 text-muted-foreground">{product.description}</p>

          <div className="mt-6 inline-flex items-center rounded-full border border-border">
            <button className="px-4 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-10 text-center">{qty}</span>
            <button className="px-4 py-2 text-lg" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" disabled={product.stock === 0 || addToCart.isPending}
              onClick={() => addToCart.mutate({ productId: product.id, quantity: qty })}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleWish.mutate(product.id)}>
              <Heart className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-5 text-sm">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Same-day delivery available in select cities</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 7-day petal-fresh guarantee</div>
          </div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="font-display text-3xl">Customer reviews</h2>
        {user ? (
          <form
            onSubmit={(e) => { e.preventDefault(); submitReview.mutate(); }}
            className="mt-6 rounded-2xl border border-border/60 bg-card p-6"
          >
            <label className="text-sm font-medium">Your rating</label>
            <div className="mt-2"><StarRating value={rating} onChange={setRating} size={22} /></div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts…" maxLength={500} className="mt-4" />
            <Button type="submit" className="mt-4" disabled={submitReview.isPending}>Post review</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to leave a review.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {reviews && reviews.length > 0 ? reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            </article>
          )) : <p className="text-sm text-muted-foreground">Be the first to review.</p>}
        </div>
      </section>
    </div>
  );
}
