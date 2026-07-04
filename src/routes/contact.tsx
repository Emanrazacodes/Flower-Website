import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(1000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bloomora" },
      { name: "description", content: "Get in touch with the Bloomora florists. We're here to help with custom orders and questions." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Please fill the form correctly.");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("Message received — we'll be in touch within 24 hours.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-4xl md:text-5xl">We'd love to hear from you</h1>
        <p className="mt-3 text-muted-foreground">Custom orders, weddings, or just a flower question — we're listening.</p>
      </header>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border/60 bg-card p-6">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} /></div>
          <div><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={1000} rows={6} /></div>
          <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send message"}</Button>
        </form>

        <aside className="space-y-4 text-sm">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <Mail className="mb-2 h-5 w-5 text-primary" />
            <p className="font-medium">hello@bloomora.com</p>
            <p className="text-muted-foreground">For custom orders & inquiries</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <Phone className="mb-2 h-5 w-5 text-primary" />
            <p className="font-medium">+92 329 7830079</p>
            <p className="text-muted-foreground">Mon–Sat, 9am – 7pm PKT</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <MapPin className="mb-2 h-5 w-5 text-primary" />
            <p className="font-medium">Gulberg D, House 122</p>
            <p className="text-muted-foreground">Lahore, Punjab, Pakistan</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
