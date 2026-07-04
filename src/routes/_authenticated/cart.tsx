import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { resolveProductImage } from "@/lib/product-images";
import { currency, discountedPrice } from "@/lib/format";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "Cart — Bloomora" }] }),
  component: CartPage,
});

function CartPage() {
  const { data: cart, isPending } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const subtotal = cart?.reduce((s, r) => {
    const price = r.product.discount_percent > 0 ? discountedPrice(r.product.price, r.product.discount_percent) : r.product.price;
    return s + price * r.quantity;
  }, 0) ?? 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Your cart</h1>

      {isPending ? <p className="mt-8 text-muted-foreground">Loading…</p> : !cart || cart.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center">
          <p className="font-display text-2xl">Your cart is empty</p>
          <p className="mt-2 text-muted-foreground">Discover our seasonal bouquets.</p>
          <Button asChild className="mt-6"><Link to="/shop">Shop bouquets</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {cart.map((r) => {
              const price = r.product.discount_percent > 0 ? discountedPrice(r.product.price, r.product.discount_percent) : r.product.price;
              return (
                <li key={r.id} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4">
                  <img src={resolveProductImage(r.product.image_url)} alt={r.product.name} className="h-28 w-28 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-4">
                      <Link to="/product/$slug" params={{ slug: r.product.slug }} className="font-display text-lg hover:text-primary">{r.product.name}</Link>
                      <span className="font-semibold">{currency(price * r.quantity)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{currency(price)} each</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button className="px-3 py-1" onClick={() => updateItem.mutate({ id: r.id, quantity: r.quantity - 1 })}>−</button>
                        <span className="w-8 text-center text-sm">{r.quantity}</span>
                        <button className="px-3 py-1" onClick={() => updateItem.mutate({ id: r.id, quantity: Math.min(r.product.stock, r.quantity + 1) })}>+</button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem.mutate(r.id)}>
                        <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-3xl border border-border/60 bg-card p-6 shadow-petal">
            <h2 className="font-display text-xl">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>Calculated at checkout</span></div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold">
              <span>Total</span><span>{currency(subtotal)}</span>
            </div>
            <Button asChild size="lg" className="mt-6 w-full"><Link to="/checkout">Checkout</Link></Button>
          </aside>
        </div>
      )}
    </div>
  );
}
