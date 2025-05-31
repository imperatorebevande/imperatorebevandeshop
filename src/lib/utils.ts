import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBorderColor = (category?: string) => {
  if (!category) return '#E5E7EB'; // grigio di default

  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('acqua')) return '#1B5AAB';
  if (lowerCategory.includes('birra')) return '#CFA100';
  if (lowerCategory.includes('bevande') || lowerCategory.includes('coca') || lowerCategory.includes('fanta') || lowerCategory.includes('schweppes')) return '#558E28';
  if (lowerCategory.includes('vino')) return '#8500AF';

  return '#E5E7EB'; // grigio di default per altre categorie
};

export const getBottleQuantity = (description?: string): number | null => {
  if (!description) return null;

  const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

  const patterns = [
    /(?:x|×)(\d+)\s*(?:bott|bot|bottiglie?)/i,
    /(\d+)\s*(?:x|×)\s*(?:bott|bot|bottiglie?)/i,
    /(\d+)\s*(?:bott|bot|bottiglie?)/i,
    /(\d+)\s*(?:pz|pezzi?)/i,
    /(?:confezione|conf)\.?\s*(?:da\s*)?(\d+)/i,
    /(\d+)\s*(?:cl|ml|lt|litri?)\s*(?:x|×)\s*(\d+)/i, 
    /(?:pack|pacco)\s*(?:da\s*)?(\d+)/i,
    /(\d+)\s*pz/i,
    /(\d+)\s*bottiglie/i,
    /(\d+)\s*lattine/i,
    /(\d+)\s*x\s*(?:\d+)?(?:cl|ml|lt)?/i, // Modificato per gestire casi come "6x" o "6x33cl"
    /(\d+)\s*(?:unità|unit)/i,
    /(\d+)\s*(?:l|litri?)\s*(?:x|×)\s*(\d+)/i,
    /(\d+)\s*(?:,\d+)?\s*(?:l|lt)\s*(?:x|×)\s*(\d+)/i,
    /(?:formato|formato\s+famiglia)\s*(\d+)/i,
    /(?:multipack|multi-pack)\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanDescription.match(pattern);
    if (match) {
      // Per pattern tipo "33cl x 6", la quantità è il secondo gruppo catturato (match[2])
      // Per pattern tipo "6x33cl", la quantità è il primo gruppo catturato (match[1])
      // Negli altri casi, la quantità è il primo gruppo catturato (match[1])
      const quantity = parseInt(match[2] || match[1], 10);
      if (!isNaN(quantity)) {
          return quantity;
      }
    }
  }
  return null;
};
