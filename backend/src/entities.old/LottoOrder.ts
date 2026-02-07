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
import { LottoTicket } from './LottoTicket';

export enum LottoOrderStatus {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_FAILED = 'payment_failed',
  CONFIRMED = 'confirmed',
  PURCHASED_USA = 'purchased_usa',
  WAITING_DRAW = 'waiting_draw',
  CHECKING_RESULTS = 'checking_results',
  NO_WIN = 'no_win',
  PARTIAL_WIN = 'partial_win',
  JACKPOT = 'jackpot',
  PAYOUT_PROCESSING = 'payout_processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('lotto_orders')
export class LottoOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.lottoOrders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Order Info
  @Column({ unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: LottoOrderStatus,
    default: LottoOrderStatus.PENDING,
  })
  status: LottoOrderStatus;

  // Pricing
  @Column({ type: 'integer', name: 'total_tickets' })
  totalTickets: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'ticket_price_usd', default: 2.00 })
  ticketPriceUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'service_fee_usd', default: 5.00 })
  serviceFeeUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_per_ticket_usd', default: 7.00 })
  totalPerTicketUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount_usd' })
  totalAmountUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'exchange_rate' })
  exchangeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount_thb' })
  totalAmountThb: number;

  // Payment
  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true, name: 'payment_reference' })
  paymentReference: string;

  @Column({ nullable: true, name: 'payment_status' })
  paymentStatus: string;

  @Column({ nullable: true, name: 'paid_at' })
  paidAt: Date;

  // USA Purchase
  @Column({ nullable: true, name: 'usa_purchase_status' })
  usaPurchaseStatus: string;

  @Column({ nullable: true, name: 'usa_purchase_date' })
  usaPurchaseDate: Date;

  @Column({ nullable: true, name: 'usa_purchase_reference' })
  usaPurchaseReference: string;

  @Column({ nullable: true, name: 'usa_purchase_receipt_url' })
  usaPurchaseReceiptUrl: string;

  // Results
  @Column({ type: 'date', nullable: true, name: 'draw_date' })
  drawDate: Date;

  @Column({ nullable: true, name: 'draw_checked_at' })
  drawCheckedAt: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'winning_amount_usd' })
  winningAmountUsd: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'winning_amount_thb' })
  winningAmountThb: number;

  // Payout
  @Column({ nullable: true, name: 'payout_status' })
  payoutStatus: string;

  @Column({ nullable: true, name: 'payout_method' })
  payoutMethod: string;

  @Column({ nullable: true, name: 'payout_reference' })
  payoutReference: string;

  @Column({ nullable: true, name: 'payout_completed_at' })
  payoutCompletedAt: Date;

  // Email tracking
  @Column({ default: false, name: 'email_confirmation_sent' })
  emailConfirmationSent: boolean;

  @Column({ default: false, name: 'email_purchase_sent' })
  emailPurchaseSent: boolean;

  @Column({ default: false, name: 'email_draw_result_sent' })
  emailDrawResultSent: boolean;

  @Column({ default: false, name: 'email_payout_sent' })
  emailPayoutSent: boolean;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  // Location
  @Column({ type: 'jsonb', nullable: true, name: 'order_location' })
  orderLocation: any;

  // Notes
  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes: string;

  // Relations
  @OneToMany(() => LottoTicket, (ticket) => ticket.order)
  tickets: LottoTicket[];
}
