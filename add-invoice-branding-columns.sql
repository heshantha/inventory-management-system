-- Add invoice branding columns for shop-level customization
ALTER TABLE shops ADD COLUMN IF NOT EXISTS invoice_logo_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS invoice_header_color TEXT DEFAULT '#1e3a8a';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS invoice_title_color TEXT DEFAULT '#1e3a8a';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS invoice_paragraph_color TEXT DEFAULT '#1f2937';
