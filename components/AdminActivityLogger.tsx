import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { adminUsersAPI } from '../services/api';

export const AdminActivityLogger: React.FC = () => {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!location.pathname.startsWith('/admin') || location.pathname === '/admin/login') return;
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    adminUsersAPI.logActivity({ action: 'page_view', path: location.pathname }).catch(() => {});
  }, [location.pathname]);

  return null;
};
