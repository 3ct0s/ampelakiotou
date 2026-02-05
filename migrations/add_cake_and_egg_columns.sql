-- Add new product category flags for cakes, vasilopita, egg prints, and eggs
-- Run this SQL in Supabase SQL editor or psql

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS has_cakes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_vasilopita boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_egg_prints boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_eggs boolean DEFAULT false;

-- Optional: indexes to speed up filtering by these categories
CREATE INDEX IF NOT EXISTS idx_orders_has_cakes ON public.orders(has_cakes);
CREATE INDEX IF NOT EXISTS idx_orders_has_vasilopita ON public.orders(has_vasilopita);
CREATE INDEX IF NOT EXISTS idx_orders_has_egg_prints ON public.orders(has_egg_prints);
CREATE INDEX IF NOT EXISTS idx_orders_has_eggs ON public.orders(has_eggs);
