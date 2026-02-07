import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import {
  Users, TrendingUp, DollarSign, Gift, Copy, CheckCircle, Share2,
  Clock, Award, ArrowRight, ExternalLink, RefreshCw, AlertCircle,
  Calendar, User, Mail, Phone, Facebook, Twitter, MessageCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getReferralCodeByUserId,
  getUserReferrals,
  getReferralStats,
  type Referral,
  type ReferralStats,
  type ReferralCode
} from '../services/referralService';

export const ReferralDashboard: React.FC = () => {
  const { user, showToast } = useGlobal();
  const { t } = useTranslation('referral');
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [code, userReferrals, userStats] = await Promise.all([
        getReferralCodeByUserId(user.id),
        getUserReferrals(user.id),
        getReferralStats(user.id),
      ]);

      setReferralCode(code);
      setReferrals(userReferrals);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
      showToast(t('loadError'), 'error');
    }
    setLoading(false);
  };

  const copyReferralCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    showToast(t('codeCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/login?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    showToast(t('linkCopied'), 'success');
  };

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'line') => {
    if (!referralCode) return;
    const link = `${window.location.origin}/login?ref=${referralCode.code}`;
    const text = t('shareText');

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case 'line':
        url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{t('pleaseLogin')}</p>
          <Link to="/login">
            <Button>{t('login')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <RefreshCw className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-gold to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2">🎁 {t('pageTitle')}</h1>
              <p className="text-amber-100">{t('pageDesc')}</p>
            </div>
            <Button onClick={loadData} variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
              <RefreshCw size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-500" size={24} />
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.totalReferrals || 0}</p>
            <p className="text-sm text-slate-500 mt-1">{t('referredFriends')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={24} />
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Completed
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.completedReferrals || 0}</p>
            <p className="text-sm text-slate-500 mt-1">{t('purchased')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-purple-500" size={24} />
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Earnings
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              ฿{stats?.totalEarnings.toLocaleString() || 0}
            </p>
            <p className="text-sm text-slate-500 mt-1">{t('totalEarnings')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-orange-500" size={24} />
              <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              ฿{stats?.pendingEarnings.toLocaleString() || 0}
            </p>
            <p className="text-sm text-slate-500 mt-1">{t('pendingPayout')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Code Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Gift className="text-brand-gold" size={24} />
                {t('yourCode')}
              </h2>

              {referralCode && (
                <>
                  <div className="bg-gradient-to-br from-brand-gold to-amber-500 rounded-xl p-6 text-white mb-4">
                    <p className="text-sm opacity-90 mb-2">Referral Code</p>
                    <p className="text-3xl font-black tracking-wider mb-4">{referralCode.code}</p>
                    <button
                      onClick={copyReferralCode}
                      className="w-full bg-white text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={18} />
                          {t('copiedBtn')}
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          {t('copyCode')}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={copyReferralLink}
                      className="w-full bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink size={18} />
                      {t('copyLink')}
                    </button>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-sm font-bold text-slate-600 mb-2">{t('shareTo')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => shareToSocial('facebook')}
                          className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Facebook size={18} />
                        </button>
                        <button
                          onClick={() => shareToSocial('twitter')}
                          className="bg-sky-500 text-white py-2 px-3 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center"
                        >
                          <Twitter size={18} />
                        </button>
                        <button
                          onClick={() => shareToSocial('line')}
                          className="bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Award className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">{t('howToUse')}</p>
                        <ol className="space-y-1 text-xs list-decimal list-inside">
                          <li>{t('howToStep1')}</li>
                          <li>{t('howToStep2')}</li>
                          <li>{t('howToStep3')}</li>
                          <li>{t('howToStep4')}</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Referrals List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="text-purple-500" size={24} />
                {t('friendsReferred')} ({referrals.length})
              </h2>

              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">{t('noFriendsYet')}</p>
                  <p className="text-sm text-slate-400 mt-1">{t('startSharing')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-gold transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {referral.referredUserName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{referral.referredUserName}</p>
                          <p className="text-sm text-slate-500">{referral.referredUserEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-400">
                              {new Date(referral.createdAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {referral.status === 'completed' ? (
                          <>
                            <p className="font-bold text-green-600">
                              +฿{referral.commission.toLocaleString()}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <CheckCircle size={12} />
                              {t('paid')}
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-orange-600">฿0</p>
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              <Clock size={12} />
                              {t('waitingPurchase')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-2">{t('commissionTerms')}</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>{t('term1')}</li>
                    <li>{t('term2')}</li>
                    <li>{t('term3')}</li>
                    <li>{t('term4')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;
