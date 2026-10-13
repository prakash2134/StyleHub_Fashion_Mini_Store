import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";

const EMPTY = { items: [], count: 0, total_minor: 0 };
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setCart(await api("/cart"));
  }, []);

  useEffect(() => {
    if (!user) {
      setCart(EMPTY);
      return;
    }
    setLoading(true);
    api("/cart")
      .then(setCart)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const addItem = useCallback(
    async (product_id, size, quantity = 1) =>
      setCart(await api("/cart/items", { method: "POST", body: { product_id, size, quantity } })),
    []
  );
  const updateItem = useCallback(
    async (id, quantity) => setCart(await api(`/cart/items/${id}`, { method: "PATCH", body: { quantity } })),
    []
  );
  const removeItem = useCallback(async (id) => setCart(await api(`/cart/items/${id}`, { method: "DELETE" })), []);

  const value = useMemo(
    () => ({ cart, loading, refresh, addItem, updateItem, removeItem }),
    [cart, loading, refresh, addItem, updateItem, removeItem]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
