-- ==============================================================================
-- MIGRATION: JACOS OPEN HOUSE 2026 REGISTRATIONS & SETTINGS (DEDICATED LEADS)
-- ==============================================================================
-- Tabel ini berdiri sendiri dan TERISOLASI dari data siswa aktif (students)
-- dan pendaftaran online admission (applicants) untuk mempermudah follow up tim admission.

-- 1. TABEL PENDAFTARAN OPEN HOUSE (LEADS)
CREATE TABLE IF NOT EXISTS public.open_house_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(30) UNIQUE NOT NULL,
    
    -- Data Orang Tua / Wali
    parent_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Data Anak
    child_name TEXT NOT NULL,
    child_age INTEGER,
    target_program VARCHAR(50) NOT NULL, -- 'Kindergarten' | 'Primary School'
    entry_year VARCHAR(50) NOT NULL,     -- '2026' | '2027' | '2028' | 'Lainnya'
    
    -- Detail Kehadiran Open House
    interest_attendance VARCHAR(20) NOT NULL DEFAULT 'Ya', -- 'Ya' | 'Tidak'
    attendance_date TEXT,      -- 'Sabtu, 29 Agustus 2026' | 'Ahad, 30 Agustus 2026'
    attendance_session TEXT,   -- 'Session 1 (09.30 - 11.30)' | 'Session 2 (13.00 - 14.30)'
    
    -- Info Marketing & Minat
    source_info TEXT NOT NULL,           -- 'Instagram', 'TikTok', 'WhatsApp', dll
    topics_of_interest TEXT[] DEFAULT '{}', -- Array topik yang diminati
    admission_consultation VARCHAR(20) NOT NULL DEFAULT 'Ya', -- 'Ya' | 'Mungkin' | 'Tidak'
    
    -- Status Manajemen & Follow Up Tim Admission
    lead_status VARCHAR(50) NOT NULL DEFAULT 'NEW_LEAD',
    -- Status options: 'NEW_LEAD', 'CONFIRMED_ATTENDING', 'ATTENDED', 'FOLLOW_UP_PROGRESS', 'CONVERTED_TO_APPLICANT', 'NOT_INTERESTED'
    
    follow_up_notes TEXT,
    follow_up_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk pencarian cepat dan dashboard analitik
CREATE INDEX IF NOT EXISTS idx_open_house_ticket ON public.open_house_registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_open_house_lead_status ON public.open_house_registrations(lead_status);
CREATE INDEX IF NOT EXISTS idx_open_house_whatsapp ON public.open_house_registrations(whatsapp);
CREATE INDEX IF NOT EXISTS idx_open_house_created_at ON public.open_house_registrations(created_at DESC);

-- Enable RLS
ALTER TABLE public.open_house_registrations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Publik dapat mendaftarkan formulir (INSERT)
CREATE POLICY "Allow public insert to open_house_registrations"
ON public.open_house_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Publik dapat melihat tiket mereka sendiri via ticket_code (SELECT)
CREATE POLICY "Allow public view own ticket"
ON public.open_house_registrations
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 3: Admin & Manajemen dapat mengelola seluruh data
CREATE POLICY "Allow staff full access to open_house_registrations"
ON public.open_house_registrations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. TABEL PENGATURAN EVENT OPEN HOUSE (TOGGLE ON/OFF)
CREATE TABLE IF NOT EXISTS public.open_house_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    is_active BOOLEAN NOT NULL DEFAULT true,
    inactive_message TEXT DEFAULT 'Pendaftaran JACOS Open House saat ini sedang belum dibuka atau telah berakhir. Pantau terus akun media sosial resmi JACOS (@jacos.school) untuk informasi gelombang Open House berikutnya!',
    event_title TEXT DEFAULT 'JACOS OPEN HOUSE Primary & Kindergarten 2026',
    event_dates TEXT DEFAULT 'Sabtu, 29 Agustus 2026 & Ahad, 30 Agustus 2026',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.open_house_settings (id, is_active) 
VALUES ('default', true) 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.open_house_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read open_house_settings"
ON public.open_house_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow staff update open_house_settings"
ON public.open_house_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger auto update updated_at
CREATE OR REPLACE FUNCTION update_open_house_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_open_house_timestamp ON public.open_house_registrations;
CREATE TRIGGER tr_open_house_timestamp
BEFORE UPDATE ON public.open_house_registrations
FOR EACH ROW
EXECUTE FUNCTION update_open_house_timestamp();

COMMENT ON TABLE public.open_house_registrations IS 'Tabel prospek & peserta JACOS Open House untuk follow up tim Admission';
COMMENT ON TABLE public.open_house_settings IS 'Tabel konfigurasi event Open House & status toggle ON/OFF';
