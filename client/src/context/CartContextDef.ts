import { createContext } from "react";
import { type CartItem } from "../types/index.js";

export interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
}

export const CartContext = createContext<CartContextType | null>(null);