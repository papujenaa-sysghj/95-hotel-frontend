import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from '../store/auth';
import { EmptyState } from '../components/common/ui';

export default function ProtectedRoute({ perm }) {
  const user = useAuth((s) => s.user); const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  const p = user.permissions || [];
  if (perm && !p.includes('*') && !(Array.isArray(perm) ? perm : [perm]).some((k) => p.includes(k)))
    return <EmptyState title="You don't have access to this page" message="Ask an administrator to grant the required permission." action={<a className="btn-primary" href={homeFor(user)}>Go to my dashboard</a>} />;
  return <Outlet />;
}
