export type OrderFlowStage = 'pending' | 'confirmed' | 'paid' | 'completed';

export function normalizeStatus(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

/**
 * Map any granular status into a canonical flow stage:
 * pending -> confirmed -> paid -> completed
 */
export function flowStageFromStatus(statusRaw: unknown): OrderFlowStage {
  const s = normalizeStatus(statusRaw);

  // Stage 0
  if (!s || s === 'pending' || s === 'payment_pending' || s === 'created') return 'pending';

  // Stage 2 / 3
  if (s === 'paid' || s === 'payment_confirmed') return 'paid';
  if (s === 'completed') return 'completed';

  // Treat shipping-like statuses as "paid stage" so we don't regress after payment.
  // (Fulfillment can progress while keeping the canonical flow monotonic.)
  if (
    s === 'shipping' ||
    s === 'shipped' ||
    s === 'in_transit' ||
    s === 'out_for_delivery' ||
    s === 'delivering'
  ) {
    return 'paid';
  }

  // Treat most "in progress" statuses as confirmed (stage 1)
  return 'confirmed';
}

export function flowIndex(stage: OrderFlowStage): number {
  if (stage === 'pending') return 0;
  if (stage === 'confirmed') return 1;
  if (stage === 'paid') return 2;
  return 3;
}

export function stageFromIndex(i: number): OrderFlowStage {
  if (i <= 0) return 'pending';
  if (i === 1) return 'confirmed';
  if (i === 2) return 'paid';
  return 'completed';
}

