import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from '../lib/session';
import { CartProvider } from '../lib/cart';
import { ToastProvider } from '../lib/toast';
import RequireSession from '../components/RequireSession';
import SplashPage from '../features/splash/SplashPage';
import HomePage from '../features/home/HomePage';
import MenuPage from '../features/menu/MenuPage';
import DishDetailPage from '../features/menu/DishDetailPage';
import CartPage from '../features/cart/CartPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import OrderStatusPage from '../features/orders/OrderStatusPage';

export default function App() {
  return (
    <SessionProvider>
      <CartProvider>
        <ToastProvider>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route
                path="/home"
                element={
                  <RequireSession>
                    <HomePage />
                  </RequireSession>
                }
              />
              <Route
                path="/menu"
                element={
                  <RequireSession>
                    <MenuPage />
                  </RequireSession>
                }
              />
              <Route
                path="/menu/:id"
                element={
                  <RequireSession>
                    <DishDetailPage />
                  </RequireSession>
                }
              />
              <Route
                path="/cart"
                element={
                  <RequireSession>
                    <CartPage />
                  </RequireSession>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RequireSession>
                    <CheckoutPage />
                  </RequireSession>
                }
              />
              <Route
                path="/order-status"
                element={
                  <RequireSession>
                    <OrderStatusPage />
                  </RequireSession>
                }
              />
            </Routes>
          </div>
        </ToastProvider>
      </CartProvider>
    </SessionProvider>
  );
}
