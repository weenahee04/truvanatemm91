import React, { useEffect } from 'react';
import { FileText, ShieldAlert, Scale, AlertTriangle, Copyright, Gavel, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO, SEOPresets } from '../components/SEO';

export const Terms: React.FC = () => {
  const { t } = useTranslation('pages');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO {...SEOPresets.terms} />
      <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-navy p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#FFD700 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-brand-gold uppercase tracking-tight mb-4">
              {t('terms.pageTitle')}
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto font-medium">
              {t('terms.pageSubtitle')}
            </p>
            <p className="text-xs text-slate-400 mt-2">{t('terms.lastUpdated')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-slate-700 leading-relaxed text-sm md:text-base">
          
          {/* Company Info */}
          <div className="bg-brand-gold/10 p-6 rounded-xl border-l-4 border-brand-gold">
            <p className="text-slate-900 font-bold mb-2">{t('terms.companyName')}</p>
            <p className="text-slate-600 text-sm">
              {t('terms.companyIntro')}
            </p>
            <p className="text-slate-600 text-sm mt-2" dangerouslySetInnerHTML={{ __html: t('terms.companyAcceptance') }} />
          </div>

          <hr className="border-slate-200" />

          {/* 1. Purpose */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s1Title')}</h2>
            </div>
            <ul className="list-decimal pl-6 space-y-2">
              {(t('terms.s1Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* 2. Scope */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s2Title')}</h2>
            </div>
            <ul className="list-decimal pl-6 space-y-2">
              {(t('terms.s2Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* 3. Fees */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s3Title')}</h2>
            </div>
            <p className="mb-3 font-bold text-slate-900">{t('terms.s3_1Title')}</p>
            <ul className="list-disc pl-8 space-y-1 mb-4">
              {(t('terms.s3_1Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="mb-2">{t('terms.s3_2')}</p>
            <p>{t('terms.s3_3')}</p>
          </section>

          <hr className="border-slate-100" />

          {/* 4. Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-brand-gold" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s4Title')}</h2>
            </div>
            <div className="space-y-3">
              <p>{t('terms.s4_1')}</p>
              <div>
                <p className="font-bold mb-2">{t('terms.s4_2Title')}</p>
                <ul className="list-disc pl-8 space-y-1">
                  {(t('terms.s4_2Items', { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <p>{t('terms.s4_3')}</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 5. Website Usage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s5Title')}</h2>
            </div>
            <ul className="list-decimal pl-6 space-y-2">
              {(t('terms.s5Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* 6. Amendment */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s6Title')}</h2>
            </div>
            <p>{t('terms.s6Content')}</p>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* PDPA Section */}
          <div className="bg-slate-900 -mx-8 md:-mx-12 px-8 md:px-12 py-10">
            <h1 className="text-2xl md:text-3xl font-black text-brand-gold mb-3">{t('terms.pdpaTitle')}</h1>
            <p className="text-slate-300 text-sm">{t('terms.pdpaSubtitle')}</p>
          </div>

          {/* 7. Data Collection */}
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s7Title')}</h2>
            </div>
            <p className="mb-3">{t('terms.s7Intro')}</p>
            <ul className="list-disc pl-8 space-y-1">
              {(t('terms.s7Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* 8. Purpose */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s8Title')}</h2>
            </div>
            <p className="mb-3">{t('terms.s8Intro')}</p>
            <ul className="list-disc pl-8 space-y-1 mb-4">
              {(t('terms.s8Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-brand-gold">
              <p className="text-slate-900" dangerouslySetInnerHTML={{ __html: t('terms.s8NoShare') }} />
              <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                {(t('terms.s8NoShareItems', { returnObjects: true }) as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 9. Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s9Title')}</h2>
            </div>
            <p className="mb-3">{t('terms.s9Intro')}</p>
            <ul className="list-disc pl-8 space-y-1 mb-3">
              {(t('terms.s9Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-slate-600">{t('terms.s9Outro')}</p>
          </section>

          <hr className="border-slate-100" />

          {/* 10. Data Subject Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Copyright className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s10Title')}</h2>
            </div>
            <p className="mb-3">{t('terms.s10Intro')}</p>
            <ul className="list-disc pl-8 space-y-1 mb-3">
              {(t('terms.s10Items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-slate-600">{t('terms.s10Outro')}</p>
          </section>

          <hr className="border-slate-100" />

          {/* 11. Data Transfer */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-brand-gold" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s11Title')}</h2>
            </div>
            <p>{t('terms.s11Content')}</p>
          </section>

          <hr className="border-slate-100" />

          {/* 12. Contact */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s12Title')}</h2>
            </div>
            <p className="mb-3">{t('terms.s12Intro')}</p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1 text-sm">
              <p><strong>{t('terms.companyNameLabel')}</strong> {t('terms.s12Company')}</p>
              <p><strong>{t('terms.emailLabel')}</strong> {t('terms.s12Email')}</p>
              <p><strong>{t('terms.addressLabel')}</strong> {t('terms.s12Address')}</p>
              <p><strong>{t('terms.phoneLabel')}</strong> {t('terms.s12Phone')}</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 13. Acceptance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="text-brand-navy" size={24} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('terms.s13Title')}</h2>
            </div>
            <div className="bg-brand-gold/10 p-6 rounded-xl border-l-4 border-brand-gold">
              <p className="font-bold text-slate-900 mb-3">{t('terms.s13Intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                {(t('terms.s13Items', { returnObjects: true }) as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="bg-slate-100 p-6 rounded-xl text-center mt-12">
            <h3 className="font-bold text-slate-900 mb-2">{t('terms.faqTitle')}</h3>
            <p className="text-slate-600 mb-4 text-sm">{t('terms.faqDesc')}</p>
            <button className="text-brand-navy font-bold hover:underline">{t('terms.contactLegal')}</button>
          </div>

        </div>
      </div>
      </div>
    </>
  );
};
