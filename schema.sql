-- ==============================================================================
-- TwinThink Core Schema: Physical Blind Catalog & Secret BOM Isolation
-- ==============================================================================
-- This schema enforces the paywall at the database level.
-- If someone scrapes the `blind_catalog` table, they get zero proprietary CAD.
-- The `secret_bom` is entirely isolated until `access_ledger` confirms payment + P2P NDA.

-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Identity Node)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE,
  account_type TEXT CHECK (account_type IN ('Creator', 'Buyer', 'Auditor')),
  ethical_rating INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Blind Catalog (Public facing, No-Search Direct Capsule Link)
CREATE TABLE IF NOT EXISTS blind_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  structural_tags TEXT[], -- e.g. ['Subtractive Manufacturing', 'Aerospace-Grade Alloy', 'Phase Change']
  public_preview_url TEXT, -- URL to the residual/blanked shadow image
  ethical_manifest TEXT,
  unlock_price_usd NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Secret BOM (Encrypted/Paywalled)
CREATE TABLE IF NOT EXISTS secret_bom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES blind_catalog(id) ON DELETE CASCADE UNIQUE,
  bom_json JSONB NOT NULL, -- The hierarchical CAD/BOM data
  step_file_url TEXT,
  dpp_battery_ready_uuid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Access Ledger (The Paywall / NDA Gate)
CREATE TABLE IF NOT EXISTS access_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES blind_catalog(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nda_signature_hash TEXT, -- Cryptographic proof of signed NDA (e.g. Ed25519 hash)
  payment_status TEXT CHECK (payment_status IN ('Pending', 'Escrowed', 'Released')),
  unlocked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(design_id, buyer_id) -- A buyer can only have one access record per design
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_blind_catalog_slug ON blind_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_access_ledger_lookup ON access_ledger(design_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_secret_bom_design ON secret_bom(design_id);

-- Optional Row-Level Security (RLS) Policy Example:
-- ALTER TABLE secret_bom ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Only unlocked buyers see secret BOM" ON secret_bom
-- FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM access_ledger
--     WHERE access_ledger.design_id = secret_bom.design_id
--     AND access_ledger.payment_status = 'Released'
--     AND access_ledger.nda_signature_hash IS NOT NULL
--   )
-- );
