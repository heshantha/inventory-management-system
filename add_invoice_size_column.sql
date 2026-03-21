-- Add invoice_size column to shops table
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)
--
-- Values:
--   'thermal'      → Thermal Printer (80mm width)
--   'half_a4'      → Half A4 (210mm × 148mm)  ← default
--   'a4_portrait'  → A4 Portrait (210mm × 297mm)
--   'a4_landscape' → A4 Landscape (297mm × 210mm)

ALTER TABLE shops ADD COLUMN IF NOT EXISTS invoice_size TEXT DEFAULT 'half_a4';
