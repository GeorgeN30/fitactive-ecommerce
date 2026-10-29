export type GarmentProfile = 'jacket' | 'shirt' | 'pant' | 'legging' | 'bra' | 'tank' | 'shorts' | 'unknown';

interface GarmentProduct {
  nombre?: string | null;
  categoria?: string | null;
}

// Product names are more specific than broad catalog categories; gender is irrelevant.
export function classifyGarment(product?: GarmentProduct | null): GarmentProfile {
  const normalize = (value?: string | null) => (value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const classify = (text: string): GarmentProfile => {
    if (/\b(casacas?|chaquetas?|jackets?|poleras?|hoodies?|sudaderas?|sweatshirts?)\b|\bmanga larga\b/.test(text)) return 'jacket';
    if (/\b(shorts?|bermudas?)\b|\bpantalon(?:es)? cortos?\b/.test(text)) return 'shorts';
    if (/\b(leggings?|leggu?ins?|mallas?|tights?)\b/.test(text)) return 'legging';
    if (/\b(pantalon(?:es)?|pants?|joggers?|buzos?|trousers?|sweatpants?)\b/.test(text)) return 'pant';
    if (/\b(bras?|sosten(?:es)?|sujetadores?|alate|minimalist)\b/.test(text)) return 'bra';
    if (/\b(tanks?|bividi|bividis|halter)\b|\bsin mangas\b|\byoga\b.*\btop\b/.test(text)) return 'tank';
    if (/\b(polos?|camisetas?|shirts?|t shirts?|tops?)\b/.test(text)) return 'shirt';
    return 'unknown';
  };
  const named = classify(normalize(product?.nombre));
  return named === 'unknown' ? classify(normalize(product?.categoria)) : named;
}
