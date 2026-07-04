import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product:products(id, name, slug, price, image_url, discount_percent)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).filter((r) => r.product);
    },
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to save favorites.");
      const { data: existing } = await supabase
        .from("wishlist").select("id").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("wishlist").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
