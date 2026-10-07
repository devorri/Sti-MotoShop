-- ============================================================================
-- BOSS RAP MOTOR SHOP - COMPLETE & TESTED SUPABASE DATABASE SCHEMA
-- Note: Tables are ordered strictly by dependency (Parent tables first).
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Members Table (Parent for accounts, sales, and return_requests)
CREATE TABLE IF NOT EXISTS public.members (
  id text NOT NULL,
  name text NOT NULL,
  contact text,
  address text,
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT members_pkey PRIMARY KEY (id)
);

-- 3. Products Table (Parent for sale_items, purchase_order_items, back_orders)
CREATE TABLE IF NOT EXISTS public.products (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0.00,
  stock integer NOT NULL DEFAULT 0,
  low_stock_level integer NOT NULL DEFAULT 5,
  barcode text UNIQUE,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 4. Accounts Table (Users, Cashiers, Admins)
CREATE TABLE IF NOT EXISTS public.accounts (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['ADMIN'::text, 'EMPLOYEE'::text, 'CUSTOMER'::text, 'GUEST'::text])),
  member_id text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT fk_accounts_member FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL
);

-- 5. Promos Table
CREATE TABLE IF NOT EXISTS public.promos (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  discount_percent numeric NOT NULL DEFAULT 0,
  min_spend numeric NOT NULL DEFAULT 0.00,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promos_pkey PRIMARY KEY (id)
);

-- 6. Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
  id text NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0.00,
  discount_applied numeric NOT NULL DEFAULT 0.00,
  total numeric NOT NULL DEFAULT 0.00,
  date timestamp with time zone NOT NULL DEFAULT now(),
  member_id text,
  channel text CHECK (channel = ANY (ARRAY['WALK-IN'::text, 'ONLINE/FACEBOOK'::text])),
  fulfillment_type text CHECK (fulfillment_type = ANY (ARRAY['STORE PICKUP'::text, 'DELIVERY'::text, 'COUNTER'::text])),
  order_status text CHECK (order_status = ANY (ARRAY['ORDER PLACED'::text, 'PREPARING'::text, 'READY FOR PICKUP'::text, 'OUT FOR DELIVERY'::text, 'COMPLETED'::text])),
  tracking_code text,
  notes text,
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['CASH'::text, 'E-WALLET'::text, 'ONLINE BANK'::text])),
  payment_ref text,
  receipt_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_pkey PRIMARY KEY (id),
  CONSTRAINT sales_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL
);

-- 7. Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL,
  CONSTRAINT sale_items_pkey PRIMARY KEY (id),
  CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE,
  CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- 8. Return Requests Table
CREATE TABLE IF NOT EXISTS public.return_requests (
  id text NOT NULL,
  sale_id text,
  member_id text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['RETURN'::text, 'REPLACE'::text])),
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  attachment_url text,
  date timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT return_requests_pkey PRIMARY KEY (id),
  CONSTRAINT return_requests_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL,
  CONSTRAINT return_requests_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL
);

-- 9. Inquiries Table (Customer contact form)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_pkey PRIMARY KEY (id)
);

-- 10. Points Settings Table (Store Loyalty Configuration)
CREATE TABLE IF NOT EXISTS public.points_settings (
  id integer NOT NULL DEFAULT 1,
  currency_per_point numeric NOT NULL DEFAULT 100.00,
  point_value numeric NOT NULL DEFAULT 1.00,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT points_settings_pkey PRIMARY KEY (id)
);

-- 11. Purchase Orders Table (Supplier Orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id text NOT NULL,
  supplier_name text NOT NULL,
  total_cost numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'RECEIVED'::text])),
  date_ordered timestamp with time zone NOT NULL DEFAULT now(),
  date_received timestamp with time zone,
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id)
);

-- 12. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  cost_price numeric NOT NULL,
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- 13. Audit Logs Table (Activity history & security audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  user_name text NOT NULL,
  user_role text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- 14. Back Orders Table (Customer out-of-stock reservations)
CREATE TABLE IF NOT EXISTS public.back_orders (
  id text NOT NULL,
  product_id text,
  product_name text NOT NULL,
  customer_name text NOT NULL,
  contact text,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'NOTIFIED'::text, 'FULFILLED'::text, 'CANCELLED'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT back_orders_pkey PRIMARY KEY (id),
  CONSTRAINT back_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);
