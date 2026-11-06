-- ==============================================================================
-- BOSS RAP MOTOR SHOP - RE-DEMO REVISIONS MIGRATION
-- Run this ONCE in Supabase -> SQL Editor (safe to re-run; fully idempotent).
-- Covers: Supplier maintenance, supplier price list, partial receiving,
--         bad orders (damaged / over-delivery), direct PO, promo redemption
--         limits, and rider delivery proof photo.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SUPPLIER MAINTENANCE  (#8)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id text NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

-- ------------------------------------------------------------------------------
-- 2. SUPPLIER OF PRODUCT + SUPPLIER PRICE LIST  (#3, #6, #8)
--    What each supplier sells to Boss Rap and at what price (cost).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_id text NOT NULL,
  product_id text NOT NULL,
  supplier_price numeric NOT NULL DEFAULT 0.00,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT product_suppliers_unique UNIQUE (supplier_id, product_id),
  CONSTRAINT product_suppliers_supplier_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE,
  CONSTRAINT product_suppliers_product_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 3. PURCHASE ORDERS: supplier link, Direct PO, partial receiving, payable  (#4, #5, #7, #9)
-- ------------------------------------------------------------------------------
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id text,
  ADD COLUMN IF NOT EXISTS po_type text DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS amount_payable numeric DEFAULT 0.00;

ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_status_check
  CHECK (status = ANY (ARRAY['PENDING'::text, 'PARTIAL'::text, 'RECEIVED'::text, 'CANCELLED'::text]));

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS received_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damaged_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excess_qty integer NOT NULL DEFAULT 0;

-- Older POs that were already marked RECEIVED were received in full
UPDATE public.purchase_order_items poi
SET received_qty = poi.quantity
FROM public.purchase_orders po
WHERE po.id = poi.purchase_order_id AND po.status = 'RECEIVED' AND poi.received_qty = 0;

UPDATE public.purchase_orders po
SET amount_payable = po.total_cost
WHERE po.status = 'RECEIVED' AND COALESCE(po.amount_payable, 0) = 0;

-- ------------------------------------------------------------------------------
-- 4. BAD ORDERS  (#10)
--    DAMAGED  = defective items from supplier -> to be returned / replaced
--    EXCESS   = over-delivered items -> return to supplier or accept (pay extra)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bad_orders (
  id text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['DAMAGED'::text, 'EXCESS'::text])),
  purchase_order_id text,
  supplier_id text,
  supplier_name text,
  product_id text,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'PENDING',
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT bad_orders_pkey PRIMARY KEY (id),
  CONSTRAINT bad_orders_po_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT bad_orders_product_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- 5. PROMO REDEMPTION LIMITS  (#16)
--    max_redemptions: how many times the promo can be used in total (NULL = unlimited)
--    applies_to: ALL | WALK-IN | ONLINE
-- ------------------------------------------------------------------------------
ALTER TABLE public.promos
  ADD COLUMN IF NOT EXISTS max_redemptions integer,
  ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'ALL';

-- ------------------------------------------------------------------------------
-- 6. RIDER DELIVERY PROOF PHOTO  (#17)
-- ------------------------------------------------------------------------------
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS delivery_proof_url text;

-- ------------------------------------------------------------------------------
-- 7. ACCESS
--    The app talks to Supabase with the anon key (same as all existing tables),
--    so the new tables must not have Row Level Security blocking reads/writes.
-- ------------------------------------------------------------------------------
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bad_orders DISABLE ROW LEVEL SECURITY;
