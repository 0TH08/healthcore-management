import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PasswordRecoveryPage from './pages/public/PasswordRecoveryPage';
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import SearchAppointmentsPage from './pages/patient/SearchAppointmentsPage';
import AppointmentBookingPage from './pages/patient/AppointmentBookingPage';
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage';
import PaymentPage from './pages/patient/PaymentPage';
import MyMedicalRecordPage from './pages/patient/MyMedicalRecordPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function RootRedirect() {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recover-password" element={<PasswordRecoveryPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<ProtectedRoute roles={['PATIENT']} />}>
              <Route path="/patient" element={<PatientDashboardPage />} />
              <Route path="/patient/search" element={<SearchAppointmentsPage />} />
              <Route path="/patient/book" element={<AppointmentBookingPage />} />
              <Route path="/patient/appointments" element={<MyAppointmentsPage />} />
              <Route path="/patient/pay" element={<PaymentPage />} />
              <Route path="/patient/records" element={<MyMedicalRecordPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
            </Route>
            <Route element={<ProtectedRoute roles={['NURSE']} />}>
              <Route path="/nurse" element={<NurseDashboard />} />
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
