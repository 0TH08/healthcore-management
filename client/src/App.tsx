import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/public/LoginPage';
import PatientDashboard from './pages/patient/PatientDashboard';
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
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<ProtectedRoute roles={['PATIENT']} />}>
              <Route path="/patient" element={<PatientDashboard />} />
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
