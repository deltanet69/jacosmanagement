-- ==============================================================================
-- MIGRATION: ADD HEIGHT, WEIGHT & PARENT INCOME TO ADMISSION / APPLICANTS
-- ==============================================================================
-- Salin dan jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Tambahkan kolom height & weight pada tabel applicants
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS height NUMERIC DEFAULT NULL;

ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT NULL;

-- 2. Tambahkan kolom monthly_income pada tabel guardians
ALTER TABLE public.guardians 
ADD COLUMN IF NOT EXISTS monthly_income VARCHAR(100) DEFAULT NULL;

-- 3. Beri komentar deskripsi pada kolom baru
COMMENT ON COLUMN public.applicants.height IS 'Tinggi badan calon siswa dalam cm';
COMMENT ON COLUMN public.applicants.weight IS 'Berat badan calon siswa dalam kg';
COMMENT ON COLUMN public.guardians.monthly_income IS 'Rentang penghasilan bulanan orang tua / wali';
