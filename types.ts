
export interface Product {
  id: string;
  title: string;
  priceUSD: number;
  priceTHB: number;
  originalPriceTHB?: number;
  image: string;
  rating: number;
  sold: number;
  isFlashSale?: boolean;
  isUSImport?: boolean;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOption?: string;
}

export interface LottoTicket {
  id: number | string;
  numbers: number[];
  special: number;
  type?: 'Powerball' | 'Mega Millions';
  drawDate?: string;
  status?: 'pending' | 'won' | 'lost';
  price?: number;
  multiplier?: boolean;
  purchaseDate?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[] | LottoTicket[];
  total: number;
  status: string;
  type: 'marketplace' | 'lotto';
  paymentMethod: string;
  userId?: string; // User ID who placed this order
}

export interface User {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  memberSince?: string;
  createdAt?: string;
  role?: UserRole;
  referralCode?: string;
  referredBy?: string;
}

export interface SavedCard {
  id: string;
  type: 'visa' | 'mastercard' | 'jcb';
  last4: string;
  holderName: string;
  expiry: string;
}

export interface PayoutAccount {
  id: string;
  type: 'bank_th' | 'bank_global' | 'paypal';
  providerName: string; // SCB, Chase, PayPal
  accountName: string;
  accountNumber: string; // Or IBAN / Email
  swiftCode?: string; // For Global
  bankAddress?: string; // For Global
  isDefault?: boolean;
}

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export type UserRoleString = 'customer' | 'seller' | 'admin';

// Notification System
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// CMS Types
export interface Banner {
  id: number | string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
}

export interface HeroContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  backgroundImage?: string;
}

export interface SiteContent {
  hero: HeroContent;
  promoBanners: Banner[];
  categoryBanners: Banner[];
}

// Referral System Types
export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  totalReferrals: number;
  totalEarnings: number;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  createdAt: string;
  status: 'pending' | 'completed';
  orderValue: number;
  commission: number;
  commissionPaid: boolean;
  paidAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface ReferralSettings {
  commissionRate: number;
  minOrderValue: number;
  maxCommission: number;
}