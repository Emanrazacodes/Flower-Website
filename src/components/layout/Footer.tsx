import { Link } from "@tanstack/react-router";
import { Flower2, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/30">
      <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-semibold">Bloomora</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Hand-arranged bouquets, delivered with care. Petal-fresh, every time.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">All bouquets</Link></li>
            <li><Link to="/shop" search={{ category: "wedding" } as never} className="hover:text-primary">Wedding</Link></li>
            <li><Link to="/shop" search={{ category: "valentine" } as never} className="hover:text-primary">Valentine</Link></li>
            <li><Link to="/shop" search={{ category: "birthday" } as never} className="hover:text-primary">Birthday</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/delivery" className="hover:text-primary">Delivery</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact us</Link></li>
            <li><Link to="/orders" className="hover:text-primary">Order tracking</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/80">Follow</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-primary"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bloomora. Petal-fresh, always.
      </div>
    </footer>
  );
}
