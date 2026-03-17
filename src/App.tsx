import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import RootRedirect from './pages/RootRedirect';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PrescriptionPage from './pages/PrescriptionPage';
import AppointmentsPage from './pages/AppointmentsPage';
import NewAppointmentPage from './pages/NewAppointmentPage';
import PatientsPage from './pages/PatientsPage';
import NewPatientPage from './pages/NewPatientPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import WhatsAppManagerPage from './pages/WhatsAppManagerPage';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './api/queryClient';
import { ClinicProvider } from './contexts/ClinicContext';
import ToastProvider from './components/providers/ToastProvider';

import FinancialDashboardPage from './pages/FinancialDashboardPage';
import OrthodonticDashboardPage from './pages/OrthodonticDashboardPage';
import PublicClinicPage from './pages/PublicClinicPage';
import PageAccessGuard from './components/auth/PageAccessGuard';

const AppRoutes = () => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const background = state?.backgroundLocation || location;

  return (
    <>
      <Routes location={background}>
        {/* Public routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/public/clinic/:clinicId" element={<PublicClinicPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<PageAccessGuard pageKey="home"><HomePage /></PageAccessGuard>} />
        <Route path="/dashboard" element={<PageAccessGuard pageKey="home"><HomePage /></PageAccessGuard>} /> {/* Alias for home */}
        <Route path="/financial-dashboard" element={<PageAccessGuard pageKey="financial_dashboard"><FinancialDashboardPage /></PageAccessGuard>} />
        <Route path="/financial-dashboard/orthodontic" element={<PageAccessGuard pageKey="financial_dashboard"><OrthodonticDashboardPage /></PageAccessGuard>} />
        <Route path="/profile" element={<PageAccessGuard><ProfilePage /></PageAccessGuard>} />
        <Route path="/prescriptions/:patientId" element={<PageAccessGuard pageKey="prescriptions"><PrescriptionPage /></PageAccessGuard>} />
        <Route path="/appointments" element={<PageAccessGuard pageKey="appointments"><AppointmentsPage /></PageAccessGuard>} />
        <Route path="/appointments/new" element={<PageAccessGuard pageKey="appointments"><NewAppointmentPage /></PageAccessGuard>} />
        <Route path="/patients" element={<PageAccessGuard pageKey="patients"><PatientsPage /></PageAccessGuard>} />
        <Route path="/patients/new" element={<PageAccessGuard pageKey="patients"><NewPatientPage /></PageAccessGuard>} />
        <Route path="/invoice" element={<PageAccessGuard pageKey="invoice"><Navigate to="/invoices?create=1" replace /></PageAccessGuard>} />
        <Route path="/invoices" element={<PageAccessGuard pageKey="invoice"><InvoicesPage /></PageAccessGuard>} />
        <Route path="/settings/*" element={<PageAccessGuard pageKey="settings" requireAdmin><SettingsPage /></PageAccessGuard>} />
        <Route path="/whatsapp-manager" element={<PageAccessGuard pageKey="whatsapp-manager"><WhatsAppManagerPage /></PageAccessGuard>} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/appointments/new" element={<PageAccessGuard pageKey="appointments"><NewAppointmentPage /></PageAccessGuard>} />
        </Routes>
      )}
    </>
  );
};

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <ClinicProvider>
            <Router>
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </ClinicProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
