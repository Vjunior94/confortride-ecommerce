-- Migration: Add Mercado Pago payment columns to orders table
-- Run this in Supabase SQL Editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_data JSONB;

-- Update existing orders with "pending" status to "awaiting_payment" if desired
-- (Optional: only run if you want to retroactively update existing unpaid orders)
-- UPDATE orders SET status = 'awaiting_payment' WHERE status = 'pending';
