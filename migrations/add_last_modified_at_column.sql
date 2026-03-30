-- Track latest edit timestamp for sorting orders by most recently changed
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS last_modified_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows that may have NULL in environments where column existed before
UPDATE orders
SET last_modified_at = COALESCE(last_modified_at, created_at, now())
WHERE last_modified_at IS NULL;

CREATE OR REPLACE FUNCTION set_orders_last_modified_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_last_modified_at ON orders;

CREATE TRIGGER trg_orders_set_last_modified_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_orders_last_modified_at();

CREATE INDEX IF NOT EXISTS idx_orders_last_modified_at_desc
ON orders (last_modified_at DESC);