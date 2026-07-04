import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveProductImage } from "@/lib/product-images";
import { currency, discountedPrice } from "@/lib/format";
import { useAddToCart } from "@/hooks/use-cart";
import { useToggleWishlist } from "@/hooks/use-wishlist";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  is_best_seller?: boolean;
  discount_percent?: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const addToCart = useAddToCart();
  const toggleWish = useToggleWishlist();
  const discount = product.discount_percent ?? 0;
  const finalPrice = discount > 0 ? discountedPrice(product.price, discount) : product.price;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-petal">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-secondary/30">
        <img
          src={resolveProductImage(product.image_url)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_best_seller && <Badge className="bg-primary text-primary-foreground">Best seller</Badge>}
          {discount > 0 && <Badge variant="secondary" className="bg-accent text-accent-foreground">−{discount}%</Badge>}
        </div>
        <button
          aria-label="Add to wishlist"
          onClick={(e) => { e.preventDefault(); toggleWish.mutate(product.id); }}
          className="absolute right-3 top-3 rounded-full bg-background/85 p-2 backdrop-blur transition hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="font-display text-lg leading-snug hover:text-primary">
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold">{currency(finalPrice)}</span>
          {discount > 0 && <span className="text-sm text-muted-foreground line-through">{currency(product.price)}</span>}
        </div>
        <Button
          size="sm"
          className="mt-4 w-full"
          onClick={() => addToCart.mutate({ productId: product.id })}
          disabled={addToCart.isPending}
        >
          <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
        </Button>
      </div>
    </article>
  );
}
