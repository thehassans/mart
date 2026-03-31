import { Navigate, useLocation } from 'react-router-dom';
import { getPanelPathForRole, useAdminSession } from '../../utils/adminSession.js';

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const { session } = useAdminSession();

  if (!session?.user) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin" />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate replace to={getPanelPathForRole(session.user.role)} />;
  }

  return children;
}
