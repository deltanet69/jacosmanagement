-- ============================================================
-- MIGRATION: HR MANAGEMENT - EMPLOYEES (DATA GURU & STAF)
-- FIX v2: RLS pakai auth.jwt()->'user_metadata'->>'role'
--         Trigger pakai $func$ bukan $$ (hindari konflik)
-- ============================================================
-- Urutan eksekusi: 1 (base, no HR deps)
-- ============================================================

-- 1. ENUMS (idempotent)

DO $$ BEGIN
    CREATE TYPE public.employee_type_enum AS ENUM ('GURU', 'STAF', 'KARYAWAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.contract_status_enum AS ENUM ('PROBATION', 'TETAP', 'KONTRAK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.employee_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.gender_enum AS ENUM ('LAKI_LAKI', 'PEREMPUAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.religion_enum AS ENUM ('ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.doc_type_enum AS ENUM ('KTP', 'NPWP', 'IJAZAH', 'SERTIFIKAT', 'FOTO_PROFIL', 'LAINNYA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. TABEL UTAMA: employees
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nik               VARCHAR(50) UNIQUE NOT NULL,
    full_name         TEXT NOT NULL,
    birth_place       TEXT,
    birth_date        DATE,
    gender            public.gender_enum,
    religion          public.religion_enum,
    address           TEXT,
    phone             VARCHAR(20),
    email             TEXT UNIQUE NOT NULL,
    photo_url         TEXT,
    employee_type     public.employee_type_enum    NOT NULL DEFAULT 'STAF',
    contract_status   public.contract_status_enum  NOT NULL DEFAULT 'PROBATION',
    position          TEXT,
    join_date         DATE NOT NULL,
    contract_end_date DATE,
    status            public.employee_status_enum  NOT NULL DEFAULT 'ACTIVE',
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  public.employees                   IS 'Data master seluruh guru, staf, dan karyawan JACOS';
COMMENT ON COLUMN public.employees.nik               IS 'Nomor Induk Karyawan internal, format: JACOS-001';
COMMENT ON COLUMN public.employees.contract_end_date IS 'NULL = karyawan tetap; isi untuk PROBATION/KONTRAK';


-- ============================================================
-- 3. TABEL: employee_subjects
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_subjects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    subject_name  TEXT NOT NULL,
    class_level   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.employee_subjects IS 'Mata pelajaran yang diampu guru — one to many';


-- ============================================================
-- 4. TABEL: employee_homeroom
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_homeroom (
    employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    class_name    TEXT NOT NULL,
    school_year   VARCHAR(10) NOT NULL,
    PRIMARY KEY (employee_id, school_year)
);

COMMENT ON TABLE public.employee_homeroom IS 'Wali kelas per tahun ajaran — 1 guru max 1 kelas per tahun';


-- ============================================================
-- 5. TABEL: employee_documents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    doc_type        public.doc_type_enum NOT NULL,
    file_name       TEXT,
    file_url        TEXT NOT NULL,
    file_size_bytes INTEGER,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.employee_documents IS 'Dokumen karyawan — Storage bucket: employee-docs';


-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_nik          ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_email        ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_type_status  ON public.employees(employee_type, status);
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted   ON public.employees(is_deleted);
CREATE INDEX IF NOT EXISTS idx_employees_user_id      ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_contract_end ON public.employees(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_emp_subjects_employee  ON public.employee_subjects(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_docs_employee      ON public.employee_documents(employee_id);


-- ============================================================
-- 7. ROW LEVEL SECURITY
-- Baca role dari JWT metadata supaya tidak bergantung pada
-- tipe kolom profiles.role (bisa enum atau text)
-- auth.jwt()->'user_metadata'->>'role'
-- ============================================================

ALTER TABLE public.employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_subjects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_homeroom  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- employees
CREATE POLICY "hr_admin_full_employees"
ON public.employees FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "kepala_sekolah_read_employees"
ON public.employees FOR SELECT TO authenticated
USING ((auth.jwt()->'user_metadata'->>'role') = 'KEPALA_SEKOLAH');

CREATE POLICY "employee_read_own_profile"
ON public.employees FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- employee_subjects
CREATE POLICY "hr_admin_full_subjects"
ON public.employee_subjects FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "employee_read_own_subjects"
ON public.employee_subjects FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- employee_homeroom
CREATE POLICY "hr_admin_full_homeroom"
ON public.employee_homeroom FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "employee_read_own_homeroom"
ON public.employee_homeroom FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- employee_documents
CREATE POLICY "hr_admin_full_docs"
ON public.employee_documents FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "employee_read_own_docs"
ON public.employee_documents FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));


-- ============================================================
-- 8. TRIGGER: auto-update updated_at
-- Pakai $func$ bukan $$ supaya tidak konflik dengan DO $$ block
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_hr_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS
$func$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS tr_employees_timestamp ON public.employees;
CREATE TRIGGER tr_employees_timestamp
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_hr_timestamp();


-- ============================================================
-- 9. STORAGE BUCKETS (buat manual: Supabase Dashboard > Storage)
-- ============================================================
-- Bucket: employee-docs   | Private | max 5MB | PDF, JPG, PNG
-- Bucket: employee-photos | Public  | max 2MB | JPG, PNG, WEBP
