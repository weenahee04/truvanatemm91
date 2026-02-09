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

import arCommon from './locales/ar/common.json';
import arHome from './locales/ar/home.json';
import arAuth from './locales/ar/auth.json';
import arCart from './locales/ar/cart.json';
import arCheckout from './locales/ar/checkout.json';
import arProfile from './locales/ar/profile.json';
import arSeller from './locales/ar/seller.json';
import arAdmin from './locales/ar/admin.json';
import arLotto from './locales/ar/lotto.json';
import arPages from './locales/ar/pages.json';
import arProduct from './locales/ar/product.json';
import arCategory from './locales/ar/category.json';
import arReferral from './locales/ar/referral.json';
import arMissions from './locales/ar/missions.json';

import jaCommon from './locales/ja/common.json';
import jaHome from './locales/ja/home.json';
import jaAuth from './locales/ja/auth.json';
import jaCart from './locales/ja/cart.json';
import jaCheckout from './locales/ja/checkout.json';
import jaProfile from './locales/ja/profile.json';
import jaSeller from './locales/ja/seller.json';
import jaAdmin from './locales/ja/admin.json';
import jaLotto from './locales/ja/lotto.json';
import jaPages from './locales/ja/pages.json';
import jaProduct from './locales/ja/product.json';
import jaCategory from './locales/ja/category.json';
import jaReferral from './locales/ja/referral.json';
import jaMissions from './locales/ja/missions.json';

import koCommon from './locales/ko/common.json';
import koHome from './locales/ko/home.json';
import koAuth from './locales/ko/auth.json';
import koCart from './locales/ko/cart.json';
import koCheckout from './locales/ko/checkout.json';
import koProfile from './locales/ko/profile.json';
import koSeller from './locales/ko/seller.json';
import koAdmin from './locales/ko/admin.json';
import koLotto from './locales/ko/lotto.json';
import koPages from './locales/ko/pages.json';
import koProduct from './locales/ko/product.json';
import koCategory from './locales/ko/category.json';
import koReferral from './locales/ko/referral.json';
import koMissions from './locales/ko/missions.json';

import viCommon from './locales/vi/common.json';
import viHome from './locales/vi/home.json';
import viAuth from './locales/vi/auth.json';
import viCart from './locales/vi/cart.json';
import viCheckout from './locales/vi/checkout.json';
import viProfile from './locales/vi/profile.json';
import viSeller from './locales/vi/seller.json';
import viAdmin from './locales/vi/admin.json';
import viLotto from './locales/vi/lotto.json';
import viPages from './locales/vi/pages.json';
import viProduct from './locales/vi/product.json';
import viCategory from './locales/vi/category.json';
import viReferral from './locales/vi/referral.json';
import viMissions from './locales/vi/missions.json';

import idCommon from './locales/id/common.json';
import idHome from './locales/id/home.json';
import idAuth from './locales/id/auth.json';
import idCart from './locales/id/cart.json';
import idCheckout from './locales/id/checkout.json';
import idProfile from './locales/id/profile.json';
import idSeller from './locales/id/seller.json';
import idAdmin from './locales/id/admin.json';
import idLotto from './locales/id/lotto.json';
import idPages from './locales/id/pages.json';
import idProduct from './locales/id/product.json';
import idCategory from './locales/id/category.json';
import idReferral from './locales/id/referral.json';
import idMissions from './locales/id/missions.json';

export const supportedLanguages = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
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
      ar: {
        common: arCommon,
        home: arHome,
        auth: arAuth,
        cart: arCart,
        checkout: arCheckout,
        profile: arProfile,
        seller: arSeller,
        admin: arAdmin,
        lotto: arLotto,
        pages: arPages,
        product: arProduct,
        category: arCategory,
        referral: arReferral,
        missions: arMissions,
      },
      ja: {
        common: jaCommon,
        home: jaHome,
        auth: jaAuth,
        cart: jaCart,
        checkout: jaCheckout,
        profile: jaProfile,
        seller: jaSeller,
        admin: jaAdmin,
        lotto: jaLotto,
        pages: jaPages,
        product: jaProduct,
        category: jaCategory,
        referral: jaReferral,
        missions: jaMissions,
      },
      ko: {
        common: koCommon,
        home: koHome,
        auth: koAuth,
        cart: koCart,
        checkout: koCheckout,
        profile: koProfile,
        seller: koSeller,
        admin: koAdmin,
        lotto: koLotto,
        pages: koPages,
        product: koProduct,
        category: koCategory,
        referral: koReferral,
        missions: koMissions,
      },
      vi: {
        common: viCommon,
        home: viHome,
        auth: viAuth,
        cart: viCart,
        checkout: viCheckout,
        profile: viProfile,
        seller: viSeller,
        admin: viAdmin,
        lotto: viLotto,
        pages: viPages,
        product: viProduct,
        category: viCategory,
        referral: viReferral,
        missions: viMissions,
      },
      id: {
        common: idCommon,
        home: idHome,
        auth: idAuth,
        cart: idCart,
        checkout: idCheckout,
        profile: idProfile,
        seller: idSeller,
        admin: idAdmin,
        lotto: idLotto,
        pages: idPages,
        product: idProduct,
        category: idCategory,
        referral: idReferral,
        missions: idMissions,
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
