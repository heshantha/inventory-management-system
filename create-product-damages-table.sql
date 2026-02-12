-- Product Damages Table Migration
-- This table tracks damaged inventory items
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_damages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_damages_shop_id ON product_damages(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_damages_product_id ON product_damages(product_id);
CREATE INDEX IF NOT EXISTS idx_product_damages_created_at ON product_damages(created_at DESC);

-- Disable RLS for development (enable and configure policies for production)
ALTER TABLE product_damages DISABLE ROW LEVEL SECURITY;

-- Add comment to table
COMMENT ON TABLE product_damages IS 'Tracks damaged inventory products with quantity, reason, and timestamp';
