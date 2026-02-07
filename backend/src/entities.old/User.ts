import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LottoOrder } from './LottoOrder';
import { MarketplaceOrder } from './MarketplaceOrder';

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum KYCStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Don't return password by default
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ nullable: true, name: 'national_id' })
  nationalId: string;

  // Address
  @Column({ nullable: true, name: 'address_line1' })
  addressLine1: string;

  @Column({ nullable: true, name: 'address_line2' })
  addressLine2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ default: 'TH' })
  country: string;

  // Verification
  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.PENDING,
    name: 'kyc_status',
  })
  kycStatus: KYCStatus;

  @Column({ nullable: true, name: 'kyc_verified_at' })
  kycVerifiedAt: Date;

  // Account
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  @Column({ type: 'jsonb', nullable: true, name: 'last_login_location' })
  lastLoginLocation: any;

  // Preferences
  @Column({ type: 'jsonb', default: {} })
  preferences: any;

  // Relations
  @OneToMany(() => LottoOrder, (order) => order.user)
  lottoOrders: LottoOrder[];

  @OneToMany(() => MarketplaceOrder, (order) => order.user)
  marketplaceOrders: MarketplaceOrder[];
}
