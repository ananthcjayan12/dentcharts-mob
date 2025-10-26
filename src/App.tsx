import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
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
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './api/queryClient';
import ToastProvider from './components/providers/ToastProvider';

function App() {
  return (
    <QueryProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/prescriptions/:patientId" element={<PrescriptionPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/appointments/new" element={<NewAppointmentPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/patients/new" element={<NewPatientPage />} />
                  <Route path="/invoice" element={<InvoicePage />} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryProvider>
  );
}

export default App;
