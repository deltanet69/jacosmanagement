-- ============================================================
-- MIGRATION: HR MANAGEMENT - PENGUMUMAN HR
-- FIX v2: RLS pakai auth.jwt()->'user_metadata'->>'role'
-- ============================================================
-- Dependency: public.profiles, public.employees
-- Urutan eksekusi: 2
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.announcement_category_enum AS ENUM (
        'KEBIJAKAN_BARU', 'INFO_CUTI', 'EVENT', 'PENTING', 'LAINNYA'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. TABEL: hr_announcements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    category        public.announcement_category_enum NOT NULL DEFAULT 'LAINNYA',
    content         TEXT NOT NULL,
    is_important    BOOLEAN NOT NULL DEFAULT false,
    target          TEXT[] NOT NULL DEFAULT '{SEMUA}',
    attachment_url  TEXT,
    is_archived     BOOLEAN NOT NULL DEFAULT false,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  public.hr_announcements              IS 'Pengumuman internal HR untuk seluruh karyawan JACOS';
COMMENT ON COLUMN public.hr_announcements.target       IS 'Array target: SEMUA | GURU | STAF | HR_ADMIN';
COMMENT ON COLUMN public.hr_announcements.is_important IS 'true = trigger notifikasi email + in-app';


-- ============================================================
-- 3. TABEL: hr_announcement_reads
-- Composite PK, tidak butuh kolom id terpisah
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_announcement_reads (
    announcement_id UUID NOT NULL REFERENCES public.hr_announcements(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (announcement_id, employee_id)
);

COMMENT ON TABLE public.hr_announcement_reads IS 'Tracking status baca pengumuman per karyawan';


-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ann_category   ON public.hr_announcements(category);
CREATE INDEX IF NOT EXISTS idx_ann_important  ON public.hr_announcements(is_important);
CREATE INDEX IF NOT EXISTS idx_ann_active     ON public.hr_announcements(is_deleted, is_archived);
CREATE INDEX IF NOT EXISTS idx_ann_created_at ON public.hr_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ann_reads_emp  ON public.hr_announcement_reads(employee_id);


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.hr_announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_announcement_reads ENABLE ROW LEVEL SECURITY;

-- HR Admin: full CRUD
CREATE POLICY "hr_admin_full_announcements"
ON public.hr_announcements FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

-- Semua authenticated: baca pengumuman aktif
CREATE POLICY "authenticated_read_announcements"
ON public.hr_announcements FOR SELECT TO authenticated
USING (is_deleted = false AND is_archived = false);

-- HR Admin: full akses reads (untuk lihat siapa yang sudah baca)
CREATE POLICY "hr_admin_full_reads"
ON public.hr_announcement_reads FOR ALL TO authenticated
USING ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

-- Karyawan: kelola status baca milik sendiri
CREATE POLICY "employee_manage_own_reads"
ON public.hr_announcement_reads FOR ALL TO authenticated
USING  (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));


-- ============================================================
-- 6. TRIGGER: auto-update updated_at
-- Reuse update_hr_timestamp() dari migration-hr-employees.sql
-- ============================================================

DROP TRIGGER IF EXISTS tr_announcements_timestamp ON public.hr_announcements;
CREATE TRIGGER tr_announcements_timestamp
BEFORE UPDATE ON public.hr_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_hr_timestamp();


-- ============================================================
-- 7. STORAGE BUCKET (buat manual di Supabase Dashboard > Storage)
-- ============================================================
-- Bucket: hr-announcements | Private | max 5MB | PDF, JPG, PNG
