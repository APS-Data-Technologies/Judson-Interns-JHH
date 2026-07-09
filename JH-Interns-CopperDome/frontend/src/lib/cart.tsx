import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, MenuItem } from './types';

const STORAGE_KEY = 'copperdome.cart';

export const TAX_RATE = 0.085;
export const SERVICE_CHARGE_RATE = 0.18;
export const LOYALTY_POINTS_PER_DOLLAR = 1;

interface CartContextValue {
  lines: CartLine[];
  addItem: (menuItem: MenuItem, kitchenName: string, quantity?: number) => void;
  updateQuantity: (menuItemId: number, delta: number) => void;
  removeItem: (menuItemId: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  loyaltyPoints: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readStoredCart());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addItem = (menuItem: MenuItem, kitchenName: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItem.id === menuItem.id ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...prev, { menuItem, kitchenName, quantity }];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) => (line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const removeItem = (menuItemId: number) => {
    setLines((prev) => prev.filter((line) => line.menuItem.id !== menuItemId));
  };

  const clearCart = () => setLines([]);

  const value = useMemo<CartContextValue>(() => {
    // Money is tracked in integer cents throughout so the displayed total always
    // equals the sum of the displayed line items — plain float math on dollar
    // amounts (e.g. 17 + 17*0.085 + 17*0.18) can land a half-cent short after
    // toFixed(2) rounding.
    const subtotalCents = lines.reduce(
      (sum, line) => sum + Math.round(Number(line.menuItem.price) * 100) * line.quantity,
      0
    );
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const serviceChargeCents = Math.round(subtotalCents * SERVICE_CHARGE_RATE);
    const totalCents = subtotalCents + taxCents + serviceChargeCents;

    const subtotal = subtotalCents / 100;
    const tax = taxCents / 100;
    const serviceCharge = serviceChargeCents / 100;
    const total = totalCents / 100;

    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const loyaltyPoints = Math.round(subtotal * LOYALTY_POINTS_PER_DOLLAR);

    return {
      lines,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      subtotal,
      tax,
      serviceCharge,
      total,
      loyaltyPoints,
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
