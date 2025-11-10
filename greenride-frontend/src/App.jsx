import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import PassengerHome from './pages/Passenger/PassengerHome';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DriverHome from './pages/Driver/DriverHome';

function ProtectedRoute({ element: Element, requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && !user?.roles?.includes(requiredRole)) return <Navigate to="/home" replace />;
  return <Element />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/home" element={<ProtectedRoute element={PassengerHome} />} />
          <Route path="/driver/home" element={<ProtectedRoute element={DriverHome} requiredRole="ROLE_DRIVER" />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute element={AdminDashboard} requiredRole="ROLE_ADMIN" />} />

          {/* Root */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
