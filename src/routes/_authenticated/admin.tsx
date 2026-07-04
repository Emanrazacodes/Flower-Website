import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { currency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Bloomora" }] }),
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Admin dashboard</h1>
      <p className="mt-2 text-muted-foreground">Manage products, categories, orders, and reviews.</p>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6"><ProductsAdmin /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesAdmin /></TabsContent>
        <TabsContent value="orders" className="mt-6"><OrdersAdmin /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><ReviewsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- PRODUCTS ---------------- */

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
  category_id: string | null;
  personality_type: string;
  is_best_seller: boolean;
  is_featured: boolean;
  discount_percent: string;
};

const emptyProduct: ProductForm = {
  name: "", slug: "", description: "", price: "0", stock: "0",
  image_url: "hero", category_id: null, personality_type: "romantic",
  is_best_seller: false, is_featured: false, discount_percent: "0",
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductForm | null>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, category:categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (p: ProductForm) => {
      const payload = {
        name: p.name, slug: p.slug, description: p.description,
        price: Number(p.price), stock: Number(p.stock), image_url: p.image_url || null,
        category_id: p.category_id, personality_type: p.personality_type as never,
        is_best_seller: p.is_best_seller, is_featured: p.is_featured,
        discount_percent: Number(p.discount_percent),
      };
      const { error } = p.id
        ? await supabase.from("products").update(payload).eq("id", p.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ ...emptyProduct })}><Plus className="mr-1.5 h-4 w-4" /> New product</Button>
      </div>

      {editing && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
          className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2"
        >
          <div><Label>Name</Label><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
          <div><Label>Slug</Label><Input required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <div><Label>Price</Label><Input type="number" step="0.01" required value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
          <div><Label>Stock</Label><Input type="number" required value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></div>
          <div><Label>Image key (hero/roses/peonies/sunflowers/wedding/pastel/tulips/lilies or URL)</Label><Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
          <div><Label>Discount %</Label><Input type="number" value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value })} /></div>
          <div>
            <Label>Category</Label>
            <Select value={editing.category_id ?? ""} onValueChange={(v) => setEditing({ ...editing, category_id: v || null })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Personality</Label>
            <Select value={editing.personality_type} onValueChange={(v) => setEditing({ ...editing, personality_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["romantic", "cheerful", "elegant", "calm"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_best_seller} onChange={(e) => setEditing({ ...editing, is_best_seller: e.target.checked })} /> Best seller</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} /> Featured</label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{editing.id ? "Update" : "Create"}</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-medium">{p.name} {p.is_best_seller && <Badge className="ml-2 bg-primary text-primary-foreground">Best</Badge>}</td>
                <td className="p-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                <td className="p-3">{currency(Number(p.price))}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({
                    id: p.id, name: p.name, slug: p.slug, description: p.description ?? "",
                    price: String(p.price), stock: String(p.stock), image_url: p.image_url ?? "",
                    category_id: p.category_id, personality_type: p.personality_type ?? "romantic",
                    is_best_seller: p.is_best_seller, is_featured: p.is_featured,
                    discount_percent: String(p.discount_percent),
                  })}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this product?")) del.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- CATEGORIES ---------------- */

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const { data } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("categories").insert(form); if (error) throw error; },
    onSuccess: () => { toast.success("Added"); setForm({ name: "", slug: "", description: "" }); qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-2">
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg">Add category</h3>
        <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Slug</Label><Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" className="w-full">Add</Button>
      </form>
    </div>
  );
}

/* ---------------- ORDERS ---------------- */

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Order updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left">
          <tr><th className="p-3">Tracking</th><th className="p-3">Recipient</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data?.map((o) => (
            <tr key={o.id}>
              <td className="p-3 font-mono text-xs">{o.tracking_code}</td>
              <td className="p-3">{o.recipient_name}</td>
              <td className="p-3">{currency(Number(o.total_price))}</td>
              <td className="p-3">
                <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v })}>
                  <SelectTrigger className="w-44 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- REVIEWS ---------------- */

function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*, product:products(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });
  return (
    <ul className="space-y-3">
      {data?.map((r) => (
        <li key={r.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="font-medium">{r.product?.name ?? "Product"} — {r.rating}★</p>
            {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
        </li>
      ))}
    </ul>
  );
}
