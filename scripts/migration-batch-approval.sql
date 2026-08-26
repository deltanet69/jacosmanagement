-- ==============================================================================
-- MIGRATION: ADD BATCH SUPPORT FOR ADMISSION APPROVAL
-- ==============================================================================
-- Salin dan jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Tambahkan kolom batch pada tabel applicants (jika belum ada)
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS batch VARCHAR(50) DEFAULT NULL;

-- 2. Tambahkan kolom batch pada tabel students (jika belum ada)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS batch VARCHAR(50) DEFAULT NULL;

-- 3. Opsional: Buat index untuk mempercepat query filter batch
CREATE INDEX IF NOT EXISTS idx_applicants_batch ON public.applicants(batch);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);

-- 4. Beri komentar pada kolom
COMMENT ON COLUMN public.applicants.batch IS 'Menyimpan batch approval pendaftaran (contoh: BATCH_1, BATCH_2, BATCH_3)';
COMMENT ON COLUMN public.students.batch IS 'Menyimpan batch pendaftaran siswa (contoh: BATCH_1, BATCH_2, BATCH_3)';
