
import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <footer className="bg-brand-navy text-slate-300 pt-16 pb-8 border-t-4 border-brand-gold">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* About */}
          <div>
            <img 
              src="/truvamate-logo.png" 
              alt="Truvamate" 
              className="h-8 w-auto mb-4"
            />
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center hover:bg-brand-blue transition-colors text-white"><Facebook size={16} /></a>
              <a href="#" className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center hover:bg-pink-600 transition-colors text-white"><Instagram size={16} /></a>
              <a href="#" className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center hover:bg-sky-500 transition-colors text-white"><Twitter size={16} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.customerService')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal" className="hover:text-brand-gold transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/how-to-use" className="hover:text-brand-gold transition-colors">{t('footer.howToUse')}</Link></li>
              <li><Link to="/legal" className="hover:text-brand-gold transition-colors">{t('footer.payment')}</Link></li>
              <li><Link to="/legal" className="hover:text-brand-gold transition-colors">{t('footer.shipping')}</Link></li>
              <li><Link to="/legal" className="hover:text-brand-gold transition-colors">{t('footer.returnPolicy')}</Link></li>
            </ul>
          </div>

          {/* Category */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.popularCategories')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/special-products" className="hover:text-brand-gold transition-colors">{t('footer.specialProductsUSA')}</Link></li>
              <li><Link to="/category/fashion" className="hover:text-brand-gold transition-colors">{t('footer.sneakers')}</Link></li>
              <li><Link to="/category/fashion" className="hover:text-brand-gold transition-colors">{t('footer.brandBags')}</Link></li>
              <li><Link to="/category/vitamins" className="hover:text-brand-gold transition-colors">{t('footer.vitaminsUSA')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5" />
                <span>123 Silom Tower, Floor 15,<br />Bangkok, Thailand 10500</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-brand-gold shrink-0" />
                <span>02-123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-brand-gold shrink-0" />
                <span>support@truvamate.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>{t('footer.copyright')}</p>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            <Link to="/legal" className="hover:text-white">{t('footer.privacyPolicy')}</Link>
            <Link to="/terms" className="hover:text-white">{t('footer.termsOfService')}</Link>
            <Link to="/special-products-legal" className="text-brand-gold hover:text-white font-bold">{t('footer.serviceAgreement')}</Link>
            <Link to="/admin" className="hover:text-brand-gold flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
              <ShieldAlert size={12} /> {t('footer.adminOnly')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
