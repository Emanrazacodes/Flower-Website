import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, LogOut, Menu, Flower2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/delivery", label: "Delivery" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: cart } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const cartCount = cart?.reduce((n, r) => n + r.quantity, 0) ?? 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: q || undefined } as never });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl font-semibold tracking-tight">Bloomora</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm tracking-wide text-foreground/75 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="hidden flex-1 max-w-xs lg:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search bouquets…"
              className="pl-9 bg-secondary/40 border-secondary"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link to="/wishlist" aria-label="Wishlist"><Heart className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/orders">My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/wishlist">Wishlist</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-base hover:bg-secondary">
                    {l.label}
                  </Link>
                ))}
                <Link to="/wishlist" className="rounded-md px-3 py-2 text-base hover:bg-secondary">Wishlist</Link>
                <Link to="/orders" className="rounded-md px-3 py-2 text-base hover:bg-secondary">Orders</Link>
                {!user && <Link to="/auth" className="rounded-md px-3 py-2 text-base hover:bg-secondary">Sign in</Link>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
