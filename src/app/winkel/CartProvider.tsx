'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addLine,
  cartCount,
  cartSubtotal,
  readCart,
  removeLine,
  setQty,
  writeCart,
  type CartLine,
} from '@/lib/cart';

/**
 * The basket, shared across the shop.
 *
 * Hydration-safe by design: the first render always draws an empty basket,
 * and localStorage is read in an effect afterwards. Reading during render
 * would make the server's HTML and the client's first render disagree, and
 * React would throw away the whole tree — which on this page means the
 * product grid flashing. `ready` tells the UI which of the two states it is
 * looking at, so a basket badge can stay blank rather than flickering 0 → 3.
 */

interface CartContext {
  lines: CartLine[];
  /** False until localStorage has been read. */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: CartLine) => void;
  update: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
  }, []);

  /*
   * Two tabs are one basket. Without this, someone adding a housing in one tab
   * and checking out in another pays for whichever tab happened to write last.
   */
  useEffect(() => {
    const onStorage = () => setLines(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    writeCart(next);
  }, []);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      ready,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      add: (line) => commit(addLine(lines, line)),
      update: (slug, qty) => commit(setQty(lines, slug, qty)),
      remove: (slug) => commit(removeLine(lines, slug)),
      clear: () => commit([]),
    }),
    [lines, ready, commit]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart moet binnen CartProvider staan');
  return ctx;
}
