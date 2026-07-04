import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export type CartRow = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    stock: number;
    discount_percent: number;
  };
};

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CartRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart")
        .select("id, quantity, product:products(id, name, slug, price, image_url, stock, discount_percent)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).filter((r) => r.product) as unknown as CartRow[];
    },
  });
}

export function useAddToCart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Please sign in to add to cart.");
      const { data: existing } = await supabase
        .from("cart").select("id, quantity").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart").insert({ user_id: user.id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useClearCart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("cart").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}
