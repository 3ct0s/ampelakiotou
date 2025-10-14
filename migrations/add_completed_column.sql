-- Migration to add completed column to orders table
-- Run this SQL in your Supabase dashboard or psql

ALTER TABLE public.orders 
ADD COLUMN completed boolean NOT NULL DEFAULT false;

-- Optionally, you can create an index for better query performance
CREATE INDEX idx_orders_completed ON public.orders(completed);

-- If you want to automatically mark orders as completed when status is 'shipped'
-- UPDATE public.orders SET completed = true WHERE status = 'shipped';