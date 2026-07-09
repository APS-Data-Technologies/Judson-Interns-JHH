const LABELS: Record<string, string> = {
  V: 'Vegetarian',
  GF: 'Gluten-Free',
  SP: 'Spicy',
};

export function dietaryLabel(tag: string): string {
  return LABELS[tag] || tag;
}

export function formatPrice(price: string | number): string {
  return `$${Number(price).toFixed(2)}`;
}
