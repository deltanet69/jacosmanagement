/**
 * In-memory fallback store for Guestbook (Buku Tamu) entries.
 * Resilient cache layer if local Supabase table is not yet migrated.
 */

export interface GuestbookEntry {
  id: string;
  visit_code: string;
  parent_name: string;
  whatsapp: string;
  email: string;
  province_id?: string | null;
  province_name?: string | null;
  regency_id?: string | null;
  regency_name?: string | null;
  district_id?: string | null;
  district_name?: string | null;
  village_id?: string | null;
  village_name?: string | null;
  postal_code?: string | null;
  address_detail?: string | null;
  child_name?: string | null;
  child_age?: number | null;
  target_grade?: string | null;
  visit_date?: string | null;
  visit_time?: string | null;
  visit_purpose?: string | null;
  source_info?: string | null;
  notes?: string | null;
  follow_up_status: 'BELUM_FOLLOW_UP' | 'SUDAH_FOLLOW_UP' | string;
  follow_up_notes?: string | null;
  followed_up_at?: string | null;
  followed_up_by?: string | null;
  created_at: string;
  updated_at: string;
}

const globalForGuestbook = globalThis as unknown as {
  memoryGuestbook: GuestbookEntry[];
};

if (!globalForGuestbook.memoryGuestbook) {
  globalForGuestbook.memoryGuestbook = [
    {
      id: "guest-sample-1",
      visit_code: "JCS-VISIT-2026-0812",
      parent_name: "Bunda Rina Sasmita",
      whatsapp: "6281234567890",
      email: "rina.sasmita@gmail.com",
      province_id: "31",
      province_name: "DKI JAKARTA",
      regency_id: "3175",
      regency_name: "KOTA JAKARTA TIMUR",
      district_id: "3175060",
      district_name: "DUREN SAWIT",
      village_id: "3175060002",
      village_name: "PONDOK KELAPA",
      postal_code: "13450",
      address_detail: "Jl. Kelapa Sawit Raya Blok F No. 12, Kavling DKI",
      child_name: "Arkan Malik",
      child_age: 4,
      target_grade: "Kindergarten A (TK A)",
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: "09:30 WIB",
      visit_purpose: "School visit",
      source_info: "Instagram JACOS (@jacos.school)",
      notes: "Tertarik dengan kelas bahasa Arab & Inggris sejak dini",
      follow_up_status: "BELUM_FOLLOW_UP",
      follow_up_notes: null,
      followed_up_at: null,
      followed_up_by: null,
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: "guest-sample-2",
      visit_code: "JCS-VISIT-2026-0815",
      parent_name: "Ayah Hendra Pratama",
      whatsapp: "6281987654321",
      email: "hendra.pratama@outlook.com",
      province_id: "32",
      province_name: "JAWA BARAT",
      regency_id: "3275",
      regency_name: "KOTA BEKASI",
      district_id: "3275030",
      district_name: "BEKASI BARAT",
      village_id: "3275030001",
      village_name: "KRANJI",
      postal_code: "17135",
      address_detail: "Grand Galaxy City Blok RG No. 22",
      child_name: "Zahra Salsabila",
      child_age: 6,
      target_grade: "Primary Grade 1 (SD Kelas 1)",
      visit_date: new Date().toISOString().split("T")[0],
      visit_time: "11:00 WIB",
      visit_purpose: "Admission",
      source_info: "Rekomendasi Keluarga / Teman",
      notes: "Menanyakan fasilitas lab komputer dan ekstrakurikuler tahfidz",
      follow_up_status: "SUDAH_FOLLOW_UP",
      follow_up_notes: "Sudah dihubungi via WA, diundang trial class hari Sabtu",
      followed_up_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      followed_up_by: "Admin Admisi",
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    }
  ];
}

export const memoryGuestbook = globalForGuestbook.memoryGuestbook;
export { globalForGuestbook };
