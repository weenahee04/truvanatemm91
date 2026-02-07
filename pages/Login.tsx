
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Facebook, Mail, Lock, User, ArrowRight, X, FileText, CheckCircle2, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginWithFacebook,
  resetPassword,
  recordPrivacyConsent,
  logout as firebaseLogout,
} from '../services/authService';
import { validateReferralCode, registerReferral, createReferralCode } from '../services/referralService';
import { getLoginLockoutStatus, recordLoginFailure, resetLoginLockout, isStaffEmail } from '../utils/loginLockout';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValidated, setReferralValidated] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsPurpose, setTermsPurpose] = useState<'register' | 'social' | null>(null);
  const [pendingSocialUser, setPendingSocialUser] = useState<any | null>(null);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<'google' | 'facebook' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, showToast } = useGlobal();
  const { t } = useTranslation('auth');
  const [lockInfo, setLockInfo] = useState<ReturnType<typeof getLoginLockoutStatus> | null>(null);

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsLogin(false); // Switch to register mode
      validateReferral(refCode);
    }
  }, [searchParams]);

  // Update lock status when email changes (customer login: 10 failed -> lock 24h)
  useEffect(() => {
    if (isLogin && email.trim() && !isStaffEmail(email)) {
      setLockInfo(getLoginLockoutStatus(email));
    } else {
      setLockInfo(null);
    }
  }, [isLogin, email]);

  const validateReferral = async (code: string) => {
    if (!code) {
      setReferralValidated(false);
      return;
    }
    
    try {
      const isValid = await validateReferralCode(code);
      setReferralValidated(isValid);
      if (isValid) {
        showToast(t('register.referralValid'), 'success');
      } else {
        showToast(t('register.referralInvalid'), 'error');
      }
    } catch (error) {
      setReferralValidated(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Login Flow
      // Customer lockout: 10 failed attempts -> lock 24h (skip staff emails)
      const status = isStaffEmail(email) ? null : getLoginLockoutStatus(email);
      if (status?.locked) {
        setLockInfo(status);
        const until = status.lockedUntil ? new Date(status.lockedUntil).toLocaleString() : '';
        showToast(t('login.accountLockedTemp', { until }), 'error');
        return;
      } else {
        setLockInfo(status);
      }

      setLoading(true);
      const result = await loginWithEmail(email, password);
      setLoading(false);
      
      if (result.success && result.user) {
        // Reset lockout on success
        if (!isStaffEmail(email)) resetLoginLockout(email);
        setLockInfo(null);

        // Use full user object (not just email)
        login(result.user);
        showToast(t('login.loginSuccess'), 'success');
        navigate('/profile');
      } else {
        // Only count as "failed attempt" for invalid-credential/user-not-found/wrong-password
        const code = result.errorCode;
        const shouldCount =
          !isStaffEmail(email) &&
          (code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found' ||
            code === 'auth/wrong-password');

        if (shouldCount) {
          const nextStatus = recordLoginFailure(email);
          setLockInfo(nextStatus);

          if (nextStatus.locked) {
            const until = nextStatus.lockedUntil ? new Date(nextStatus.lockedUntil).toLocaleString() : '';
            showToast(t('login.accountLockedExceeded', { count: nextStatus.failedCount, until }), 'error');
          } else {
            showToast(
              t('login.invalidCredentials', { remaining: nextStatus.remainingAttempts }),
              'error'
            );
            return;
          }
        }
        showToast(result.error || t('errors.loginFailed'), 'error');
      }
    } else {
      // Register Flow - Show Modal First
      if (!displayName.trim()) {
        showToast(t('register.enterFullName'), 'error');
        return;
      }
      setAcceptedTerms(false);
      setTermsPurpose('register');
      setShowTermsModal(true);
    }
  };

  const handleCancelTermsModal = async () => {
    // For first social login, enforce consent by signing out if user cancels
    if (termsPurpose === 'social') {
      try {
        await firebaseLogout();
      } catch (e) {
        // ignore
      }
      setPendingSocialUser(null);
      setPendingSocialProvider(null);
      setTermsPurpose(null);
      setAcceptedTerms(false);
      setShowTermsModal(false);
      showToast(t('termsModal.consentRequired'), 'error');
      return;
    }

    setTermsPurpose(null);
    setAcceptedTerms(false);
    setShowTermsModal(false);
  };

  const handleConfirmTermsModal = async () => {
    if (!acceptedTerms) return;

    // Social first login consent flow
    if (termsPurpose === 'social') {
      const userId = pendingSocialUser?.id || pendingSocialUser?.uid;
      if (!userId) {
        await handleCancelTermsModal();
        return;
      }

      setShowTermsModal(false);
      setLoading(true);
      const via = pendingSocialProvider || 'email';
      const consentResult = await recordPrivacyConsent(userId, via);
      setLoading(false);

      if (!consentResult.success) {
        showToast(consentResult.error || t('termsModal.consentFailed'), 'error');
        // Safety: keep user signed out if consent couldn't be saved
        await handleCancelTermsModal();
        return;
      }

      const userWithConsent = {
        ...(pendingSocialUser || {}),
        id: userId,
        privacyConsent: {
          accepted: true,
          acceptedAt: new Date().toISOString(),
          version: (pendingSocialUser as any)?.privacyConsent?.version || 'v1',
          text: t('termsModal.consentText'),
          via,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      };

      setPendingSocialUser(null);
      setPendingSocialProvider(null);
      setTermsPurpose(null);
      setAcceptedTerms(false);

      login(userWithConsent);
      showToast(t('termsModal.consentSaved'), 'success');
      navigate('/profile');
      return;
    }

    // Register flow (existing)
    setTermsPurpose(null);
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setLoading(true);
    const result = await registerWithEmail(email, password, displayName, {
      privacyConsentAccepted: true,
      privacyConsentText: t('termsModal.consentText'),
    });
    setLoading(false);
    
    if (result.success && result.user) {
      // Create referral code for new user
      try {
        await createReferralCode(result.user.uid);
      } catch {
        // Referral code creation failed for new user
      }

      // Register referral if code was used
      if (referralCode && referralValidated) {
        try {
          const userId = result.user.uid || result.user.id || '';
          if (!userId) {
            showToast(t('register.referralNoUserId'), 'warning');
          } else {
            await registerReferral(
              referralCode.trim(), 
              userId,
              result.user.email || email,
              displayName || result.user.name || 'User'
            );
            showToast(t('register.referralSaved'), 'success');
          }
        } catch (error: any) {
          // Show user-friendly error message
          const errorMessage = error.message || t('register.referralInvalid');
          showToast(errorMessage, 'error');
        }
      }

      // Pass the full user object instead of just email
      login(result.user);
      showToast(t('register.registerSuccess'), 'success');
      navigate('/profile');
    } else {
      showToast(result.error || t('errors.registerFailed'), 'error');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    
    if (result.success && result.user) {
      const hasConsent = (result.user as any)?.privacyConsent?.accepted === true;
      if (!hasConsent) {
        setAcceptedTerms(false);
        setTermsPurpose('social');
        setPendingSocialUser(result.user);
        setPendingSocialProvider('google');
        setShowTermsModal(true);
        return;
      }

      login(result.user);
      showToast(t('login.loginGoogleSuccess'), 'success');
      navigate('/profile');
    } else {
      showToast(result.error || t('errors.loginFailed'), 'error');
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    const result = await loginWithFacebook();
    setLoading(false);
    
    if (result.success && result.user) {
      const hasConsent = (result.user as any)?.privacyConsent?.accepted === true;
      if (!hasConsent) {
        setAcceptedTerms(false);
        setTermsPurpose('social');
        setPendingSocialUser(result.user);
        setPendingSocialProvider('facebook');
        setShowTermsModal(true);
        return;
      }

      login(result.user);
      showToast(t('login.loginFacebookSuccess'), 'success');
      navigate('/profile');
    } else {
      showToast(result.error || t('errors.loginFailed'), 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showToast(t('resetPassword.enterEmail'), 'error');
      return;
    }
    
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    
    if (result.success) {
      showToast(t('resetPassword.success'), 'success');
      setShowResetPassword(false);
    } else {
      showToast(result.error || t('resetPassword.failed'), 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-50 py-12 px-4 relative">
      
      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-brand-navy p-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Lock className="text-brand-gold" size={20} /> {t('resetPassword.title')}
              </h3>
              <button onClick={() => setShowResetPassword(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                {t('resetPassword.description')}
              </p>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  placeholder={t('login.email')} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowResetPassword(false)}>
                  {t('resetPassword.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleResetPassword} disabled={loading}>
                  {loading ? t('resetPassword.sending') : t('resetPassword.sendLink')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lockout Notice (Customer login only) */}
      {isLogin && lockInfo?.locked && (
        <div className="fixed bottom-4 left-4 right-4 z-[800] max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <Lock className="text-red-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-bold text-red-800">{t('login.accountLockedTitle')}</p>
                <p className="text-sm text-red-700 mt-1">
                  {t('login.accountLockedRetry', { until: lockInfo.lockedUntil ? new Date(lockInfo.lockedUntil).toLocaleString() : '-' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-brand-navy p-4 flex justify-between items-center shrink-0">
              <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                <FileText className="text-brand-gold" size={20} /> {t('termsModal.title')}
              </h3>
              <button onClick={handleCancelTermsModal} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white text-slate-600 text-sm leading-relaxed space-y-6">
              {/* Company Info */}
              <div className="bg-brand-gold/10 p-4 rounded-lg border-l-4 border-brand-gold">
                <p className="text-slate-900 font-bold mb-2">
                  <strong>{t('termsModal.companyName')}</strong>
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  {t('termsModal.companyDesc')}
                </p>
                <p className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsModal.companyNote') }} />
              </div>

              {/* Sections 1-6 */}
              {([1,2,3,4,5] as const).map(n => (
                <section key={n} className="border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-3 text-base">{t(`termsModal.s${n}Title`)}</h4>
                  <ul className="space-y-2 text-slate-600 text-sm list-none pl-0">
                    {(t(`termsModal.s${n}Items`, { returnObjects: true }) as string[]).map((item, i) => {
                      const [label, text] = item.includes('|') ? item.split('|', 2) : ['•', item];
                      return (
                        <li key={i} className={`flex items-start gap-2 ${label === '•' ? 'ml-6' : ''}`}>
                          <span className="text-slate-400 mt-0.5 shrink-0">{label}</span>
                          <span>{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <section className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900 mb-3 text-base">{t('termsModal.s6Title')}</h4>
                <p className="text-slate-600 text-sm">{t('termsModal.s6Text')}</p>
              </section>

              {/* Privacy Policy / PDPA */}
              <section className="border-t-2 border-slate-300 pt-6 mt-6">
                <h3 className="font-bold text-slate-900 mb-3 text-lg">{t('termsModal.pdpaTitle')}</h3>
                <p className="text-slate-600 text-sm mb-4">{t('termsModal.pdpaSubtitle')}</p>

                {/* Sections 7-10 with intro + items + optional note */}
                {([7,8,9,10] as const).map(n => (
                  <div key={n} className={`mb-4 ${n > 7 ? 'border-t border-slate-200 pt-4' : ''}`}>
                    <h4 className="font-bold text-slate-900 mb-2 text-base">{t(`termsModal.s${n}Title`)}</h4>
                    <p className="text-slate-600 text-sm mb-2">{t(`termsModal.s${n}Intro`)}</p>
                    <ul className="space-y-1 text-slate-600 text-sm list-none pl-0 mb-2">
                      {(t(`termsModal.s${n}Items`, { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {t(`termsModal.s${n}Note`, { defaultValue: '' }) && (
                      <p className="text-slate-600 text-sm">{t(`termsModal.s${n}Note`)}</p>
                    )}
                  </div>
                ))}

                {/* Section 11 */}
                <div className="mb-4 border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-2 text-base">{t('termsModal.s11Title')}</h4>
                  <p className="text-slate-600 text-sm">{t('termsModal.s11Text')}</p>
                </div>

                {/* Section 12 */}
                <div className="mb-4 border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-2 text-base">{t('termsModal.s12Title')}</h4>
                  <p className="text-slate-600 text-sm mb-2">{t('termsModal.s12Intro')}</p>
                  <ul className="space-y-1 text-slate-600 text-sm list-none pl-0">
                    {(t('termsModal.s12Items', { returnObjects: true }) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 13 */}
                <div className="mb-4 border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-2 text-base">{t('termsModal.s13Title')}</h4>
                  <p className="text-slate-600 text-sm mb-2">{t('termsModal.s13Intro')}</p>
                  <ul className="space-y-1 text-slate-600 text-sm list-none pl-0">
                    {(t('termsModal.s13Items', { returnObjects: true }) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group p-3 bg-white rounded-lg border-2 border-slate-200 hover:border-brand-gold transition-colors">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ${acceptedTerms ? 'bg-brand-gold border-brand-gold text-slate-900' : 'border-slate-300 bg-white group-hover:border-brand-gold'}`}>
                  {acceptedTerms && <CheckCircle2 size={14} />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700 select-none flex-1 leading-relaxed">
                  {t('termsModal.consentText')}
                  <span className="block mt-2 text-xs text-slate-500">
                    {' '}
                    <Link to="/legal" target="_blank" className="underline font-bold text-slate-700 hover:text-brand-gold">
                      Privacy Policy
                    </Link>
                  </span>
                </span>
              </label>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={handleCancelTermsModal}>{t('resetPassword.cancel')}</Button>
                <Button 
                  className="flex-1 shadow-lg" 
                  disabled={!acceptedTerms}
                  onClick={handleConfirmTermsModal}
                >
                  {t('termsModal.confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              {isLogin ? t('hero.welcome') : t('register.title')}
            </h1>
            <p className="text-slate-500">
              {isLogin ? t('hero.subtitle') : t('hero.subtitle')}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder={t('register.fullName')} 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder={t('login.email')} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                required
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder={t('login.password')} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Gift size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder={t('register.referralCode')} 
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value);
                    if (e.target.value.length >= 12) {
                      validateReferral(e.target.value);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                    referralCode && referralValidated 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : referralCode && !referralValidated
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-brand-gold focus:ring-brand-gold'
                  }`}
                />
                {referralCode && referralValidated && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowResetPassword(true)} 
                  className="text-sm text-brand-blue hover:underline"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {isLogin && lockInfo && !lockInfo.locked && lockInfo.failedCount > 0 && (
              <p className="text-amber-600 text-sm mt-1">
                {t('login.invalidCredentials', { remaining: lockInfo.remainingAttempts })}
              </p>
            )}

            <Button className="w-full py-3 text-lg mt-2" type="submit" disabled={loading || (isLogin && !!lockInfo?.locked)}>
              {loading ? (isLogin ? t('login.loggingIn') : t('register.registering')) : (isLogin ? t('login.loginButton') : t('register.registerButton'))} <ArrowRight size={20} className="ml-2" />
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">{t('login.orLoginWith')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 disabled:opacity-50"
            >
              <Facebook size={20} className="text-blue-600" /> Facebook
            </button>
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700 disabled:opacity-50"
            >
              <span className="font-bold text-red-500">G</span> Google
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center text-sm text-slate-600 border-t border-slate-100">
          {isLogin ? t('login.noAccount') : t('register.hasAccount')}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setShowTermsModal(false);
              setAcceptedTerms(false);
            }} 
            className="text-brand-navy font-bold ml-1 hover:underline"
          >
            {isLogin ? t('login.register') : t('login.loginButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
