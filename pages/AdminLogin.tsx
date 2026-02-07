import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, LogIn, ArrowRight } from 'lucide-react';
import { loginWithEmail } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { isAdminPanelRole, normalizeRole } from '../utils/rbac';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useGlobal();

  // Redirect only if already logged in AS ADMIN VIA ADMIN LOGIN (has admin_session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && sessionStorage.getItem('truvamate_admin_session') === '1') {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (isAdminPanelRole(userData.role)) {
              const r = normalizeRole(userData.role);
              const defaultRedirect = r === 'admin' ? '/admin/lotto-orders' : r === 'accounting' ? '/admin/payments' : '/admin/dashboard';
              let redirectTo = searchParams.get('redirect') || defaultRedirect;
              const adminAllowed = ['/admin/lotto-orders', '/admin/ocr-scanner', '/admin/users'];
              const accountingAllowed = ['/admin/payments', '/admin/billing'];
              if (r === 'admin' && !adminAllowed.includes(redirectTo)) redirectTo = '/admin/lotto-orders';
              if (r === 'accounting' && !accountingAllowed.includes(redirectTo)) redirectTo = '/admin/payments';
              navigate(redirectTo, { replace: true });
              return;
            }
          }
        } catch {
          // Admin status check failed
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate, searchParams]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-800 font-medium">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Trim and clean username to remove any spaces
      const cleanUsername = username.trim().replace(/\s+/g, '');
      
      if (!cleanUsername) {
        setError('กรุณากรอก Username');
        setLoading(false);
        return;
      }
      
      // Support both:
      // - username (will become username@truvamate.com)
      // - real email (contains @)
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@truvamate.com`;
      
      // Login with Firebase
      const result = await loginWithEmail(email, password);
      
      if (result.success && result.user?.id) {
        // Check if user has admin role
        const userDoc = await getDoc(doc(db, 'users', result.user.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user can access admin panel (Super Admin / Admin / Accounting)
          if (isAdminPanelRole(userData.role)) {
            // Set user in GlobalContext with role
            const userWithRole = {
              ...result.user,
              // Keep raw stored role value (normalize only when checking permissions)
              role: userData.role,
              name: userData.name || result.user.name || 'Admin User',
              email: userData.email || result.user.email || '',
              avatar: userData.avatar || result.user.avatar,
              createdAt: userData.createdAt || new Date().toISOString(),
              memberSince: userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : new Date().getFullYear().toString()
            };
            
            login(userWithRole);
            // Mark admin session - required for ProtectedRoute to allow admin access
            sessionStorage.setItem('truvamate_admin_session', '1');
            
            // Redirect - admin: Order, OCR, ลูกค้า | accounting: การเงิน, ออกบิล
            const r = normalizeRole(userData.role);
            const defaultRedirect = r === 'admin' ? '/admin/lotto-orders' : r === 'accounting' ? '/admin/payments' : '/admin/dashboard';
            let redirectTo = searchParams.get('redirect') || defaultRedirect;
            const adminAllowed = ['/admin/lotto-orders', '/admin/ocr-scanner', '/admin/users'];
            const accountingAllowed = ['/admin/payments', '/admin/billing'];
            if (r === 'admin' && !adminAllowed.includes(redirectTo)) redirectTo = '/admin/lotto-orders';
            if (r === 'accounting' && !accountingAllowed.includes(redirectTo)) redirectTo = '/admin/payments';
            navigate(redirectTo);
          } else {
            setError('คุณไม่มีสิทธิ์เข้าถึงระบบ Admin');
            setLoading(false);
          }
        } else {
          setError('ไม่พบข้อมูลผู้ใช้ในระบบ');
          setLoading(false);
        }
      } else {
        // Check for specific error codes
        if (result.error?.includes('ไม่พบผู้ใช้นี้ในระบบ') || result.error?.includes('invalid-credential')) {
          const cleanUsername = username.trim().replace(/\s+/g, '');
          setError(`ไม่พบผู้ใช้ "${cleanUsername}" ในระบบ\n\nกรุณาตรวจสอบ:\n1. Username และ Password ถูกต้องหรือไม่\n2. ผู้ใช้ถูกสร้างใน Firebase Authentication แล้วหรือยัง\n\nUsername ที่พยายามใช้: ${cleanUsername}\nEmail format: ${cleanUsername}@truvamate.com`);
        } else {
          setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential') || err.code === 'auth/invalid-email') {
        const cleanUsername = username.trim().replace(/\s+/g, '');
        setError(`ไม่พบผู้ใช้ "${cleanUsername}" ในระบบ หรือรหัสผ่านไม่ถูกต้อง\n\nEmail ที่ใช้: ${cleanUsername}@truvamate.com\n\nกรุณาตรวจสอบ:\n1. Username และ Password ถูกต้องหรือไม่\n2. สร้างผู้ใช้ใน Firebase Authentication ก่อน\n3. ตรวจสอบว่าไม่มีช่องว่างใน Username`);
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="w-full text-center mb-8">
          <div className="w-full flex justify-center mb-4">
            <img 
              src="/truvamate-logo.png" 
              alt="Truvamate" 
              className="h-12 w-auto block mx-auto"
            />
          </div>
          <p className="text-sm text-slate-800 font-medium">Admin Panel</p>
          <p className="text-slate-800 font-medium mt-1">ระบบจัดการและตรวจสอบระบบ</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <div className="text-red-500 mt-0.5">
                  <Lock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">เข้าสู่ระบบไม่สำเร็จ</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  onBlur={(e) => setUsername(e.target.value.trim())}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-slate-900 font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-slate-900 font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-yellow-400 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={20} />
                  เข้าสู่ระบบ Admin
                  <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500">
              สำหรับผู้ดูแลระบบเท่านั้น
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

