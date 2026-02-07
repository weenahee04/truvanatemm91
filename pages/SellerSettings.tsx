import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Save, Lock, Phone, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout, updateSellerProfile, changePassword } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const SellerSettings: React.FC = () => {
  const { user, logout, showToast, login } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Profile fields
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user || !user.id) {
      showToast(t('dashboard.pleaseLogin'), 'error');
      navigate('/seller/login');
      return;
    }

    // Check if user is seller
    if (user.role !== 'seller' && user.role !== 'SELLER') {
      showToast(t('dashboard.noAccess'), 'error');
      navigate('/seller/login');
      return;
    }

    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setShopName(userData.shopName || userData.name || '');
        setPhone(userData.phone || userData.phoneNumber || '');
        setEmail(userData.email || user.email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast(t('settings.loadUserError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopName.trim()) {
      showToast(t('settings.shopNameRequired'), 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await updateSellerProfile(shopName.trim(), phone.trim() || undefined);
      
      if (result.success) {
        showToast(t('settings.profileUpdated'), 'success');
        
        // Update user in GlobalContext
        const updatedUser = {
          ...user,
          shopName: shopName.trim(),
          phone: phone.trim() || user.phone
        };
        login(updatedUser);
        
        // Reload user data
        await loadUserData();
      } else {
        showToast(result.error || t('settings.profileUpdateError'), 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast(t('settings.profileUpdateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t('settings.fillAllFields'), 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(t('settings.passwordMinLength'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('settings.passwordMismatch'), 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast(t('settings.passwordSameAsOld'), 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        showToast(t('settings.passwordChanged'), 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(result.error || t('settings.passwordChangeError'), 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(t('settings.passwordChangeError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      logout();
      navigate('/seller/login');
      showToast(t('dashboard.logoutSuccess'), 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast(t('dashboard.logoutError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white hidden lg:flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tighter text-brand-gold uppercase">Truvamate</h2>
          <span className="text-xs uppercase tracking-widest text-slate-400">Seller Center</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link to="/seller" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/seller/products" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Package size={20} /> Products
          </Link>
          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <ShoppingBag size={20} /> Orders
          </Link>
          <Link to="/seller/customers" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Users size={20} /> Customers
          </Link>
          <Link to="/seller/settings" className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg">
            <Settings size={20} /> Shop Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
           <h1 className="font-bold text-slate-800 text-lg">Shop Settings</h1>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{user?.shopName || user?.name || 'Seller'}</div>
                <div className="text-xs text-slate-500">Verified Seller</div>
              </div>
              <div className="h-10 w-10 bg-brand-navy rounded-full flex items-center justify-center text-white font-bold">
                {(user?.shopName || user?.name || 'S')[0].toUpperCase()}
              </div>
           </div>
        </header>

        <div className="p-8">
          {/* Tabs */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-brand-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Store size={18} /> Shop Profile
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'password'
                    ? 'bg-brand-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Lock size={18} /> Change Password
              </button>
            </div>
          </div>

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 text-lg">Shop Profile</h2>
                <p className="text-sm text-slate-500 mt-1">{t('settings.profileDesc')}</p>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6">
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.shopNameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder={t('settings.shopNamePlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.phoneLabel')}
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('settings.phonePlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t('settings.emailCannotChange')}</p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="gap-2"
                    >
                      <Save size={18} />
                      {saving ? t('settings.saving') : t('settings.saveChanges')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Password Settings */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 text-lg">Change Password</h2>
                <p className="text-sm text-slate-500 mt-1">{t('settings.passwordDesc')}</p>
              </div>
              <form onSubmit={handleChangePassword} className="p-6">
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.currentPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('settings.currentPasswordPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.newPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('settings.newPasswordPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('settings.confirmNewPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('settings.confirmNewPasswordPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="gap-2"
                    >
                      <Save size={18} />
                      {saving ? t('settings.changingPassword') : t('settings.changePassword')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};








