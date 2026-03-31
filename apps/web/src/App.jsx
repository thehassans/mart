import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { USER_ROLES } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import AdminShellLayout from './components/admin/AdminShellLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage.jsx';
import AdminContentPage from './pages/AdminContentPage.jsx';
import AdminInventoryPage from './pages/AdminInventoryPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import AdminPosPage from './pages/AdminPosPage.jsx';
import AdminTenantsPage from './pages/AdminTenantsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PosPage from './pages/PosPage.jsx';

export default function App() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || 'en';
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/panel"
          element={(
            <ProtectedRoute allowedRoles={[USER_ROLES.STORE_ADMIN, USER_ROLES.SUPER_ADMIN]}>
              <AdminShellLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<AdminPanelPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="pos" element={<AdminPosPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route
            path="tenants"
            element={(
              <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
                <AdminTenantsPage />
              </ProtectedRoute>
            )}
          />
        </Route>
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route
          path="/super-admin"
          element={(
            <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
              <Navigate replace to="/admin/panel/tenants" />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </div>
  );
}
