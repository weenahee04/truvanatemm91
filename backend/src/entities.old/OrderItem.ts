import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketplaceOrder } from './MarketplaceOrder';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => MarketplaceOrder, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: MarketplaceOrder;

  @Column({ nullable: true, name: 'product_id' })
  productId: string;

  // Product Snapshot
  @Column({ name: 'product_title' })
  productTitle: string;

  @Column({ nullable: true, name: 'product_sku' })
  productSku: string;

  @Column({ nullable: true, name: 'product_image_url' })
  productImageUrl: string;

  @Column({ type: 'jsonb', nullable: true, name: 'selected_variant' })
  selectedVariant: any;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price_usd' })
  unitPriceUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price_thb' })
  unitPriceThb: number;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal_usd' })
  subtotalUsd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal_thb' })
  subtotalThb: number;

  // Fulfillment
  @Column({ nullable: true, name: 'seller_id' })
  sellerId: string;

  @Column({ nullable: true, name: 'fulfillment_status' })
  fulfillmentStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
