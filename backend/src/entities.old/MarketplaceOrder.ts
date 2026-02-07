import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';

export enum MarketplaceOrderStatus {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('marketplace_orders')
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.marketplaceOrders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Order Info
  @Column({ unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: MarketplaceOrderStatus,
    default: MarketplaceOrderStatus.PENDING,
  })
  status: MarketplaceOrderStatus;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal_usd' })
  subtotalUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal_thb' })
  subtotalThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'shipping_fee_usd' })
  shippingFeeUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'shipping_fee_thb' })
  shippingFeeThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_usd' })
  taxUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_thb' })
  taxThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_usd' })
  discountUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_thb' })
  discountThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_usd' })
  totalUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_thb' })
  totalThb: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'exchange_rate' })
  exchangeRate: number;

  // Payment
  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true, name: 'payment_reference' })
  paymentReference: string;

  @Column({ nullable: true, name: 'payment_status' })
  paymentStatus: string;

  @Column({ nullable: true, name: 'paid_at' })
  paidAt: Date;

  // Shipping
  @Column({ type: 'jsonb', name: 'shipping_address' })
  shippingAddress: any;

  @Column({ nullable: true, name: 'shipping_method' })
  shippingMethod: string;

  @Column({ nullable: true, name: 'tracking_number' })
  trackingNumber: string;

  @Column({ nullable: true, name: 'shipped_at' })
  shippedAt: Date;

  @Column({ nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  // Notes
  @Column({ type: 'text', nullable: true, name: 'customer_notes' })
  customerNotes: string;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes: string;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  // Relations
  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
