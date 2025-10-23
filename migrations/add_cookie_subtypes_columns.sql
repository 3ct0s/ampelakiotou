-- Adds three new cookie subtype flags on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS has_big_cookies boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_cookies_box3 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_cookies_box4 boolean DEFAULT false;

-- No change needed in product_details JSON structure; new arrays will be accepted as-is
