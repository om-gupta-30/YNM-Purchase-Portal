-- YNM Purchase Portal - Database Schema Migration
-- Run this SQL in your Supabase SQL Editor to add missing columns

-- =============================================
-- PRODUCTS TABLE
-- =============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'm',
ADD COLUMN IF NOT EXISTS specifications TEXT DEFAULT '';

-- =============================================
-- MANUFACTURERS TABLE  
-- =============================================
ALTER TABLE manufacturers
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_designation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gst_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS products_offered JSONB DEFAULT '[]'::jsonb;

-- =============================================
-- IMPORTERS TABLE
-- =============================================
ALTER TABLE importers
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS iec_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_designation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS products_imported JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS countries_importing_from TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =============================================
-- DEALERS TABLE
-- =============================================
ALTER TABLE dealers
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'Dealer',
ADD COLUMN IF NOT EXISTS gst_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pan_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS establishment_year TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pin_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS territory_covered TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_designation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS products_offered JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS agreement_start_date DATE,
ADD COLUMN IF NOT EXISTS agreement_end_date DATE;

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS pin_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gst_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pan_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS credit_limit TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- =============================================
-- VERIFY COLUMNS WERE ADDED
-- =============================================
-- Run these queries to verify columns exist:

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'manufacturers';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'importers';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dealers';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers';
