/**
 * In-memory fallback store for Open House registrations & settings.
 * This file intentionally has NO 'use server' directive so it can
 * export plain objects/arrays (required by Next.js use server rule).
 * Both management/openhouse/actions.ts and (public)/openhouse/actions.ts
 * import from here.
 */

export interface OpenHouseLead {
  id: string;
  ticket_code: string;
  parent_name: string;
  whatsapp: string;
  email: string;
  child_name: string;
  child_age: number | null;
  target_program: string;
  entry_year: string;
  interest_attendance: string;
  attendance_date: string;
  attendance_session: string;
  source_info: string;
  topics_of_interest: string[];
  admission_consultation: string;
  lead_status: 'NEW_LEAD' | 'CONFIRMED_ATTENDING' | 'ATTENDED' | 'FOLLOW_UP_PROGRESS' | 'CONVERTED_TO_APPLICANT' | 'NOT_INTERESTED' | string;
  follow_up_notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenHouseSetting {
  id: string;
  is_active: boolean;
  inactive_message: string;
  event_title: string;
  event_dates: string;
  updated_at: string;
}

const globalForOpenHouse = globalThis as unknown as {
  memoryRegistrations: OpenHouseLead[];
  memorySetting: OpenHouseSetting;
};

if (!globalForOpenHouse.memoryRegistrations) {
  globalForOpenHouse.memoryRegistrations = [];
}

if (!globalForOpenHouse.memorySetting) {
  globalForOpenHouse.memorySetting = {
    id: 'default',
    is_active: true,
    inactive_message:
      'Pendaftaran JACOS Open House saat ini sedang belum dibuka atau telah berakhir. Pantau terus akun media sosial resmi JACOS (@jacos.school) untuk informasi gelombang Open House berikutnya!',
    event_title: 'JACOS OPEN HOUSE Primary & Kindergarten 2026',
    event_dates: 'Sabtu, 29 Agustus 2026 & Ahad, 30 Agustus 2026',
    updated_at: new Date().toISOString(),
  };
}

export const memoryRegistrations = globalForOpenHouse.memoryRegistrations;
export const memorySetting = globalForOpenHouse.memorySetting;
export { globalForOpenHouse };
