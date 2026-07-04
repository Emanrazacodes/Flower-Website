import hero from "@/assets/hero-bouquet.jpg";
import roses from "@/assets/flower-roses.jpg";
import peonies from "@/assets/flower-peonies.jpg";
import sunflowers from "@/assets/flower-sunflowers.jpg";
import wedding from "@/assets/flower-wedding.jpg";
import pastel from "@/assets/flower-pastel.jpg";
import tulips from "@/assets/flower-tulips.jpg";
import lilies from "@/assets/flower-lilies.jpg";
import miniRoses from "@/assets/flower-mini-roses.jpg";
import redBouquet from "@/assets/flower-red-bouquet.jpg";
import whiteCascade from "@/assets/flower-white-cascade.jpg";
import mixedBright from "@/assets/flower-mixed-bright.jpg";
import orchids from "@/assets/flower-orchids.jpg";
import hydrangeas from "@/assets/flower-hydrangeas.jpg";
import ranunculus from "@/assets/flower-ranunculus.jpg";
import daisies from "@/assets/flower-daisies.jpg";
import carnations from "@/assets/flower-carnations.jpg";
import mixedPastel from "@/assets/flower-mixed-pastel.jpg";
import blushRoses from "@/assets/flower-blush-roses.jpg";
import springMix from "@/assets/flower-spring-mix.jpg";

const map: Record<string, string> = {
  hero,
  roses,
  peonies,
  sunflowers,
  wedding,
  pastel,
  tulips,
  lilies,
  "mini-roses": miniRoses,
  "red-bouquet": redBouquet,
  "white-cascade": whiteCascade,
  "mixed-bright": mixedBright,
  orchids,
  hydrangeas,
  ranunculus,
  daisies,
  carnations,
  "mixed-pastel": mixedPastel,
  "blush-roses": blushRoses,
  "spring-mix": springMix,
};

export function resolveProductImage(key: string | null | undefined): string {
  if (!key) return hero;
  if (key.startsWith("http") || key.startsWith("/")) return key;
  return map[key] ?? hero;
}

export const heroImage = hero;
