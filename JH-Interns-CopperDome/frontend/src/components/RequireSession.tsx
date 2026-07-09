import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../lib/session';

export default function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
