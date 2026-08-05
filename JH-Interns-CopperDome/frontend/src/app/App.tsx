import { Routes, Route, useLocation } from 'react-router-dom';
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
import ConciergePage from '../features/concierge/ConciergePage';
import StaffFeedPage from '../features/staff/StaffFeedPage';
import AnalyticsPage from '../features/staff/AnalyticsPage';
import KitchenDisplayPage from '../features/staff/KitchenDisplayPage';
import StaffAuthGate from '../features/staff/StaffAuthGate';

export default function App() {
  // Patrons are on phones (scope 5.1), so the patron app stays a phone-width column even
  // on a laptop. The staff screens are the opposite: a floor tablet or a desk machine,
  // where a 480px column wastes the space they actually need.
  const isStaffView = useLocation().pathname.startsWith('/staff');

  return (
    <SessionProvider>
      <CartProvider>
        <ToastProvider>
          <div className={`app-shell${isStaffView ? ' app-shell--wide' : ''}`}>
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
              {/* Same screen as the cart, opened on its All Orders tab. */}
              <Route
                path="/orders"
                element={
                  <RequireSession>
                    <CartPage initialTab="all" />
                  </RequireSession>
                }
              />
              <Route
                path="/concierge"
                element={
                  <RequireSession>
                    <ConciergePage />
                  </RequireSession>
                }
              />
              {/* Staff screens require a real account — never a patron token (5.6). */}
              <Route
                path="/staff"
                element={
                  <StaffAuthGate>
                    <StaffFeedPage />
                  </StaffAuthGate>
                }
              />
              <Route
                path="/staff/kitchen"
                element={
                  <StaffAuthGate>
                    <KitchenDisplayPage />
                  </StaffAuthGate>
                }
              />
              <Route
                path="/staff/analytics"
                element={
                  <StaffAuthGate>
                    <AnalyticsPage />
                  </StaffAuthGate>
                }
              />
            </Routes>
          </div>
        </ToastProvider>
      </CartProvider>
    </SessionProvider>
  );
}
