
import React, { useEffect } from 'react';
import { Shield, Lock, FileText, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO, SEOPresets } from '../components/SEO';

export const Legal: React.FC = () => {
  const { t } = useTranslation('pages');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO {...SEOPresets.legal} />
      <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-navy p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#FFD700 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-brand-gold uppercase tracking-tight mb-4">
              {t('legal.pageTitle')}
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              {t('legal.pageSubtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12">
          
          {/* Section 1: Privacy Policy */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-slate-900">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t('legal.s1Title')}</h2>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
              <p dangerouslySetInnerHTML={{ __html: t('legal.s1Intro') }} />
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>{t('legal.s1DataTitle')}</strong> {t('legal.s1DataDesc')}</li>
                <li><strong>{t('legal.s1UsageTitle')}</strong> {t('legal.s1UsageDesc')}</li>
                <li><strong>{t('legal.s1SecurityTitle')}</strong> {t('legal.s1SecurityDesc')}</li>
                <li><strong>{t('legal.s1SharingTitle')}</strong> {t('legal.s1SharingDesc')}</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2: Terms of Service */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-slate-900">
                <FileText size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t('legal.s2Title')}</h2>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
              <p>{t('legal.s2Intro')}</p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">{t('legal.s2_1Title')}</h3>
                  <p className="text-sm">{t('legal.s2_1Desc')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">{t('legal.s2_2Title')}</h3>
                  <p className="text-sm">
                    {t('legal.s2_2Desc')}
                    <br/><br/>
                    {(t('legal.s2_2Items', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i}>- {item}<br/></span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3: Legal Compliance */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-slate-900">
                <Scale size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t('legal.s3Title')}</h2>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
              <p>{t('legal.s3Intro')}</p>
              <p dangerouslySetInnerHTML={{ __html: t('legal.s3Prohibited') }} />
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4: Contact */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-slate-900">
                <Shield size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t('legal.s4Title')}</h2>
            </div>
            <p className="text-slate-600">
              {t('legal.s4Intro')}
            </p>
            <div className="mt-4 p-4 bg-brand-navy text-white rounded-lg inline-block">
              <p className="font-bold">{t('legal.dpoTitle')}</p>
              <p className="text-sm opacity-80">{t('legal.dpoEmail')}</p>
              <p className="text-sm opacity-80">{t('legal.dpoPhone')}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
    </>
  );
};
