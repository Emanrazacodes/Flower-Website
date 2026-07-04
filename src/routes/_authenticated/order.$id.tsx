import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/order/$id")({
  head: () => ({ meta: [{ title: "Order tracking — Bloomora" }] }),
  component: OrderPage,
});

const stages = [
  { key: "pending", label: "Order received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Arranging" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function OrderPage() {
  const { id } = Route.useParams();

  const { data: order, isPending } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, order_items(*, product:products(name, slug, image_url))")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isPending) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center">Order not found.</div>;

  const stageIdx = stages.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <Link to="/orders" className="text-sm text-primary hover:underline">← All orders</Link>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Order #{order.tracking_code}</h1>
      <p className="mt-1 text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>

      {isCancelled ? (
        <Badge className="mt-6 bg-destructive text-destructive-foreground">Cancelled</Badge>
      ) : (
        <ol className="mt-10 grid grid-cols-5 gap-2">
          {stages.map((s, i) => {
            const done = i <= stageIdx;
            const active = i === stageIdx;
            return (
              <li key={s.key} className="flex flex-col items-center text-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                } ${active ? "ring-4 ring-primary/20" : ""}`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="mt-2 text-xs">{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-xl">Delivery</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Recipient</dt><dd>{order.recipient_name}</dd></div>
            <div><dt className="text-muted-foreground">Phone</dt><dd>{order.recipient_phone}</dd></div>
            <div><dt className="text-muted-foreground">Address</dt><dd className="whitespace-pre-line">{order.shipping_address}</dd></div>
            {order.delivery_date && <div><dt className="text-muted-foreground">Date</dt><dd>{order.delivery_date}</dd></div>}
            {order.notes && <div><dt className="text-muted-foreground">Card message</dt><dd className="italic">"{order.notes}"</dd></div>}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-xl">Items</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {order.order_items?.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span>{it.product?.name ?? "Item"} × {it.quantity}</span>
                <span>{currency(Number(it.price) * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold">
            <span>Total</span><span>{currency(Number(order.total_price))}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
