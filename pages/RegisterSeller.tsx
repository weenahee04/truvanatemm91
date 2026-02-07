import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Lock, Mail, User, Phone, ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { registerSellerWithEmail } from '../services/authService';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';

export const RegisterSeller: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const navigate = useNavigate();
  const { login, showToast } = useGlobal();
  const { t } = useTranslation('seller');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!displayName.trim()) {
      setError(t('register.nameRequired'));
      return;
    }

    if (!shopName.trim()) {
      setError(t('register.shopNameRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    // Show terms modal
    setShowTermsModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!acceptedTerms) {
      setError(t('register.acceptTermsRequired'));
      return;
    }

    setShowTermsModal(false);
    setLoading(true);
    setError('');

    try {
      const result = await registerSellerWithEmail(
        email.trim(),
        password,
        displayName.trim(),
        shopName.trim(),
        phone.trim() || undefined
      );

      if (result.success && result.user) {
        // Log in the user automatically
        login(result.user.email || email);
        showToast(t('register.registerSuccess'), 'success');
        navigate('/seller');
      } else {
        setError(result.error || t('register.registerFailed'));
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Seller registration error:', err);
      setError(err.message || t('register.registerError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-gold to-amber-500 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 bg-slate-900 rounded-xl mb-4 shadow-lg">
            <Store size={28} className="text-brand-gold" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">{t('register.title')}</h1>
          <p className="text-slate-800 font-medium">{t('register.subtitle')}</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <div className="text-red-500 mt-0.5">
                  <Lock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">{t('register.errorOccurred')}</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Display Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.fullName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder={t('register.fullNamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Shop Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.shopName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store size={20} />
                </div>
                <input
                  type="text"
                  placeholder={t('register.shopNamePlaceholder')}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.email')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  placeholder={t('register.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.phone')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={20} />
                </div>
                <input
                  type="tel"
                  placeholder={t('register.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.password')} <span className="text-red-500">*</span>
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
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <p className="text-xs text-slate-500">{t('register.passwordHint')}</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {t('register.confirmPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-slate-900"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-bold bg-brand-navy hover:bg-slate-800 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('register.registering')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Store size={20} />
                  {t('register.registerBtn')}
                  <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <p className="text-xs text-center text-slate-500">
              {t('register.hasAccount')} <button onClick={() => navigate('/seller/login')} className="text-brand-navy hover:underline font-semibold">{t('register.loginHere')}</button>
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full text-sm text-slate-600 hover:text-brand-navy text-center"
            >
              {t('register.wantCustomer')}
            </button>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-gold" size={24} />
              <h2 className="text-xl font-black text-slate-900">{t('register.termsTitle')}</h2>
            </div>
            
            <div className="space-y-4 text-sm text-slate-700 mb-6">
              <p className="font-semibold">{t('register.termsForSeller')}</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>{t('register.term1')}</li>
                <li>{t('register.term2')}</li>
                <li>{t('register.term3')}</li>
                <li>{t('register.term4')}</li>
                <li>{t('register.term5')}</li>
              </ul>
              <p className="mt-4">
                {t('register.termsAgreeNote')}
              </p>
            </div>

            <div className="flex items-start gap-3 mb-6">
              <button
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  acceptedTerms
                    ? 'bg-brand-gold border-brand-gold'
                    : 'border-slate-300'
                }`}
              >
                {acceptedTerms && <CheckCircle2 size={16} className="text-white" />}
              </button>
              <label 
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className="text-sm text-slate-700 cursor-pointer"
              >
                {t('register.acceptAllTerms')}
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTermsModal(false);
                  setAcceptedTerms(false);
                }}
                className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                {t('register.cancel')}
              </button>
              <button
                onClick={handleConfirmRegistration}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                  acceptedTerms
                    ? 'bg-brand-navy hover:bg-slate-800'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
                disabled={!acceptedTerms || loading}
              >
                {loading ? t('register.confirmingRegistration') : t('register.confirmRegistration')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};








