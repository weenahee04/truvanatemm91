import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Reference
  @Column({ name: 'order_type' })
  orderType: string; // 'lotto' or 'marketplace'

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Payment Info
  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true, name: 'payment_provider' })
  paymentProvider: string;

  @Column({ unique: true, name: 'payment_reference' })
  paymentReference: string;

  // Amount
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_usd' })
  amountUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_thb' })
  amountThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'exchange_rate' })
  exchangeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'fee_usd' })
  feeUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'fee_thb' })
  feeThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_amount_usd' })
  netAmountUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_amount_thb' })
  netAmountThb: number;

  // Status
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Provider Response
  @Column({ nullable: true, name: 'provider_transaction_id' })
  providerTransactionId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'provider_response' })
  providerResponse: any;

  // Card Info
  @Column({ nullable: true, name: 'card_last4' })
  cardLast4: string;

  @Column({ nullable: true, name: 'card_brand' })
  cardBrand: string;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ nullable: true, name: 'failed_at' })
  failedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;

  @Column({ nullable: true, name: 'refunded_at' })
  refundedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'refund_amount_thb' })
  refundAmountThb: number;
}
