-- Migration to add customer_type column to orders table
-- Run this SQL in your Supabase dashboard or psql

ALTER TABLE public.orders 
ADD COLUMN customer_type text NOT NULL DEFAULT 'λιανική'::text 
CHECK (customer_type = ANY (ARRAY['λιανική'::text, 'χονδρική'::text]));

-- Create an index for better query performance
CREATE INDEX idx_orders_customer_type ON public.orders(customer_type);