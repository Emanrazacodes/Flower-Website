import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { currency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders — Bloomora" }] }),
  component: OrdersPage,
});

const statusColors: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-accent text-accent-foreground",
  preparing: "bg-accent text-accent-foreground",
  out_for_delivery: "bg-primary text-primary-foreground",
  delivered: "bg-sage text-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders, isPending } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-4xl md:text-5xl">My orders</h1>
      {isPending ? <p className="mt-8 text-muted-foreground">Loading…</p> : !orders || orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center">
          <p className="font-display text-2xl">No orders yet</p>
          <Button asChild className="mt-6"><Link to="/shop">Shop bouquets</Link></Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg">Order #{o.tracking_code}</p>
                  <p className="text-xs text-muted-foreground">Placed {new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[o.status]}>{o.status.replace(/_/g, " ")}</Badge>
                  <span className="font-semibold">{currency(Number(o.total_price))}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild size="sm" variant="outline"><Link to="/order/$id" params={{ id: o.id }}>Track</Link></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
