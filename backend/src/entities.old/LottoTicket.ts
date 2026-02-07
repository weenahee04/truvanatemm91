import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LottoOrder } from './LottoOrder';

export enum GameType {
  POWERBALL = 'Powerball',
  MEGA_MILLIONS = 'MegaMillions',
}

@Entity('lotto_tickets')
export class LottoTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => LottoOrder, (order) => order.tickets)
  @JoinColumn({ name: 'order_id' })
  order: LottoOrder;

  // Ticket Info
  @Column({ unique: true, name: 'ticket_number' })
  ticketNumber: string;

  @Column({
    type: 'enum',
    enum: GameType,
    name: 'game_type',
  })
  gameType: GameType;

  // Numbers
  @Column({ type: 'int', array: true })
  numbers: number[];

  @Column({ type: 'integer', name: 'special_number' })
  specialNumber: number;

  // Multiplier
  @Column({ default: false, name: 'has_multiplier' })
  hasMultiplier: boolean;

  @Column({ nullable: true, name: 'multiplier_value' })
  multiplierValue: number;

  // Results
  @Column({ default: 0, name: 'matched_main_numbers' })
  matchedMainNumbers: number;

  @Column({ default: false, name: 'matched_special' })
  matchedSpecial: boolean;

  @Column({ nullable: true, name: 'prize_tier' })
  prizeTier: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'prize_amount_usd' })
  prizeAmountUsd: number;

  // USA Purchase Details
  @Column({ nullable: true, name: 'usa_ticket_barcode' })
  usaTicketBarcode: string;

  @Column({ nullable: true, name: 'usa_ticket_image_url' })
  usaTicketImageUrl: string;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
