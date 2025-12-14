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

const AppRoutes = () => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const background = state?.backgroundLocation || location;

  return (
    <>
      <Routes location={background}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} /> {/* Alias for home */}
        <Route path="/financial-dashboard" element={<FinancialDashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/prescriptions/:patientId" element={<PrescriptionPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/new" element={<NewAppointmentPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/new" element={<NewPatientPage />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/appointments/new" element={<NewAppointmentPage />} />
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
