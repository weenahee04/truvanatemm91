
import React, { useEffect } from 'react';
import { Scale, Globe, FileSignature, Landmark, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const LottoLegal: React.FC = () => {
  const { t } = useTranslation('lotto');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/special-products">
            <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent text-slate-500 hover:text-brand-navy">
                <ArrowLeft size={20} className="mr-2" /> {t('legal.backToSpecial')}
            </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Scale size={150} className="text-white" />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-brand-gold text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        Messenger Service Agreement
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4" dangerouslySetInnerHTML={{ __html: t('legal.pageTitle') }} />
                    <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed">
                        {t('legal.pageDesc')}
                    </p>
                </div>
            </div>

            <div className="p-8 md:p-12 space-y-10 text-slate-700 leading-relaxed">
                
                {/* 1. Messenger Service Model */}
                <section>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-brand-navy">
                            <Globe size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('legal.section1Title')}</h2>
                            <p className="text-sm md:text-base text-slate-600 mb-3" dangerouslySetInnerHTML={{ __html: t('legal.section1Desc') }} />
                            <div className="bg-slate-50 border-l-4 border-brand-gold p-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: t('legal.section1Detail') }} />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100" />

                {/* 2. Ownership */}
                <section>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-brand-navy">
                            <FileSignature size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('legal.section2Title')}</h2>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-slate-600">
                                <li dangerouslySetInnerHTML={{ __html: t('legal.section2Item1') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('legal.section2Item2') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('legal.section2Item3') }} />
                            </ul>
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100" />

                {/* 3. Claims & Taxes */}
                <section>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-brand-navy">
                            <Landmark size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('legal.section3Title')}</h2>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="border border-slate-200 rounded-lg p-4">
                                    <h3 className="font-bold text-slate-900 mb-2">{t('legal.section3LowValue')}</h3>
                                    <p className="text-sm text-slate-600">{t('legal.section3LowValueDesc')}</p>
                                </div>
                                <div className="border border-slate-200 rounded-lg p-4">
                                    <h3 className="font-bold text-slate-900 mb-2">{t('legal.section3HighValue')}</h3>
                                    <p className="text-sm text-slate-600">{t('legal.section3HighValueDesc')}</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 mb-2" dangerouslySetInnerHTML={{ __html: t('legal.section3Tax') }} />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100" />

                 {/* 4. Jurisdiction */}
                 <section>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-brand-navy">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('legal.section4Title')}</h2>
                            <p className="text-sm md:text-base text-slate-600 mb-3">
                                {t('legal.section4Desc')}
                            </p>
                            <div className="flex gap-2 items-start bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>{t('legal.section4Warning')}</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
            
            <div className="bg-slate-50 p-6 text-center border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-4">
                    {t('legal.footerNote')}
                </p>
                <div className="flex justify-center gap-4">
                    <Link to="/contact">
                        <Button variant="outline">{t('legal.contactUs')}</Button>
                    </Link>
                    <Link to="/special-products">
                        <Button>{t('legal.acceptAndContinue')}</Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
