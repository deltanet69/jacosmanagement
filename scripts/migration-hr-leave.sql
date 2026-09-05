-- ============================================================
-- MIGRATION: HR MANAGEMENT - LEAVE & CUTI (PERIZINAN)
-- FIX v2: RLS pakai auth.jwt()->'user_metadata'->>'role'
--         Trigger pakai $func$ quoting
-- ============================================================
-- Dependency: public.employees
-- Urutan eksekusi: 3
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. TABEL: hr_leave_types
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_leave_types (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    annual_quota  INTEGER NOT NULL DEFAULT 12,
    is_deductible BOOLEAN NOT NULL DEFAULT true,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE  public.hr_leave_types              IS 'Master jenis cuti yang bisa dikonfigurasi HR Admin';
COMMENT ON COLUMN public.hr_leave_types.annual_quota IS '0 = unlimited (e.g. Sakit)';

INSERT INTO public.hr_leave_types (name, annual_quota, is_deductible) VALUES
    ('Cuti Tahunan', 12, true),
    ('Sakit',         0, false),
    ('Izin Penting',  3, true),
    ('Dinas Luar',    0, false)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. TABEL: hr_leave_balances
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_leave_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_id   UUID NOT NULL REFERENCES public.hr_leave_types(id) ON DELETE CASCADE,
    year            SMALLINT NOT NULL,
    total_days      INTEGER NOT NULL DEFAULT 12,
    used_days       INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_leave_balance UNIQUE (employee_id, leave_type_id, year),
    CONSTRAINT chk_used_not_exceed CHECK (used_days >= 0)
);

COMMENT ON TABLE  public.hr_leave_balances           IS 'Saldo cuti per karyawan per tahun per jenis cuti';
COMMENT ON COLUMN public.hr_leave_balances.used_days IS 'Otomatis bertambah saat leave_request di-APPROVE';


-- ============================================================
-- 4. TABEL: hr_leave_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_id   UUID NOT NULL REFERENCES public.hr_leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      INTEGER NOT NULL,
    reason          TEXT,
    status          public.leave_status_enum NOT NULL DEFAULT 'PENDING',
    approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_date_range  CHECK (end_date >= start_date),
    CONSTRAINT chk_total_days  CHECK (total_days > 0)
);

COMMENT ON TABLE  public.hr_leave_requests        IS 'Permohonan cuti dan izin dari karyawan';
COMMENT ON COLUMN public.hr_leave_requests.notes  IS 'Catatan approver saat menyetujui atau menolak';


-- ============================================================
-- 5. TRIGGER: kurangi saldo cuti saat APPROVE, kembalikan saat REJECT
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_leave_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS
$func$
BEGIN
    IF OLD.status = 'PENDING' AND NEW.status = 'APPROVED' THEN
        UPDATE public.hr_leave_balances
        SET used_days = used_days + NEW.total_days
        WHERE employee_id   = NEW.employee_id
          AND leave_type_id = NEW.leave_type_id
          AND year          = EXTRACT(YEAR FROM NEW.start_date)::SMALLINT;
    END IF;

    IF OLD.status = 'APPROVED' AND NEW.status = 'REJECTED' THEN
        UPDATE public.hr_leave_balances
        SET used_days = GREATEST(0, used_days - OLD.total_days)
        WHERE employee_id   = OLD.employee_id
          AND leave_type_id = OLD.leave_type_id
          AND year          = EXTRACT(YEAR FROM OLD.start_date)::SMALLINT;
    END IF;

    RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS tr_leave_approval ON public.hr_leave_requests;
CREATE TRIGGER tr_leave_approval
AFTER UPDATE OF status ON public.hr_leave_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_leave_approval();

DROP TRIGGER IF EXISTS tr_leave_requests_timestamp ON public.hr_leave_requests;
CREATE TRIGGER tr_leave_requests_timestamp
BEFORE UPDATE ON public.hr_leave_requests
FOR EACH ROW EXECUTE FUNCTION public.update_hr_timestamp();


-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leave_req_employee ON public.hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_req_status   ON public.hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_req_dates    ON public.hr_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_req_created  ON public.hr_leave_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_balance_emp  ON public.hr_leave_balances(employee_id, year);


-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.hr_leave_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;

-- leave_types: HR Admin full; semua baca aktif
CREATE POLICY "hr_admin_full_leave_types"
ON public.hr_leave_types FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "authenticated_read_leave_types"
ON public.hr_leave_types FOR SELECT TO authenticated
USING (is_active = true);

-- leave_balances: HR Admin full; karyawan baca saldo sendiri
CREATE POLICY "hr_admin_full_leave_balances"
ON public.hr_leave_balances FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "employee_read_own_leave_balance"
ON public.hr_leave_balances FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- leave_requests: HR Admin + Kepala Sekolah full; karyawan CRUD milik sendiri
CREATE POLICY "hr_admin_full_leave_requests"
ON public.hr_leave_requests FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN', 'KEPALA_SEKOLAH'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN', 'KEPALA_SEKOLAH'));

CREATE POLICY "employee_manage_own_leave"
ON public.hr_leave_requests FOR ALL TO authenticated
USING  (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
