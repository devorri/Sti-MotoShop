-- ==============================================================================
-- BOSS RAP MOTOR SHOP - COMPLETE DATABASE ALIGNMENT MIGRATION
-- Run this in your Supabase Project -> SQL Editor
-- This script is completely IDEMPOTENT (safe to run multiple times without errors)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROMOS TABLE ALIGNMENT
-- Required for: Promo voucher rules (Free shipping, first order only, 1-use per customer)
-- ------------------------------------------------------------------------------
ALTER TABLE public.promos 
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'PERCENT',
  ADD COLUMN IF NOT EXISTS first_order_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS single_use_per_customer boolean DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. SALES TABLE ALIGNMENT
-- Required for: Promo voucher tracking, payment verification, and receipt upload proof
-- ------------------------------------------------------------------------------
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS promo_id text,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- ------------------------------------------------------------------------------
-- 3. BACK_ORDERS TABLE ALIGNMENT
-- Required for: Customer contact phone in back order queue
-- ------------------------------------------------------------------------------
ALTER TABLE public.back_orders 
  ADD COLUMN IF NOT EXISTS customer_contact text;

-- Sync existing 'contact' data to 'customer_contact' if any exists
UPDATE public.back_orders 
SET customer_contact = contact 
WHERE customer_contact IS NULL AND contact IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. PROMO REDEMPTIONS TABLE (MISSING FROM CURRENT SCHEMA)
-- Required for: Preventing promo voucher abuse across devices (1-use / first-order)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promo_id text NOT NULL,
  member_id text NOT NULL,
  sale_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promo_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT promo_redemptions_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promos(id) ON DELETE CASCADE,
  CONSTRAINT promo_redemptions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
  CONSTRAINT promo_redemptions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL
);

-- Index for instant voucher checks during checkout
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_member_promo 
  ON public.promo_redemptions(member_id, promo_id);

-- ------------------------------------------------------------------------------
-- 5. LIVE CUSTOMER SUPPORT CHAT TABLES (MISSING FROM CURRENT SCHEMA)
-- Required for: Admin <-> Customer Live Messaging Portal in Chat.tsx
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created 
  ON public.chat_messages(conversation_id, created_at);

-- ------------------------------------------------------------------------------
-- 6. STORAGE BUCKET: Files
-- Required for: Uploading payment receipt proofs (receipts/), return photos, product pictures
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('Files', 'Files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage bucket access policies
DO $$
BEGIN
  -- Public Read Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Access for Files Bucket'
  ) THEN
    CREATE POLICY "Public Access for Files Bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'Files');
  END IF;

  -- Public Insert/Upload Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Upload for Files Bucket'
  ) THEN
    CREATE POLICY "Public Upload for Files Bucket" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'Files');
  END IF;

  -- Public Update Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Update for Files Bucket'
  ) THEN
    CREATE POLICY "Public Update for Files Bucket" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'Files');
  END IF;
END $$;

-- Enable Realtime for live order, chat, and cart synchronization (if publications exist)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
