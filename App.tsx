
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { BottomNav } from './components/Layout/BottomNav';
import { ToastContainer } from './components/ui/Toast';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Lotto } from './pages/Lotto';
import { Login } from './pages/Login';
import { CategoryListing } from './pages/CategoryListing';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { SellerDashboard } from './pages/SellerDashboard';
import { SellerProducts } from './pages/SellerProducts';
import { SellerOrders } from './pages/SellerOrders';
import { AdminPanel } from './pages/AdminPanel';
import { Legal } from './pages/Legal';
import { Terms } from './pages/Terms';
import { HowToUse } from './pages/HowToUse';
import { LottoLegal } from './pages/LottoLegal';
import { LocationAnalytics } from './pages/LocationAnalytics';
import TicketPhotos from './pages/TicketPhotos';
import AdminPhotoUpload from './pages/AdminPhotoUpload';
import AdminDrivePhotos from './pages/AdminDrivePhotos';
import AdminLottoOrders from './pages/AdminLottoOrders';
import AdminSellers from './pages/AdminSellers';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminPayments from './pages/AdminPayments';
import AdminPaymentSettings from './pages/AdminPaymentSettings';
import AdminTicketPricing from './pages/AdminTicketPricing';
import AdminSettings from './pages/AdminSettings';
import AdminOCRScanner from './pages/AdminOCRScanner';
import ReferralDashboard from './pages/ReferralDashboard';
import AdminReferrals from './pages/AdminReferrals';
import AdminBilling from './pages/AdminBilling';
import AdminMissions from './pages/AdminMissions';
import DailyMissions from './pages/DailyMissions';
import { AdminLogin } from './pages/AdminLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminManagement } from './pages/AdminManagement';
import AdminExchangeRate from './pages/AdminExchangeRate';
import { AdminActivityLogger } from './components/AdminActivityLogger';

// Alias for better naming
const SpecialProducts = Lotto;
const SpecialProductsLegal = LottoLegal;
import { GlobalProvider } from './context/GlobalContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isSellerRoute || isAdminRoute) {
    return (
      <>
        {isAdminRoute && <AdminActivityLogger />}
        {children}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Add padding bottom for mobile bottom nav */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {/* Hide footer on mobile or keep it at very bottom, typically mobile apps might hide extensive footers */}
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GlobalProvider>
      <Router>
        <ToastContainer />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:slug" element={<CategoryListing />} />
            <Route path="/category" element={<CategoryListing />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/referrals" element={<ReferralDashboard />} />
            <Route path="/missions" element={<DailyMissions />} />
            <Route path="/special-products" element={<SpecialProducts />} />
            <Route path="/lotto" element={<SpecialProducts />} />
            <Route path="/special-products-legal" element={<SpecialProductsLegal />} />
            <Route path="/lotto-legal" element={<SpecialProductsLegal />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            
            {/* Seller Routes - เฉพาะ role seller หรือ admin */}
            <Route path="/seller" element={<ProtectedRoute requiredRole={['seller', 'super_admin', 'admin']}><SellerDashboard /></ProtectedRoute>} />
            <Route path="/seller/products" element={<ProtectedRoute requiredRole={['seller', 'super_admin', 'admin']}><SellerProducts /></ProtectedRoute>} />
            <Route path="/seller/orders" element={<ProtectedRoute requiredRole={['seller', 'super_admin', 'admin']}><SellerOrders /></ProtectedRoute>} />

            {/* Admin Routes - admin role: Order, OCR, ลูกค้า เท่านั้น */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/location" element={<ProtectedRoute requiredRole={['super_admin']}><LocationAnalytics /></ProtectedRoute>} />
            <Route path="/admin/photo-upload" element={<ProtectedRoute requiredRole={['super_admin']}><AdminPhotoUpload /></ProtectedRoute>} />
            <Route path="/admin/drive-photos" element={<ProtectedRoute requiredRole={['super_admin']}><AdminDrivePhotos /></ProtectedRoute>} />
            {/* admin: Order, OCR, ลูกค้า */}
            <Route path="/admin/lotto-orders" element={<ProtectedRoute requiredRole={['super_admin', 'admin']}><AdminLottoOrders /></ProtectedRoute>} />
            <Route path="/admin/ocr-scanner" element={<ProtectedRoute requiredRole={['super_admin', 'admin']}><AdminOCRScanner /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole={['super_admin', 'admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/referrals" element={<ProtectedRoute requiredRole={['super_admin']}><AdminReferrals /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole={['super_admin']}><AdminSettings /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole={['super_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/sellers" element={<ProtectedRoute requiredRole={['super_admin']}><AdminSellers /></ProtectedRoute>} />
            {/* accounting: เฉพาะ การเงิน + ออกบิล */}
            <Route path="/admin/payments" element={<ProtectedRoute requiredRole={['super_admin', 'accounting']}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/billing" element={<ProtectedRoute requiredRole={['super_admin', 'accounting']}><AdminBilling /></ProtectedRoute>} />
            <Route path="/admin/exchange-rate" element={<ProtectedRoute requiredRole={['super_admin']}><AdminExchangeRate /></ProtectedRoute>} />

            <Route path="/admin/payment-settings" element={<ProtectedRoute requiredRole={['super_admin']}><AdminPaymentSettings /></ProtectedRoute>} />
            <Route path="/admin/ticket-pricing" element={<ProtectedRoute requiredRole={['super_admin']}><AdminTicketPricing /></ProtectedRoute>} />

            <Route path="/admin/missions" element={<ProtectedRoute requiredRole={['super_admin']}><AdminMissions /></ProtectedRoute>} />
            <Route path="/admin/management" element={<ProtectedRoute requiredRole="super_admin"><AdminManagement /></ProtectedRoute>} />

            {/* Admin root - super_admin only; accounting เข้า /admin/payments หรือ /admin/billing */}
            <Route path="/admin" element={<ProtectedRoute requiredRole={['super_admin']}><AdminPanel /></ProtectedRoute>} />
            
            {/* Photo Routes */}
            <Route path="/ticket-photos/:orderNumber" element={<TicketPhotos />} />
            
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </Router>
    </GlobalProvider>
  );
};

export default App;
