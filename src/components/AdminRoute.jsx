import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ADMIN_EMAILS = ['officialartio375@gmail.com', 'aravindhofficiallinks@gmail.com'];

const canAccessAdmin = (role, user) => {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  const email = String(user?.email ?? '').trim().toLowerCase();
  const roleAllowed =
    normalizedRole === 'admin' ||
    normalizedRole === 'super_admin' ||
    normalizedRole === 'superadmin';
  const emailAllowed = ADMIN_EMAILS.includes(email);
  return roleAllowed || emailAllowed;
};

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!canAccessAdmin(role, user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
