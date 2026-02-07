import React from 'react';
import { Home, Grid, Ticket, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { cart } = useGlobal();
  const { t } = useTranslation('common');

  const navItems = [
    { icon: Home, label: t('nav.home'), path: '/' },
    { icon: Grid, label: t('nav.categories'), path: '/category' },
    { icon: Ticket, label: t('nav.specialProducts'), path: '/special-products' },
    { icon: ShoppingCart, label: t('nav.cart'), path: '/cart', badge: cart.length },
    { icon: User, label: t('nav.account'), path: '/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // Check active state
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className="relative flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform"
            >
              <div className={`transition-colors duration-200 p-1 rounded-xl ${isActive ? 'text-slate-900 bg-brand-gold' : 'text-slate-400'}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                {item.label}
              </span>
              
              {item.badge ? (
                <span className="absolute top-1 right-[20%] bg-red-600 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
};