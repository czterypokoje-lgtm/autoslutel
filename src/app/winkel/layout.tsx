import { CartProvider } from './CartProvider';
import CartBar from './CartBar';

/**
 * Everything under /winkel shares one basket.
 *
 * The provider sits in a layout rather than on each page so navigating from a
 * product to the basket does not remount it and lose the lines held in state
 * between a write and the next read.
 */
export default function WinkelLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CartBar />
      {children}
    </CartProvider>
  );
}
