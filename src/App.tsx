import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import InvoicePage from './pages/InvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './api/queryClient';
import { ClinicProvider } from './contexts/ClinicContext';
import ToastProvider from './components/providers/ToastProvider';

import FinancialDashboardPage from './pages/FinancialDashboardPage';
import PublicClinicPage from './pages/PublicClinicPage';

import ProtectedRoute from './components/ProtectedRoute';

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

        {/* Protected routes */}
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/financial-dashboard" element={<ProtectedRoute><FinancialDashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/prescriptions/:patientId" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/appointments/new" element={<ProtectedRoute><NewAppointmentPage /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="/patients/new" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
        <Route path="/invoice" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
        <Route path="/settings/*" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/appointments/new" element={<ProtectedRoute><NewAppointmentPage /></ProtectedRoute>} />
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
