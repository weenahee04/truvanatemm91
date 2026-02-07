import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale files
import thCommon from './locales/th/common.json';
import thHome from './locales/th/home.json';
import thAuth from './locales/th/auth.json';
import thCart from './locales/th/cart.json';
import thCheckout from './locales/th/checkout.json';
import thProfile from './locales/th/profile.json';
import thSeller from './locales/th/seller.json';
import thAdmin from './locales/th/admin.json';
import thLotto from './locales/th/lotto.json';
import thPages from './locales/th/pages.json';
import thProduct from './locales/th/product.json';
import thCategory from './locales/th/category.json';
import thReferral from './locales/th/referral.json';
import thMissions from './locales/th/missions.json';

import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enAuth from './locales/en/auth.json';
import enCart from './locales/en/cart.json';
import enCheckout from './locales/en/checkout.json';
import enProfile from './locales/en/profile.json';
import enSeller from './locales/en/seller.json';
import enAdmin from './locales/en/admin.json';
import enLotto from './locales/en/lotto.json';
import enPages from './locales/en/pages.json';
import enProduct from './locales/en/product.json';
import enCategory from './locales/en/category.json';
import enReferral from './locales/en/referral.json';
import enMissions from './locales/en/missions.json';

import zhCommon from './locales/zh/common.json';
import zhHome from './locales/zh/home.json';
import zhAuth from './locales/zh/auth.json';
import zhCart from './locales/zh/cart.json';
import zhCheckout from './locales/zh/checkout.json';
import zhProfile from './locales/zh/profile.json';
import zhSeller from './locales/zh/seller.json';
import zhAdmin from './locales/zh/admin.json';
import zhLotto from './locales/zh/lotto.json';
import zhPages from './locales/zh/pages.json';
import zhProduct from './locales/zh/product.json';
import zhCategory from './locales/zh/category.json';
import zhReferral from './locales/zh/referral.json';
import zhMissions from './locales/zh/missions.json';

import frCommon from './locales/fr/common.json';
import frHome from './locales/fr/home.json';
import frAuth from './locales/fr/auth.json';
import frCart from './locales/fr/cart.json';
import frCheckout from './locales/fr/checkout.json';
import frProfile from './locales/fr/profile.json';
import frSeller from './locales/fr/seller.json';
import frAdmin from './locales/fr/admin.json';
import frLotto from './locales/fr/lotto.json';
import frPages from './locales/fr/pages.json';
import frProduct from './locales/fr/product.json';
import frCategory from './locales/fr/category.json';
import frReferral from './locales/fr/referral.json';
import frMissions from './locales/fr/missions.json';

import esCommon from './locales/es/common.json';
import esHome from './locales/es/home.json';
import esAuth from './locales/es/auth.json';
import esCart from './locales/es/cart.json';
import esCheckout from './locales/es/checkout.json';
import esProfile from './locales/es/profile.json';
import esSeller from './locales/es/seller.json';
import esAdmin from './locales/es/admin.json';
import esLotto from './locales/es/lotto.json';
import esPages from './locales/es/pages.json';
import esProduct from './locales/es/product.json';
import esCategory from './locales/es/category.json';
import esReferral from './locales/es/referral.json';
import esMissions from './locales/es/missions.json';

import deCommon from './locales/de/common.json';
import deHome from './locales/de/home.json';
import deAuth from './locales/de/auth.json';
import deCart from './locales/de/cart.json';
import deCheckout from './locales/de/checkout.json';
import deProfile from './locales/de/profile.json';
import deSeller from './locales/de/seller.json';
import deAdmin from './locales/de/admin.json';
import deLotto from './locales/de/lotto.json';
import dePages from './locales/de/pages.json';
import deProduct from './locales/de/product.json';
import deCategory from './locales/de/category.json';
import deReferral from './locales/de/referral.json';
import deMissions from './locales/de/missions.json';

export const supportedLanguages = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LanguageCode = (typeof supportedLanguages)[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: {
        common: thCommon,
        home: thHome,
        auth: thAuth,
        cart: thCart,
        checkout: thCheckout,
        profile: thProfile,
        seller: thSeller,
        admin: thAdmin,
        lotto: thLotto,
        pages: thPages,
        product: thProduct,
        category: thCategory,
        referral: thReferral,
        missions: thMissions,
      },
      en: {
        common: enCommon,
        home: enHome,
        auth: enAuth,
        cart: enCart,
        checkout: enCheckout,
        profile: enProfile,
        seller: enSeller,
        admin: enAdmin,
        lotto: enLotto,
        pages: enPages,
        product: enProduct,
        category: enCategory,
        referral: enReferral,
        missions: enMissions,
      },
      zh: {
        common: zhCommon,
        home: zhHome,
        auth: zhAuth,
        cart: zhCart,
        checkout: zhCheckout,
        profile: zhProfile,
        seller: zhSeller,
        admin: zhAdmin,
        lotto: zhLotto,
        pages: zhPages,
        product: zhProduct,
        category: zhCategory,
        referral: zhReferral,
        missions: zhMissions,
      },
      fr: {
        common: frCommon,
        home: frHome,
        auth: frAuth,
        cart: frCart,
        checkout: frCheckout,
        profile: frProfile,
        seller: frSeller,
        admin: frAdmin,
        lotto: frLotto,
        pages: frPages,
        product: frProduct,
        category: frCategory,
        referral: frReferral,
        missions: frMissions,
      },
      es: {
        common: esCommon,
        home: esHome,
        auth: esAuth,
        cart: esCart,
        checkout: esCheckout,
        profile: esProfile,
        seller: esSeller,
        admin: esAdmin,
        lotto: esLotto,
        pages: esPages,
        product: esProduct,
        category: esCategory,
        referral: esReferral,
        missions: esMissions,
      },
      de: {
        common: deCommon,
        home: deHome,
        auth: deAuth,
        cart: deCart,
        checkout: deCheckout,
        profile: deProfile,
        seller: deSeller,
        admin: deAdmin,
        lotto: deLotto,
        pages: dePages,
        product: deProduct,
        category: deCategory,
        referral: deReferral,
        missions: deMissions,
      },
    },
    fallbackLng: 'th',
    defaultNS: 'common',
    ns: ['common', 'home', 'auth', 'cart', 'checkout', 'profile', 'seller', 'admin', 'lotto', 'pages', 'product', 'category', 'referral', 'missions'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'truvamate_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
