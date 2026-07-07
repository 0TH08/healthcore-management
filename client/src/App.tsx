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
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import PatientSearchPage from './pages/doctor/PatientSearchPage';
import PatientMedicalRecordPage from './pages/doctor/PatientMedicalRecordPage';
import PrescriptionPage from './pages/doctor/PrescriptionPage';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';
import NurseDashboardPage from './pages/nurse/NurseDashboardPage';
import TriageQueuePage from './pages/nurse/TriageQueuePage';
import BedDashboardPage from './pages/nurse/BedDashboardPage';
import DeviceStatusPage from './pages/nurse/DeviceStatusPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import InfrastructureManagementPage from './pages/admin/InfrastructureManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

// Redirects the root path to the user's role-based dashboard.
function RootRedirect() {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}

// Route structure: public pages outside the MainLayout, then a protected wrapper
// with role-gated sub-routes for PATIENT, DOCTOR, NURSE, and ADMIN.
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
              <Route path="/doctor" element={<DoctorDashboardPage />} />
              <Route path="/doctor/patients" element={<PatientSearchPage />} />
              <Route path="/doctor/patients/:patientId" element={<PatientMedicalRecordPage />} />
              <Route path="/doctor/patients/:patientId/records/:recordId/prescription" element={<PrescriptionPage />} />
              <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['NURSE']} />}>
              <Route path="/nurse" element={<NurseDashboardPage />} />
              <Route path="/nurse/triage" element={<TriageQueuePage />} />
              <Route path="/nurse/beds" element={<BedDashboardPage />} />
              <Route path="/nurse/devices" element={<DeviceStatusPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/staff" element={<StaffManagementPage />} />
              <Route path="/admin/infrastructure" element={<InfrastructureManagementPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
