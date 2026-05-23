'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { PortfolioHolding } from '@/types/stock';

interface BuyMoreModalProps {
  open: boolean;
  holding: PortfolioHolding | null;
  /** Current live market price (used to prefill the price field). */
  livePrice?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal for "buying more" of an existing holding. The user enters how many
 * additional shares they bought and at what price; the server averages the
 * new batch into the existing position. Shows a live preview of the new
 * weighted-average price so the user can sanity-check before saving.
 */
function BuyMoreModal({ open, holding, livePrice, onClose, onSaved }: BuyMoreModalProps) {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setQuantity('');
      // Prefill with the current live price as a sensible default; user can
      // override with the actual fill price they paid.
      setPrice(livePrice && livePrice > 0 ? livePrice.toFixed(2) : '');
      setError('');
    }
  }, [open, livePrice]);

  const preview = useMemo(() => {
    if (!holding) return null;
    const qty = Number(quantity);
    const px = Number(price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) return null;
    const newQty = holding.quantity + qty;
    const newAvg = (holding.quantity * holding.avg_buy_price + qty * px) / newQty;
    return { newQty, newAvg, added: qty * px };
  }, [holding, quantity, price]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!holding) return;

    const qty = Number(quantity);
    const px = Number(price);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a positive quantity.');
      return;
    }
    if (!Number.isFinite(px) || px <= 0) {
      setError('Enter a positive price.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/portfolio/${holding.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, price: px }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add shares');
      }
      const { toast } = await import('sonner');
      toast.success(`Added ${qty} ${holding.symbol} @ ${formatCurrency(px, holding.currency ?? 'USD')}`);
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      const { toast } = await import('sonner');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!holding) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Buy more ${holding.symbol}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-canvas p-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Current holding</span>
            <span className="text-primary">
              {holding.quantity} @ {formatCurrency(holding.avg_buy_price, holding.currency ?? 'USD')}
            </span>
          </div>
          {livePrice != null && livePrice > 0 && (
            <div className="mt-1 flex justify-between text-muted">
              <span>Live price</span>
              <span className="text-primary">{formatCurrency(livePrice, holding.currency ?? 'USD')}</span>
            </div>
          )}
        </div>

        <Input
          label="Additional Quantity"
          type="number"
          placeholder="e.g. 10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="any"
          autoFocus
        />

        <Input
          label="Buy Price (per share)"
          type="number"
          placeholder="Price you paid for this batch"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          step="any"
        />

        {preview && (
          <div className="rounded-lg border border-borderSubtle bg-elevated p-3 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">After this buy</p>
            <div className="flex justify-between">
              <span className="text-muted">New quantity</span>
              <span className="font-medium text-primary">{preview.newQty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">New avg buy price</span>
              <span className="font-medium text-primary">{formatCurrency(preview.newAvg, holding.currency ?? 'USD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cost of this batch</span>
              <span className="font-medium text-primary">{formatCurrency(preview.added, holding.currency ?? 'USD')}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-accent-red/20 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!preview}>
            Add Shares
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { BuyMoreModal };
