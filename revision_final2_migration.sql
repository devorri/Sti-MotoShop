-- ==============================================================================
-- BOSS RAP MOTOR SHOP - FINAL REVISION #2 MIGRATION
-- Run ONCE in Supabase -> SQL Editor AFTER revision_redemo_migration.sql
-- (safe to re-run; fully idempotent).
-- Covers: supplier info entered directly on the Purchase Order (no supplier
--         account needed) + supplier delivery time (days) to Boss Rap.
-- ==============================================================================

-- Supplier's usual delivery time (days)
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS delivery_days integer;

-- Supplier details saved directly on each Purchase Order
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_contact text,
  ADD COLUMN IF NOT EXISTS supplier_phone text,
  ADD COLUMN IF NOT EXISTS supplier_address text,
  ADD COLUMN IF NOT EXISTS delivery_days integer,
  ADD COLUMN IF NOT EXISTS expected_delivery timestamp with time zone;

-- Backfill old POs with the supplier's saved info (if linked)
UPDATE public.purchase_orders po
SET supplier_contact = COALESCE(po.supplier_contact, s.contact_person),
    supplier_phone   = COALESCE(po.supplier_phone, s.phone),
    supplier_address = COALESCE(po.supplier_address, s.address)
FROM public.suppliers s
WHERE po.supplier_id = s.id;

-- Refresh PostgREST schema cache so the app sees the new columns immediately
NOTIFY pgrst, 'reload schema';
