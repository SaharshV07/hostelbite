import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { VendorMenuPage } from './pages/student/VendorMenuPage';
import { CartCheckoutPage } from './pages/student/CartCheckoutPage';
import { OrderTrackingPage } from './pages/student/OrderTrackingPage';
import { OrderHistoryPage } from './pages/student/OrderHistoryPage';
import { WalletPage } from './pages/student/WalletPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Vendor Pages
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { MenuManagementPage } from './pages/vendor/MenuManagementPage';
import { VendorReviewsPage } from './pages/vendor/VendorReviewsPage';

// Delivery Pages
import { DeliveryDashboard } from './pages/delivery/DeliveryDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VendorApprovalsPage } from './pages/admin/VendorApprovalsPage';
import { ComplaintsResolutionPage } from './pages/admin/ComplaintsResolutionPage';
import { UserDirectoryPage } from './pages/admin/UserDirectoryPage';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading HostelBite platform...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '2rem' }}>
        <Routes>
          {/* Public / Student Routes */}
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/vendor/:id" element={<VendorMenuPage />} />
          <Route path="/cart" element={<CartCheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<StudentProfilePage />} />

          {/* Vendor Protected Routes */}
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/menu" element={<MenuManagementPage />} />
          <Route path="/vendor/reviews" element={<VendorReviewsPage />} />

          {/* Delivery Protected Routes */}
          <Route path="/delivery" element={<DeliveryDashboard />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/vendors" element={<VendorApprovalsPage />} />
          <Route path="/admin/complaints" element={<ComplaintsResolutionPage />} />
          <Route path="/admin/users" element={<UserDirectoryPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div><strong>HostelBite &bull; Hostel Food Delivery Application</strong></div>
        <div style={{ marginTop: '0.2rem' }}>
          B.Tech Information Technology &bull; Software Engineering Lab Coursework &bull; Manipal University Jaipur
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
