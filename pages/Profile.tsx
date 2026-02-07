
import React, { useState, useEffect } from 'react';
import { User, Package, Heart, MapPin, Bell, LogOut, ChevronRight, Ticket, Dna, X, Calendar, Clock, Receipt, Trash2, CreditCard, Plus, Wallet, Globe, Building, ShieldCheck, Landmark, ScanLine, Gift, Copy, CheckCircle2, Lock, Eye, EyeOff, Save, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate, Link } from 'react-router-dom';
import { ProductCard } from '../components/Marketplace/ProductCard';
import { getReferralCodeByUserId, getReferralStats, getUserReferrals, createReferralCode, type ReferralCode, type ReferralStats, type Referral } from '../services/referralService';
import { changePassword } from '../services/authService';
import { auth } from '../config/firebase';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [payoutType, setPayoutType] = useState<'bank_th' | 'bank_global' | 'paypal'>('bank_th');
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralList, setReferralList] = useState<Referral[]>([]);
  const [referralLoading, setReferralLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  
  // Payout Form States
  const [payoutForm, setPayoutForm] = useState({
    providerName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: ''
  });

  const { user, orders, wishlist, logout, savedCards, removeSavedCard, payoutAccounts, addPayoutAccount, removePayoutAccount, showToast } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('profile');

  useEffect(() => {
    loadReferralData();
    checkAuthProvider();
    
    // Sync email from Firebase Auth if user object is missing it
    if (user && !user.email && auth.currentUser?.email) {
      // Update user object - this will be handled by re-login or we can update directly
      const updatedUser = {
        ...user,
        email: auth.currentUser.email,
        name: (user.name === 'User' || !user.name) ? auth.currentUser.email : user.name
      };
      // Note: We can't directly update GlobalContext here, but the display functions will use Firebase Auth
    }
  }, [user]);

  const checkAuthProvider = () => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.providerData) {
      // Check if user has email/password provider
      const hasEmailPassword = currentUser.providerData.some(
        (provider) => provider.providerId === 'password'
      );
      setIsEmailPasswordUser(hasEmailPassword);
    }
  };

  // Get display name - for email/password users, show email
  const getDisplayName = () => {
    // For email/password users, prioritize email
    if (isEmailPasswordUser) {
      // Try multiple sources for email
      const email = user?.email || auth.currentUser?.email || '';
      if (email) {
        return email;
      }
    }
    // For other users, show name or email
    return user?.name || user?.email || auth.currentUser?.email || 'User';
  };

  const loadReferralData = async () => {
    // Try to get user ID from multiple sources
    let userId = user?.id;
    
    // If user.id is not available, try Firebase Auth
    if (!userId && auth.currentUser) {
      userId = auth.currentUser.uid;
    }

    if (!userId) {
      try {
        const savedUser = localStorage.getItem('truvamate_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          userId = parsedUser?.id || parsedUser?.uid;
        }
      } catch {
        // Ignore localStorage parse error
      }
    }

    if (!userId) {
      setReferralLoading(false);
      return;
    }
    
    setReferralLoading(true);
    let code: ReferralCode | null = null;
    let stats: ReferralStats = {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
    };
    let referrals: Referral[] = [];

    try {
      // Load referral code - don't use timeout, let it complete
      try {
        code = await getReferralCodeByUserId(userId);
      } catch {
        code = null;
      }

      // If no code but we have user ID, try to create one
      if (!code && userId) {
        try {
          const newCode = await createReferralCode(userId);
          if (newCode && newCode.code) {
            code = newCode;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
            try {
              code = await getReferralCodeByUserId(userId);
            } catch {
              // Ignore reload error
            }
          }
        } catch {
          showToast(t('referralCreateError'), 'error');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            code = await getReferralCodeByUserId(userId);
            if (code) {
              showToast(t('referralCreated'), 'success');
            }
          } catch {
            // Ignore reload error
          }
        }
      }

      // Load stats and referrals in parallel
      try {
        const [statsData, referralsData] = await Promise.all([
          getReferralStats(userId).catch(() => ({
              totalReferrals: 0,
              completedReferrals: 0,
              pendingReferrals: 0,
              totalEarnings: 0,
              pendingEarnings: 0,
              paidEarnings: 0,
            })),
          getUserReferrals(userId).catch(() => [])
        ]);
        stats = statsData;
        referrals = referralsData;
      } catch {
        // Stats/referrals load failed
      }

      // Update state with loaded data
      setReferralCode(code);
      setReferralStats(stats);
      setReferralList(referrals);
    } catch {
      // Set defaults on error
      setReferralCode(null);
      setReferralStats({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
      });
      setReferralList([]);
    } finally {
      setReferralLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    showToast(t('codeCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateReferralCode = async () => {
    // Try to get user ID from multiple sources
    let userId = user?.id;
    
    // If user.id is not available, try Firebase Auth
    if (!userId && auth.currentUser) {
      userId = auth.currentUser.uid;
    }

    if (!userId) {
      try {
        const savedUser = localStorage.getItem('truvamate_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          userId = parsedUser?.id || parsedUser?.uid;
        }
      } catch {
        // Ignore localStorage parse error
      }
    }

    if (!userId) {
      showToast(t('noUserFound'), 'error');
      navigate('/login');
      return;
    }

    try {
      setReferralLoading(true);
      showToast(t('creatingReferralCode'), 'info');

      const newCode = await createReferralCode(userId);

      if (newCode && newCode.code) {
        setReferralCode(newCode);
        showToast(t('referralCreatedSuccess'), 'success');
      } else {
        showToast(t('verifyingCode'), 'info');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const reloadedCode = await getReferralCodeByUserId(userId);
        if (reloadedCode) {
          setReferralCode(reloadedCode);
          showToast(t('referralCreatedSuccess'), 'success');
        } else {
          showToast(t('codeCreateFailed'), 'error');
        }
      }
    } catch {
      showToast(t('codeCreateError'), 'error');
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const reloadedCode = await getReferralCodeByUserId(userId);
        if (reloadedCode) {
          setReferralCode(reloadedCode);
          showToast(t('codeReady'), 'success');
        }
      } catch {
        // Ignore reload error
      }
    } finally {
      setReferralLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // Filter orders by userId to ensure only current user's orders are shown
  const userOrders = orders.filter(o => !o.userId || o.userId === user.id);
  const marketplaceOrders = userOrders.filter(o => o.type === 'marketplace');
  const lottoOrders = userOrders.filter(o => o.type === 'lotto');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t('fillAllFields'), 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(t('passwordMinLength'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('passwordMismatch'), 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast(t('passwordSameAsOld'), 'error');
      return;
    }

    try {
      setPasswordChanging(true);
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        showToast(t('passwordChanged'), 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(result.error || t('passwordChangeError'), 'error');
      }
    } catch (error) {
      // Password change failed
      showToast(t('passwordChangeError'), 'error');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleAddPayout = (e: React.FormEvent) => {
    e.preventDefault();
    addPayoutAccount({
      type: payoutType,
      providerName: payoutType === 'paypal' ? 'PayPal' : payoutForm.providerName,
      accountName: payoutForm.accountName,
      accountNumber: payoutForm.accountNumber,
      swiftCode: payoutForm.swiftCode,
      bankAddress: payoutForm.bankAddress
    });
    setShowAddPayout(false);
    // Reset form
    setPayoutForm({
      providerName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: '',
      bankAddress: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      
      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="bg-brand-gold p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="bg-black text-brand-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Official Ticket</span>
                   <span className="bg-white/30 text-slate-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{selectedTicket.id || 'N/A'}</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedTicket.type || 'Powerball'}</h2>
                <div className="text-slate-800 font-bold text-sm flex items-center gap-2 mt-1">
                   <Calendar size={14} /> Draw Date: Sat, Oct 28
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
              
              {/* Selected Numbers Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-wider">Your Selected Numbers</p>
                 <div className="flex flex-wrap justify-center gap-3 mb-2">
                    {selectedTicket.numbers.map((num: number) => (
                      <div key={num} className="h-12 w-12 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-black text-xl text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {num}
                      </div>
                    ))}
                    <div className="h-12 w-12 rounded-full bg-red-600 border-2 border-red-800 flex items-center justify-center font-black text-xl text-white shadow-[2px_2px_0px_0px_rgba(153,27,27,1)]">
                      {selectedTicket.special}
                    </div>
                 </div>
              </div>

              {/* Real Scanned Ticket Simulation */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <ScanLine size={18} className="text-brand-navy" /> Official Scanned Ticket (Copy)
                </h4>
                <div className="bg-slate-200/50 p-6 rounded-lg flex items-center justify-center min-h-[250px] border-2 border-dashed border-slate-300 relative overflow-hidden group">
                    {/* Simulation of a thermal paper ticket */}
                    <div className="bg-white p-6 shadow-xl w-full max-w-xs rotate-1 transform transition-transform group-hover:rotate-0 duration-500 border border-slate-100 relative font-mono text-slate-900">
                        
                        {/* Ticket Watermark/Texture */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>

                        {/* Ticket Header */}
                        <div className="text-center border-b-2 border-black pb-4 mb-4 border-dashed relative z-10">
                           <div className="font-black text-2xl uppercase tracking-tighter mb-1">{selectedTicket.type || 'Powerball'}</div>
                           <div className="text-[10px] tracking-widest uppercase">CALIFORNIA STATE LOTTERY</div>
                           <div className="text-[10px] mt-1">TERM: 4522-8812</div>
                        </div>

                        {/* Numbers Row */}
                        <div className="flex justify-between items-center font-bold text-xl mb-6 relative z-10 px-2">
                           <span className="text-sm font-normal">A.</span>
                           <div className="flex gap-3 tracking-widest">
                              {selectedTicket.numbers.map((n: number) => (
                                <span key={n}>{n.toString().padStart(2, '0')}</span>
                              ))}
                           </div>
                           <span className="font-black bg-slate-900 text-white px-1 rounded-sm">{selectedTicket.special.toString().padStart(2, '0')}</span>
                        </div>

                        {/* Price and QP */}
                        <div className="flex justify-between text-xs font-bold mb-4 px-2 relative z-10">
                           <span>CASH</span>
                           <span>$2.00</span>
                        </div>

                        {/* Ticket Footer */}
                        <div className="border-t-2 border-black border-dashed pt-4 text-center space-y-2 relative z-10">
                           <div className="text-xs font-bold">DRAW DATE: OCT 28, 2023</div>
                           <div className="h-12 bg-black w-full flex items-center justify-center overflow-hidden my-2">
                              {/* Fake Barcode CSS */}
                              <div className="w-[110%] h-full bg-white" style={{background: 'repeating-linear-gradient(90deg, #000 0, #000 1px, #fff 1px, #fff 3px)'}}></div>
                           </div>
                           <div className="text-[10px] tracking-widest">{selectedTicket.id || '9876543210-8821'}</div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3 text-[10px] text-slate-400">
                   Digital copy of the physical ticket purchased on your behalf.
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
               <Button className="w-full" onClick={() => setSelectedTicket(null)}>Close Details</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payout Account Modal */}
      {showAddPayout && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   <Landmark size={20} /> Add Payout Method
                </h3>
                <button onClick={() => setShowAddPayout(false)}><X size={20} className="text-slate-400 hover:text-slate-900" /></button>
             </div>
             
             <div className="p-6">
                <div className="grid grid-cols-3 gap-2 mb-6">
                   <button 
                     onClick={() => setPayoutType('bank_th')}
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${payoutType === 'bank_th' ? 'bg-brand-navy text-white border-brand-navy shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                   >
                     <Building size={20} className="mb-1" />
                     <span className="text-xs font-bold">Thai Bank</span>
                   </button>
                   <button 
                     onClick={() => setPayoutType('bank_global')}
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${payoutType === 'bank_global' ? 'bg-brand-navy text-white border-brand-navy shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                   >
                     <Globe size={20} className="mb-1" />
                     <span className="text-xs font-bold">Global Bank</span>
                   </button>
                   <button 
                     onClick={() => setPayoutType('paypal')}
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${payoutType === 'paypal' ? 'bg-brand-navy text-white border-brand-navy shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                   >
                     <Wallet size={20} className="mb-1" />
                     <span className="text-xs font-bold">PayPal</span>
                   </button>
                </div>

                <form onSubmit={handleAddPayout} className="space-y-4">
                   {payoutType !== 'paypal' && (
                     <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name / Provider</label>
                       {payoutType === 'bank_th' ? (
                         <select 
                           className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                           value={payoutForm.providerName}
                           onChange={(e) => setPayoutForm({...payoutForm, providerName: e.target.value})}
                           required
                         >
                            <option value="">Select Bank</option>
                            <option value="KBANK">Kasikorn Bank (KBANK)</option>
                            <option value="SCB">Siam Commercial Bank (SCB)</option>
                            <option value="BBL">Bangkok Bank (BBL)</option>
                            <option value="KTB">Krungthai Bank (KTB)</option>
                            <option value="TTB">TMBThanachart (ttb)</option>
                         </select>
                       ) : (
                         <input 
                            type="text" 
                            placeholder="e.g., Chase Bank, HSBC"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                            value={payoutForm.providerName}
                            onChange={(e) => setPayoutForm({...payoutForm, providerName: e.target.value})}
                            required
                         />
                       )}
                     </div>
                   )}

                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                      <input 
                         type="text" 
                         placeholder="Full Legal Name"
                         className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                         value={payoutForm.accountName}
                         onChange={(e) => setPayoutForm({...payoutForm, accountName: e.target.value})}
                         required
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {payoutType === 'paypal' ? 'PayPal Email Address' : 'Account Number / IBAN'}
                      </label>
                      <input 
                         type="text" 
                         placeholder={payoutType === 'paypal' ? 'email@example.com' : '0123456789'}
                         className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                         value={payoutForm.accountNumber}
                         onChange={(e) => setPayoutForm({...payoutForm, accountNumber: e.target.value})}
                         required
                      />
                   </div>

                   {payoutType === 'bank_global' && (
                     <>
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">SWIFT / BIC Code</label>
                           <input 
                              type="text" 
                              placeholder="e.g., CHASUS33"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                              value={payoutForm.swiftCode}
                              onChange={(e) => setPayoutForm({...payoutForm, swiftCode: e.target.value})}
                              required
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Bank Address</label>
                           <input 
                              type="text" 
                              placeholder="City, Country"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900"
                              value={payoutForm.bankAddress}
                              onChange={(e) => setPayoutForm({...payoutForm, bankAddress: e.target.value})}
                              required
                           />
                        </div>
                     </>
                   )}

                   <Button type="submit" className="w-full mt-2">Save Account</Button>
                </form>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded justify-center">
                   <ShieldCheck size={12} className="text-green-600" />
                   All data is encrypted with 256-bit SSL security.
                </div>
             </div>
           </div>
         </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 text-center">
            <div className="h-20 w-20 bg-gradient-to-br from-brand-navy to-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-white shadow-sm">
              <User size={32} className="text-white" />
            </div>
            <h3 className="font-bold text-slate-900">{getDisplayName()}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {isEmailPasswordUser ? 'Email/Password User' : `Member since ${user.memberSince}`}
            </p>
          </div>

          <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'orders' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <Package size={18} /> {t('myOrders')}
            </button>
            <button 
              onClick={() => setActiveTab('lotto')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'lotto' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <Ticket size={18} /> {t('mySpecialProducts')}
            </button>
             <button 
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'wallet' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <Wallet size={18} /> {t('payoutMethods')}
            </button>
            <button 
              onClick={() => setActiveTab('referral')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'referral' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <Gift size={18} /> {t('referFriend')} {referralStats && referralStats.totalEarnings > 0 && <span className="ml-auto bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full">฿{referralStats.totalEarnings}</span>}
            </button>
            <Link 
              to="/missions"
              className="w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 text-slate-600 hover:bg-amber-50 border-transparent transition-colors"
            >
              <Trophy size={18} className="text-amber-500" /> {t('missions', { ns: 'missions', defaultValue: 'กิจกรรมประจำวัน' })}
            </Link>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'wishlist' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <Heart size={18} /> {t('wishlistTab')} <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{wishlist.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('cards')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'cards' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
            >
              <CreditCard size={18} /> {t('paymentMethods')}
            </button>
            {isEmailPasswordUser && (
              <button 
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium border-l-4 transition-colors ${activeTab === 'password' ? 'bg-brand-navy/5 text-brand-navy border-brand-navy' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
              >
                <Lock size={18} /> {t('changePassword')}
              </button>
            )}
            <div className="border-t border-slate-100 my-1"></div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={18} /> {t('logout')}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            
            {activeTab === 'orders' && (
              <>
                <div className="p-6 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900">{t('myOrders')}</h1>
                </div>
                {/* ... (Existing Order Content) ... */}
                <div className="p-6 space-y-6">
                  {marketplaceOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">{t('noOrdersYet')}</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>{t('goShopping')}</Button>
                    </div>
                  ) : (
                    marketplaceOrders.map((order) => (
                      <div key={order.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 flex justify-between items-center text-sm">
                          <div className="font-bold text-slate-700">Order: #{order.id}</div>
                          <div className="text-brand-blue font-medium">{order.status}</div>
                        </div>
                        {order.items.map((item: any, idx: number) => (
                           <div key={idx} className="p-4 border-t border-slate-100 flex gap-4">
                            <div className="h-20 w-20 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0">
                              <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 line-clamp-1">{item.title}</h4>
                              <div className="text-xs text-slate-500 mt-1">{t('quantity')}: {item.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-brand-navy">฿{item.priceTHB.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'lotto' && (
              <>
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="text-brand-gold" /> {t('mySpecialProducts')}
                  </h3>
                  <Button size="sm" onClick={() => navigate('/special-products')}>{t('buyMore')}</Button>
                </div>
                <div className="p-6 space-y-4">
                   {lottoOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Dna size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">{t('noSpecialProducts')}</p>
                    </div>
                  ) : (
                    lottoOrders.map((order, orderIdx) => (
                      <div key={orderIdx} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-slate-700">Order #{order.id}</h3>
                          {order.status !== 'Pending' && (
                            <button
                              onClick={() => navigate(`/ticket-photos/${order.id}`)}
                              className="bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <span>📸</span>
                              <span>{t('viewTicketPhotos')}</span>
                            </button>
                          )}
                        </div>
                        {order.items.map((ticket: any, i: number) => (
                          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-brand-gold transition-colors">
                            <div className="bg-slate-900 text-brand-gold px-4 py-2 flex justify-between items-center">
                              <span className="font-black tracking-widest uppercase text-sm">{ticket.type || 'Powerball'}</span>
                              <span className="text-xs font-bold text-slate-900 bg-brand-gold px-2 py-0.5 rounded">{t('awaitingResult')}</span>
                            </div>
                            <div className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex flex-col items-center sm:items-start gap-1">
                                <div className="text-xs text-slate-500">{t('drawDate')}</div>
                                <div className="font-bold text-slate-900 text-sm">Sat, Oct 28</div>
                              </div>
                              <div className="flex gap-2">
                                {ticket.numbers.map((n: number) => (
                                  <div key={n} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900 shadow-sm text-sm sm:text-base">
                                    {n}
                                  </div>
                                ))}
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-600 text-white border-2 border-red-700 flex items-center justify-center font-bold shadow-md text-sm sm:text-base">
                                  {ticket.special}
                                </div>
                              </div>
                              <div className="text-right">
                                <Button size="sm" variant="outline" onClick={() => setSelectedTicket({...ticket, orderId: order.id})}>{t('viewProof')}</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'wallet' && (
              <>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Wallet size={24} className="text-brand-navy" /> My Wallet & Payout
                   </h1>
                </div>
                
                <div className="p-6 space-y-8">
                   {/* Balance Card */}
                   <div className="bg-brand-navy rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Ticket size={120} />
                      </div>
                      <div className="relative z-10">
                         <div className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Withdrawable Balance</div>
                         <div className="text-4xl md:text-5xl font-black text-brand-gold mb-6">฿0.00</div>
                         <div className="flex gap-4">
                            <Button variant="primary" className="shadow-lg border-2 border-brand-gold text-slate-900 font-bold">Withdraw</Button>
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">History</Button>
                         </div>
                      </div>
                   </div>

                   {/* Payout Methods List */}
                   <div>
                      <div className="flex justify-between items-end mb-4">
                         <h3 className="text-lg font-bold text-slate-900">Payout Methods</h3>
                         <Button size="sm" variant="outline" onClick={() => setShowAddPayout(true)} className="gap-2">
                           <Plus size={16} /> Add Method
                         </Button>
                      </div>

                      <div className="space-y-4">
                         {payoutAccounts.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                               <Landmark className="mx-auto text-slate-300 mb-2" size={32} />
                               <p className="text-slate-500 text-sm">No payout methods added yet.</p>
                            </div>
                         ) : (
                           payoutAccounts.map(account => (
                              <div key={account.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-gold transition-colors bg-white shadow-sm">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                       {account.type === 'bank_th' && <span className="font-bold text-slate-600 text-xs">{account.providerName}</span>}
                                       {account.type === 'bank_global' && <Globe size={24} className="text-slate-600" />}
                                       {account.type === 'paypal' && <Wallet size={24} className="text-blue-600" />}
                                    </div>
                                    <div>
                                       <div className="font-bold text-slate-900 flex items-center gap-2">
                                          {account.accountName}
                                          {account.type === 'bank_global' && <span className="bg-black text-brand-gold text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Global</span>}
                                       </div>
                                       <div className="text-sm text-slate-500">
                                          {account.providerName} • {account.type === 'paypal' ? account.accountNumber : `•••• ${account.accountNumber.slice(-4)}`}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {account.type === 'bank_global' && (
                                       <div className="text-right mr-4 hidden md:block">
                                          <div className="text-xs text-slate-400 font-bold uppercase">Swift Code</div>
                                          <div className="text-sm font-mono">{account.swiftCode}</div>
                                       </div>
                                    )}
                                    <button onClick={() => removePayoutAccount(account.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                       <Trash2 size={18} />
                                    </button>
                                 </div>
                              </div>
                           ))
                         )}
                      </div>
                   </div>

                   {/* Legal Note */}
                   <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed border border-slate-100">
                      <strong>Tax Information:</strong> For US สินค้าพิเศษ winnings over $600, Truvamate is required to withhold 30% tax for non-US residents. The remaining amount will be transferred to your designated account. Winnings are processed within 15-30 days for large amounts.
                   </div>
                </div>
              </>
            )}

            {activeTab === 'wishlist' && (
              <>
                 <div className="p-6 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="text-red-500" fill="currentColor" /> {t('wishlistTab')} ({wishlist.length})
                  </h1>
                </div>
                <div className="p-6">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">{t('noWishlist')}</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>{t('goShopping')}</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'cards' && (
              <>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard size={24} /> Saved Credit Cards
                  </h1>
                </div>
                <div className="p-6">
                  {savedCards.length === 0 ? (
                     <div className="text-center py-12">
                      <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">You haven't saved any credit cards yet.</p>
                      <p className="text-xs text-slate-400 mt-2">Add a card during checkout for faster payment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedCards.map(card => (
                        <div key={card.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                               {card.type === 'visa' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3" alt="Visa" />}
                               {card.type === 'mastercard' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-4" alt="Mastercard" />}
                               {card.type === 'jcb' && <span className="text-xs font-bold text-slate-500">JCB</span>}
                            </div>
                            <div>
                               <div className="font-bold text-slate-900">•••• •••• •••• {card.last4}</div>
                               <div className="text-xs text-slate-500">Expires {card.expiry} • {card.holderName}</div>
                            </div>
                          </div>
                          <button onClick={() => removeSavedCard(card.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'password' && isEmailPasswordUser && (
              <>
                <div className="p-6 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Lock size={24} className="text-brand-navy" />
                    {t('changePasswordTitle')}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">{t('changePasswordDesc')}</p>
                </div>
                <div className="p-6">
                  <form onSubmit={handleChangePassword} className="max-w-2xl space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('currentPassword')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('currentPasswordPlaceholder')}
                          className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('newPassword')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('newPasswordPlaceholder')}
                          className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{t('newPasswordHint')}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('confirmNewPassword')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('confirmNewPasswordPlaceholder')}
                          className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={passwordChanging}
                        className="gap-2"
                      >
                        <Save size={18} />
                        {passwordChanging ? t('changingPassword') : t('changePassword')}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'referral' && (
              <>
                <div className="p-6 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Gift className="text-brand-gold" size={24} /> {t('referralProgram')}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">{t('referralDesc')}</p>
                </div>
                <div className="p-6">
                  {referralLoading ? (
                    <div className="text-center py-12">
                      <Gift size={48} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                      <p className="text-slate-500">{t('loadingData')}</p>
                    </div>
                  ) : referralCode ? (
                    // Show referral code
                    <div className="space-y-6">
                      {/* Referral Code Card */}
                      <div className="bg-gradient-to-br from-brand-gold to-amber-500 rounded-2xl p-6 text-white">
                        <p className="text-sm opacity-90 mb-2">{t('yourReferralCode')}</p>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-3xl font-black tracking-wider">{referralCode.code}</p>
                          <button
                            onClick={copyReferralCode}
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                          >
                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            {copied ? t('copied') : t('copy')}
                          </button>
                        </div>
                        <p className="text-xs opacity-80">{t('shareCodeDesc')}</p>
                      </div>

                      {/* Stats Grid */}
                      {referralStats && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm font-semibold text-blue-600 mb-1">{t('referredFriends')}</p>
                            <p className="text-3xl font-black text-blue-700">{referralStats.completedReferrals}<span className="text-lg text-blue-500">/10</span></p>
                            <p className="text-xs text-blue-500 mt-1">{t('cashbackReceivers')}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <p className="text-sm font-semibold text-green-600 mb-1">{t('totalEarnings')}</p>
                            <p className="text-3xl font-black text-green-700">฿{referralStats.totalEarnings.toFixed(2)}</p>
                            <p className="text-xs text-green-500 mt-1">{t('totalCashback')}</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <p className="text-sm font-semibold text-purple-600 mb-1">{t('totalFriends')}</p>
                            <p className="text-3xl font-black text-purple-700">{referralStats.totalReferrals}</p>
                            <p className="text-xs text-purple-500 mt-1">{t('registered')}</p>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                            <p className="text-sm font-semibold text-orange-600 mb-1">{t('pendingPayout')}</p>
                            <p className="text-3xl font-black text-orange-700">฿{referralStats.pendingEarnings.toFixed(2)}</p>
                            <p className="text-xs text-orange-500 mt-1">{t('pendingWithdraw')}</p>
                          </div>
                        </div>
                      )}

                      {/* Referral List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">{t('referralList')}</h3>
                        {referralList.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">{t('noReferrals')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {referralList.map((referral) => {
                              const orderValue = referral.orderValue || 0;
                              const isCompleted = orderValue >= 1000;
                              const status = isCompleted ? t('statusCompleted') : t('statusPending');
                              const statusColor = isCompleted ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200';
                              
                              return (
                                <div key={referral.id} className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                          <User size={18} className="text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-slate-900 truncate">{referral.referredUserName || t('user')}</p>
                                          <p className="text-xs text-slate-500 truncate">{referral.referredUserEmail}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-1 pl-[52px]">
                                        <p className="text-sm text-slate-600">
                                          {t('spending')}: <span className="font-bold text-slate-900">฿{orderValue.toFixed(2)}</span>
                                        </p>
                                        {isCompleted && referral.commission > 0 && (
                                          <p className="text-sm text-slate-600">
                                            Cashback: <span className="font-bold text-green-600">฿{referral.commission.toFixed(2)}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 shrink-0 ${statusColor}`}>
                                      {isCompleted ? (
                                        <CheckCircle2 size={16} />
                                      ) : (
                                        <Clock size={16} />
                                      )}
                                      <span className="font-bold text-sm whitespace-nowrap">{status}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-2">{t('howToUse')}</p>
                        <ol className="space-y-1 text-xs text-amber-700 list-decimal list-inside">
                          <li>{t('howToStep1')}</li>
                          <li>{t('howToStep2')}</li>
                          <li>{t('howToStep3')}</li>
                          <li>{t('howToStep4')}</li>
                          <li>{t('howToStep5')}</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                        <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium mb-2">{t('noReferralCode')}</p>
                        <p className="text-sm text-slate-400 mb-4">{t('clickToCreate')}</p>
                        <div className="flex justify-center">
                          <Button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateReferralCode();
                            }}
                            disabled={referralLoading}
                            className="gap-2"
                            type="button"
                          >
                            <Gift size={18} />
                            {referralLoading ? t('creatingCode') : t('createReferralCode')}
                          </Button>
                        </div>
                        {!user?.id && !auth.currentUser && (
                          <p className="text-xs text-red-500 mt-2">⚠️ {t('noUserData')}</p>
                        )}
                      </div>
                      
                      {/* Stats Grid - Show with zeros if no code yet */}
                      {referralStats && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm font-semibold text-blue-600 mb-1">{t('referredFriends')}</p>
                            <p className="text-3xl font-black text-blue-700">{referralStats.completedReferrals}<span className="text-lg text-blue-500">/10</span></p>
                            <p className="text-xs text-blue-500 mt-1">{t('cashbackReceivers')}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <p className="text-sm font-semibold text-green-600 mb-1">{t('totalEarnings')}</p>
                            <p className="text-3xl font-black text-green-700">฿{referralStats.totalEarnings.toFixed(2)}</p>
                            <p className="text-xs text-green-500 mt-1">{t('totalCashback')}</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <p className="text-sm font-semibold text-purple-600 mb-1">{t('totalFriends')}</p>
                            <p className="text-3xl font-black text-purple-700">{referralStats.totalReferrals}</p>
                            <p className="text-xs text-purple-500 mt-1">{t('registered')}</p>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                            <p className="text-sm font-semibold text-orange-600 mb-1">{t('pendingPayout')}</p>
                            <p className="text-3xl font-black text-orange-700">฿{referralStats.pendingEarnings.toFixed(2)}</p>
                            <p className="text-xs text-orange-500 mt-1">{t('pendingWithdraw')}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Referral List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">{t('referralList')}</h3>
                        {referralList.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                      <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">{t('noReferrals')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {referralList.map((referral) => {
                              const orderValue = referral.orderValue || 0;
                              const isCompleted = orderValue >= 1000;
                              const status = isCompleted ? t('statusCompleted') : t('statusPending');
                              const statusColor = isCompleted ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200';
                              
                              return (
                                <div key={referral.id} className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                          <User size={18} className="text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-slate-900 truncate">{referral.referredUserName || t('user')}</p>
                                          <p className="text-xs text-slate-500 truncate">{referral.referredUserEmail}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-1 pl-[52px]">
                                        <p className="text-sm text-slate-600">
                                          {t('spending')}: <span className="font-bold text-slate-900">฿{orderValue.toFixed(2)}</span>
                                        </p>
                                        {isCompleted && referral.commission > 0 && (
                                          <p className="text-sm text-slate-600">
                                            Cashback: <span className="font-bold text-green-600">฿{referral.commission.toFixed(2)}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 shrink-0 ${statusColor}`}>
                                      {isCompleted ? (
                                        <CheckCircle2 size={16} />
                                      ) : (
                                        <Clock size={16} />
                                      )}
                                      <span className="font-bold text-sm whitespace-nowrap">{status}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-2">{t('howToUse')}</p>
                        <ol className="space-y-1 text-xs text-amber-700 list-decimal list-inside">
                          <li>{t('howToStep1')}</li>
                          <li>{t('howToStep2')}</li>
                          <li>{t('howToStep3')}</li>
                          <li>{t('howToStep4')}</li>
                          <li>{t('howToStep5')}</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
