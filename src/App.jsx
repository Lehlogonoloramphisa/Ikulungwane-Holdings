import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import { getSetupStatus } from '@/lib/setupApi';
import { installImageFallbacks } from '@/lib/imageFallbacks';

// Layout
import SiteLayout from './components/layout/SiteLayout';
import AdminLayout from './components/admin/AdminLayout';
import AdminGate from './components/admin/AdminGate';

// Public Pages
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Services from './pages/Services';
import Booking from './pages/Booking';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import LegalPage from './pages/LegalPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetupWizard from './pages/setup/SetupWizard';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import PortfolioManagement from './pages/admin/PortfolioManagement';
import ServicesManagement from './pages/admin/ServicesManagement';
import BookingsManagement from './pages/admin/BookingsManagement';
import LeadsManagement from './pages/admin/LeadsManagement';
import TestimonialsManagement from './pages/admin/TestimonialsManagement';
import BlogManagement from './pages/admin/BlogManagement';
import TeamManagement from './pages/admin/TeamManagement';
import SettingsPage from './pages/admin/SettingsPage';
import PageBuilder from './pages/admin/PageBuilder';
import AdminLogin from './pages/admin/AdminLogin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [installStatus, setInstallStatus] = useState({ loading: true, available: false, installed: true });

  useEffect(() => {
    let mounted = true;

    getSetupStatus()
      .then((status) => {
        if (mounted) setInstallStatus({ loading: false, ...status });
      })
      .catch(() => {
        if (mounted) setInstallStatus({ loading: false, available: false, installed: true });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-bronze/30 border-t-bronze rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!installStatus.loading && installStatus.available && !installStatus.installed && !location.pathname.startsWith("/setup")) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <Routes>
      {/* Installer */}
      <Route path="/setup/*" element={<SetupWizard installStatus={installStatus} />} />

      {/* Local Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Public Pages */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<LegalPage page="privacy" />} />
        <Route path="/terms" element={<LegalPage page="terms" />} />
        <Route path="/cookies" element={<LegalPage page="cookies" />} />
      </Route>

      {/* Admin Dashboard */}
      <Route element={<AdminGate><AdminLayout /></AdminGate>}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/page-builder" element={<PageBuilder />} />
        <Route path="/admin/portfolio" element={<PortfolioManagement />} />
        <Route path="/admin/services" element={<ServicesManagement />} />
        <Route path="/admin/bookings" element={<BookingsManagement />} />
        <Route path="/admin/leads" element={<LeadsManagement />} />
        <Route path="/admin/testimonials" element={<TestimonialsManagement />} />
        <Route path="/admin/blog" element={<BlogManagement />} />
        <Route path="/admin/team" element={<TeamManagement />} />
        <Route path="/admin/legal" element={<SettingsPage initialTab="legal" />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  useEffect(() => installImageFallbacks(document), []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
