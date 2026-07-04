import { Star } from "lucide-react";

export function StarRating({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition hover:scale-110" : "cursor-default"}
          aria-label={`${n} stars`}
        >
          <Star
            width={size} height={size}
            className={n <= value ? "fill-primary text-primary" : "fill-none text-muted-foreground/50"}
          />
        </button>
      ))}
    </div>
  );
}
