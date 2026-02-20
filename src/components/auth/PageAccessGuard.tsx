import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { PagePermissionKey } from '../../types';

interface PageAccessGuardProps {
  children: React.ReactNode;
  pageKey?: PagePermissionKey;
  requireAdmin?: boolean;
}

const PageAccessGuard: React.FC<PageAccessGuardProps> = ({
  children,
  pageKey,
  requireAdmin = false,
}) => {
  const { user, isLoading, canAccessPage } = useAuth();
  const location = useLocation();
  const denialNotifiedRef = useRef(false);

  const isLoggedIn = Boolean(user);
  const isAdmin = Boolean(user?.permissions?.is_clinic_admin);
  const canAccess = pageKey ? canAccessPage(pageKey) : true;
  const isDenied = !isLoading && isLoggedIn && (requireAdmin ? !isAdmin : !canAccess);

  useEffect(() => {
    if (!isDenied || denialNotifiedRef.current) {
      return;
    }

    denialNotifiedRef.current = true;
    toast.error('Access denied');
  }, [isDenied]);

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (pageKey && !canAccess) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default PageAccessGuard;
