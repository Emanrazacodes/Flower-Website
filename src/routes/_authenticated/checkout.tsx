import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart, useClearCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { currency, discountedPrice } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Smartphone, Wallet, Banknote, Lock, CheckCircle2, PackageSearch, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Bloomora" }] }),
  component: CheckoutPage,
});

type PaymentMethod = "card" | "jazzcash" | "easypaisa" | "cod";

const DELIVERY_FEE = 250;

function CheckoutPage() {
  const { user } = useAuth();
  const { data: cart } = useCart();
  const clearCart = useClearCart();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; tracking_code: string } | null>(null);
  const [form, setForm] = useState({
    recipient_name: "",
    recipient_phone: "",
    shipping_address: "",
    delivery_date: "",
    notes: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [wallet, setWallet] = useState({ phone: "", pin: "" });

  const subtotal = cart?.reduce((s, r) => {
    const price = r.product.discount_percent > 0 ? discountedPrice(r.product.price, r.product.discount_percent) : r.product.price;
    return s + price * r.quantity;
  }, 0) ?? 0;
  const total = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0);

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const validatePayment = (): string | null => {
    if (payment === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (!card.name.trim()) return "Enter the cardholder name.";
      if (digits.length < 12) return "Enter a valid card number.";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return "Enter expiry as MM/YY.";
      if (!/^\d{3,4}$/.test(card.cvc)) return "Enter a valid CVC.";
    } else if (payment === "jazzcash" || payment === "easypaisa") {
      const phone = wallet.phone.replace(/\D/g, "");
      if (phone.length < 10) return "Enter your mobile number (e.g. 03XXXXXXXXX).";
      if (wallet.pin.replace(/\D/g, "").length < 4) return "Enter your wallet PIN (at least 4 digits).";
    }
    return null;
  };

  const paymentSummary = () => {
    if (payment === "card") return `Card •••• ${card.number.replace(/\s/g, "").slice(-4)}`;
    if (payment === "jazzcash") return `JazzCash (${wallet.phone})`;
    if (payment === "easypaisa") return `EasyPaisa (${wallet.phone})`;
    return "Cash on Delivery";
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cart || cart.length === 0) return;
    const err = validatePayment();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      // Mock payment processing
      if (payment !== "cod") {
        toast.loading("Processing payment…", { id: "pay" });
        await new Promise((r) => setTimeout(r, 1400));
        toast.success("Payment approved", { id: "pay" });
      }

      const notes = [form.notes, `Payment: ${paymentSummary()}`].filter(Boolean).join(" • ");

      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        total_price: total,
        status: "confirmed",
        shipping_address: form.shipping_address,
        recipient_name: form.recipient_name,
        recipient_phone: form.recipient_phone,
        delivery_date: form.delivery_date || null,
        notes: notes || null,
      }).select("id, tracking_code").single();
      if (orderErr) throw orderErr;

      const items = cart.map((r) => ({
        order_id: order.id,
        product_id: r.product.id,
        quantity: r.quantity,
        price: r.product.discount_percent > 0 ? discountedPrice(r.product.price, r.product.discount_percent) : r.product.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      await clearCart.mutateAsync();
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order confirmed! Tracking code: ${order.tracking_code}`);
      setPlacedOrder({ id: order.id, tracking_code: order.tracking_code });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-petal">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/40">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-4xl">Order confirmed 🌸</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for shopping with Bloomora. A florist is already preparing your bouquet with love.
          </p>
          <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-blush/50 px-6 py-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tracking code</span>
            <span className="font-mono text-lg font-semibold">{placedOrder.tracking_code}</span>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/order/$id" params={{ id: placedOrder.id }}>
                <PackageSearch className="mr-2 h-4 w-4" /> Track your order
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/shop">
                <Sparkles className="mr-2 h-4 w-4" /> Continue shopping
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            You can also view this order anytime under <Link to="/orders" className="underline">My orders</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Button asChild className="mt-6"><Link to="/shop">Shop bouquets</Link></Button>
      </div>
    );
  }

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; hint: string }[] = [
    { id: "card", label: "Credit / Debit Card", icon: <CreditCard className="h-4 w-4" />, hint: "Visa, Mastercard" },
    { id: "jazzcash", label: "JazzCash", icon: <Smartphone className="h-4 w-4" />, hint: "Mobile wallet" },
    { id: "easypaisa", label: "EasyPaisa", icon: <Wallet className="h-4 w-4" />, hint: "Mobile wallet" },
    { id: "cod", label: "Cash on Delivery", icon: <Banknote className="h-4 w-4" />, hint: "Pay the courier" },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Recipient name</Label><Input required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input required value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} /></div>
            </div>
            <div><Label>Shipping address</Label><Textarea required value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Delivery date</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
            </div>
            <div><Label>Card message (optional)</Label><Textarea maxLength={250} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="A note to include with the bouquet…" /></div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Payment method</h2>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Secure checkout</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    payment === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="rounded-full bg-secondary p-2">{m.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.hint}</span>
                  </span>
                  <span className={`h-4 w-4 rounded-full border ${payment === m.id ? "border-primary bg-primary" : "border-border"}`} />
                </button>
              ))}
            </div>

            {payment === "card" && (
              <div className="grid gap-4 rounded-2xl bg-secondary/30 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Cardholder name</Label>
                  <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Full name on card" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Card number</Label>
                  <Input inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} placeholder="4242 4242 4242 4242" />
                </div>
                <div>
                  <Label>Expiry (MM/YY)</Label>
                  <Input inputMode="numeric" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="12/28" />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input inputMode="numeric" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })} placeholder="123" />
                </div>
              </div>
            )}

            {(payment === "jazzcash" || payment === "easypaisa") && (
              <div className="grid gap-4 rounded-2xl bg-secondary/30 p-4 sm:grid-cols-2">
                <div>
                  <Label>Mobile number</Label>
                  <Input inputMode="numeric" value={wallet.phone} onChange={(e) => setWallet({ ...wallet, phone: e.target.value })} placeholder="03XXXXXXXXX" />
                </div>
                <div>
                  <Label>Wallet PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} value={wallet.pin} onChange={(e) => setWallet({ ...wallet, pin: e.target.value.replace(/\D/g, "") })} placeholder="••••" />
                </div>
              </div>
            )}

            {payment === "cod" && (
              <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                Please keep <strong>{currency(total)}</strong> ready in cash. Our courier will collect payment at the doorstep.
              </p>
            )}

            <p className="rounded-xl bg-blush/40 p-3 text-xs text-muted-foreground">
              Demo checkout — no real payment is processed and no card details are stored.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-border/60 bg-card p-6 shadow-petal">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.map((r) => {
              const price = r.product.discount_percent > 0 ? discountedPrice(r.product.price, r.product.discount_percent) : r.product.price;
              return (
                <li key={r.id} className="flex justify-between gap-3">
                  <span className="truncate">{r.product.name} × {r.quantity}</span>
                  <span>{currency(price * r.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{currency(DELIVERY_FEE)}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <span>Total</span><span>{currency(total)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Processing…" : payment === "cod" ? "Place order" : `Pay ${currency(total)}`}
          </Button>
        </aside>
      </form>
    </div>
  );
}
