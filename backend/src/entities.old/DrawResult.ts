import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameType } from './LottoTicket';

@Entity('draw_results')
export class DrawResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Draw Info
  @Column({
    type: 'enum',
    enum: GameType,
    name: 'game_type',
  })
  gameType: GameType;

  @Column({ type: 'date', name: 'draw_date' })
  drawDate: Date;

  @Column({ type: 'time', name: 'draw_time' })
  drawTime: string;

  @Column({ type: 'integer', name: 'draw_number' })
  drawNumber: number;

  // Winning Numbers
  @Column({ type: 'int', array: true, name: 'winning_numbers' })
  winningNumbers: number[];

  @Column({ type: 'integer', name: 'special_number' })
  specialNumber: number;

  @Column({ nullable: true, name: 'multiplier_value' })
  multiplierValue: number;

  // Jackpot
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'jackpot_amount_usd' })
  jackpotAmountUsd: number;

  @Column({ default: 0, name: 'jackpot_winners' })
  jackpotWinners: number;

  // Winners by tier
  @Column({ type: 'jsonb', nullable: true, name: 'winners_by_tier' })
  winnersByTier: any;

  // Source
  @Column({ nullable: true, name: 'official_url' })
  officialUrl: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true, name: 'verified_at' })
  verifiedAt: Date;

  @Column({ nullable: true, name: 'verified_by' })
  verifiedBy: string;

  // Tracking
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
