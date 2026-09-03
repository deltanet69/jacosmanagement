-- ==============================================================================
-- MIGRATION: ADD PAYMENT PROOF SUPPORT TO APPLICANTS
-- ==============================================================================
-- Salin dan jalankan script ini di Supabase SQL Editor jika diperlukan:
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS doc_payment_proof TEXT DEFAULT NULL;

COMMENT ON COLUMN public.applicants.doc_payment_proof IS 'Path berkas bukti transfer pendaftaran jalur public online admission';
