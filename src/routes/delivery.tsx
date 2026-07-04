import { createFileRoute } from "@tanstack/react-router";
import { Truck, Clock, ShieldCheck, Snowflake, MapPin, Gift } from "lucide-react";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Information — Bloomora" },
      { name: "description", content: "Bloomora delivery zones, schedules, and our 7-day freshness guarantee." },
    ],
  }),
  component: DeliveryPage,
});

const items = [
  { icon: Truck, title: "Same-day delivery", body: "Order before 1pm for same-day delivery within our city zones." },
  { icon: Clock, title: "Scheduled delivery", body: "Pick any future date at checkout and we'll deliver on the dot." },
  { icon: Snowflake, title: "Petal-fresh transport", body: "Climate-controlled vans keep your bouquet vibrant in transit." },
  { icon: MapPin, title: "Nationwide shipping", body: "Express overnight available to most addresses across the country." },
  { icon: ShieldCheck, title: "7-day guarantee", body: "If your bouquet isn't fresh on arrival, we replace it free." },
  { icon: Gift, title: "Hand-written cards", body: "Add a personal note at checkout, included free with every order." },
];

function DeliveryPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-4xl md:text-5xl">Delivery you can trust</h1>
        <p className="mt-3 text-muted-foreground">Petal-fresh, on time, beautifully presented.</p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-6">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-display text-xl">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <section className="mt-14 rounded-3xl border border-border/60 bg-secondary/30 p-8">
        <h2 className="font-display text-2xl">Delivery zones & timing</h2>
        <table className="mt-5 w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="py-2">Zone</th><th>Cut-off</th><th>Delivery</th><th>Fee</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr><td className="py-3">City center</td><td>1:00 pm</td><td>Same-day, 4–8 pm</td><td>$8</td></tr>
            <tr><td className="py-3">Greater metro</td><td>11:00 am</td><td>Same-day, 5–9 pm</td><td>$12</td></tr>
            <tr><td className="py-3">Nationwide</td><td>10:00 am</td><td>Next-day express</td><td>$20</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
