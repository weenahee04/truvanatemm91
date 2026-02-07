import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { normalizeRole } from '../utils/rbac';

type Role = 'user' | 'seller' | 'admin' | 'super_admin' | 'accounting';

interface ProtectedRouteProps {
  requiredRole?: Role | Role[];
  redirectTo?: string;
  children?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication and optionally specific roles.
 * 
 * @param requiredRole - Single role or array of roles that can access this route
 * @param redirectTo - Where to redirect if access is denied (default: '/login')
 * @param children - Child components to render if access is granted
 * 
 * Usage:
 * <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>} />
 * <Route path="/admin" element={<ProtectedRoute requiredRole={['admin']}><AdminPanel /></ProtectedRoute>} />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectTo = '/login',
  children,
}) => {
  const { showToast, updateUserRole } = useGlobal();
  const location = useLocation();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownRoleError, setHasShownRoleError] = useState(false);

  // All hooks must be at the top, before any conditional returns
  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = normalizeRole(userData?.role);
            setUserRole(role as Role);
            updateUserRole?.(role);
          } else {
            setUserRole('user');
          }
        } catch {
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check role requirements - use normalizeRole for consistency
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const normalizedAllowedRoles = allowedRoles.map(r => normalizeRole(r));
  const hasRequiredRole = userRole && normalizedAllowedRoles.includes(normalizeRole(userRole) as Role);

  // Show error toast when role check fails (only once) - must be after all state declarations
  useEffect(() => {
    if (!loading && requiredRole && !hasRequiredRole && !hasShownRoleError && userRole !== null) {
      const roleName = Array.isArray(requiredRole)
        ? requiredRole.join(' or ')
        : requiredRole;
      
      showToast(`คุณต้องมีสิทธิ์ ${roleName === 'seller' ? 'Seller' : roleName === 'admin' ? 'Admin' : 'User'} ในการเข้าถึงหน้านี้`, 'error');
      setHasShownRoleError(true);
    }
  }, [loading, hasRequiredRole, hasShownRoleError, userRole, requiredRole, showToast]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!firebaseUser) {
    // Determine the appropriate login page based on the current route
    let loginPath = redirectTo;
    if (location.pathname.startsWith('/admin')) {
      loginPath = '/admin/login';
    } else if (location.pathname.startsWith('/seller')) {
      loginPath = '/seller/login';
    }
    
    // Redirect to login with return URL
    return (
      <Navigate
        to={`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Admin routes: require explicit admin login (not just Firebase + admin role)
  if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
    const hasAdminSession = sessionStorage.getItem('truvamate_admin_session') === '1';
    if (!hasAdminSession) {
      return (
        <Navigate
          to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    }
  }

  // If no role requirement, just check authentication (already passed above)
  if (!requiredRole) {
    return <>{children || <Outlet />}</>;
  }

  // Check if user has required role

  if (!hasRequiredRole) {
    // Admin role: Order, OCR, ลูกค้า only
    if (userRole === 'admin' && location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/lotto-orders" replace />;
    }
    if (userRole === 'admin') return <Navigate to="/admin/lotto-orders" replace />;
    if (userRole === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }

  // User has required role, render children
  return <>{children || <Outlet />}</>;
};

