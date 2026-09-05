-- ============================================================
-- MIGRATION: HR MANAGEMENT - KPI
-- FIX v2: RLS pakai auth.jwt()->'user_metadata'->>'role'
--         Trigger pakai $func$ quoting
-- ============================================================
-- Dependency: public.employees
-- Urutan eksekusi: 4
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.kpi_employee_type_enum AS ENUM ('GURU', 'STAF', 'SEMUA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.kpi_period_type_enum AS ENUM ('BULANAN', 'TAHUNAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. TABEL: hr_kpi_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_kpi_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    employee_type public.kpi_employee_type_enum NOT NULL DEFAULT 'SEMUA',
    period_type   public.kpi_period_type_enum   NOT NULL DEFAULT 'TAHUNAN',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.hr_kpi_templates IS 'Template KPI — daftar indikator penilaian per tipe karyawan';


-- ============================================================
-- 3. TABEL: hr_kpi_indicators
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_kpi_indicators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.hr_kpi_templates(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    weight      NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    max_score   SMALLINT     NOT NULL DEFAULT 5,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

COMMENT ON TABLE  public.hr_kpi_indicators        IS 'Indikator penilaian dalam satu template KPI';
COMMENT ON COLUMN public.hr_kpi_indicators.weight IS 'Bobot persen — total per template harus = 100';


-- ============================================================
-- 4. TABEL: hr_kpi_assessments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_kpi_assessments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.hr_kpi_templates(id),
    period      VARCHAR(10) NOT NULL,
    total_score NUMERIC(5,2),
    assessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    notes       TEXT,
    CONSTRAINT uq_kpi_assessment UNIQUE (employee_id, template_id, period)
);

COMMENT ON TABLE  public.hr_kpi_assessments            IS 'Hasil penilaian KPI per karyawan per periode';
COMMENT ON COLUMN public.hr_kpi_assessments.period     IS 'Format: 2026 | 2026-01 | 2026-S1';
COMMENT ON COLUMN public.hr_kpi_assessments.total_score IS 'Score 0-100, weighted average dari semua indikator';


-- ============================================================
-- 5. TABEL: hr_kpi_scores
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_kpi_scores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.hr_kpi_assessments(id) ON DELETE CASCADE,
    indicator_id  UUID NOT NULL REFERENCES public.hr_kpi_indicators(id) ON DELETE CASCADE,
    score         SMALLINT NOT NULL,
    CONSTRAINT uq_kpi_score     UNIQUE (assessment_id, indicator_id),
    CONSTRAINT chk_score_min    CHECK (score >= 1)
);

COMMENT ON TABLE public.hr_kpi_scores IS 'Score per indikator dalam satu assessment KPI';


-- ============================================================
-- 6. TRIGGER: hitung total_score setelah score diisi
-- Formula: SUM(score/max_score * weight) => 0-100
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_kpi_total_score()
RETURNS TRIGGER LANGUAGE plpgsql AS
$func$
DECLARE
    v_assessment_id UUID;
BEGIN
    -- Tentukan assessment_id dari row yang berubah
    IF TG_OP = 'DELETE' THEN
        v_assessment_id := OLD.assessment_id;
    ELSE
        v_assessment_id := NEW.assessment_id;
    END IF;

    -- Hitung weighted average score (0-100)
    -- Pakai subquery assignment, bukan SELECT INTO (hindari mis-parse SQL Editor)
    UPDATE public.hr_kpi_assessments
    SET total_score = (
        SELECT COALESCE(
            SUM((ks.score::NUMERIC / ki.max_score::NUMERIC) * ki.weight),
            0
        )
        FROM public.hr_kpi_scores ks
        JOIN public.hr_kpi_indicators ki ON ki.id = ks.indicator_id
        WHERE ks.assessment_id = v_assessment_id
    )
    WHERE id = v_assessment_id;

    -- Trigger return: OLD untuk DELETE, NEW untuk INSERT/UPDATE
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$func$;


DROP TRIGGER IF EXISTS tr_kpi_score_calculate ON public.hr_kpi_scores;
CREATE TRIGGER tr_kpi_score_calculate
AFTER INSERT OR UPDATE OR DELETE ON public.hr_kpi_scores
FOR EACH ROW EXECUTE FUNCTION public.calculate_kpi_total_score();


-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_kpi_assess_employee ON public.hr_kpi_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_assess_period   ON public.hr_kpi_assessments(period);
CREATE INDEX IF NOT EXISTS idx_kpi_assess_score    ON public.hr_kpi_assessments(total_score);
CREATE INDEX IF NOT EXISTS idx_kpi_assess_template ON public.hr_kpi_assessments(template_id);
CREATE INDEX IF NOT EXISTS idx_kpi_indic_tmpl      ON public.hr_kpi_indicators(template_id);
CREATE INDEX IF NOT EXISTS idx_kpi_scores_assess   ON public.hr_kpi_scores(assessment_id);


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.hr_kpi_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_kpi_indicators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_kpi_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_kpi_scores      ENABLE ROW LEVEL SECURITY;

-- templates
CREATE POLICY "hr_admin_full_kpi_templates"
ON public.hr_kpi_templates FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "authenticated_read_kpi_templates"
ON public.hr_kpi_templates FOR SELECT TO authenticated
USING (is_active = true);

-- indicators
CREATE POLICY "hr_admin_full_kpi_indicators"
ON public.hr_kpi_indicators FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "authenticated_read_kpi_indicators"
ON public.hr_kpi_indicators FOR SELECT TO authenticated
USING (true);

-- assessments: HR Admin full; Kepala Sekolah baca semua; karyawan baca sendiri
CREATE POLICY "hr_admin_full_kpi_assessments"
ON public.hr_kpi_assessments FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "kepala_sekolah_read_assessments"
ON public.hr_kpi_assessments FOR SELECT TO authenticated
USING ((auth.jwt()->'user_metadata'->>'role') = 'KEPALA_SEKOLAH');

CREATE POLICY "employee_read_own_assessment"
ON public.hr_kpi_assessments FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- scores: ikuti assessment
CREATE POLICY "hr_admin_full_kpi_scores"
ON public.hr_kpi_scores FOR ALL TO authenticated
USING  ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'))
WITH CHECK ((auth.jwt()->'user_metadata'->>'role') IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "employee_read_own_scores"
ON public.hr_kpi_scores FOR SELECT TO authenticated
USING (
    assessment_id IN (
        SELECT a.id FROM public.hr_kpi_assessments a
        JOIN public.employees e ON e.id = a.employee_id
        WHERE e.user_id = auth.uid()
    )
);
