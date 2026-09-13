# 📊 AUDIT & DOKUMENTASI DATABASE JACOS (Jakarta Cosmopolite Islamic School)

Dokumen ini berisi audit lengkap dan menyeluruh terhadap seluruh struktur basis data (database), tabel, relasi, peruntukan fungsional, analisis keamanan (Row Level Security & Autentikasi), serta identifikasi tabel *legacy* / tidak terpakai pada sistem **JACOS Management & Parent Portal**.

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Arsitektur Database](#1-ringkasan-eksekutif--arsitektur-database)
2. [Arsitektur Keamanan & Autentikasi (Security Model)](#2-arsitektur-keamanan--autentikasi-security-model)
3. [Daftar Lengkap Tabel Berdasarkan Modul / Domain](#3-daftar-lengkap-tabel-berdasarkan-modul--domain)
   - [A. Domain Core Identity & Autentikasi](#a-domain-core-identity--autentikasi)
   - [B. Domain PPDB & Online Admission](#b-domain-ppdb--online-admission)
   - [C. Domain Manajemen Kesiswaan (Student Master)](#c-domain-manajemen-kesiswaan-student-master)
   - [D. Domain Akademik, Kelas & Absensi Siswa](#d-domain-akademik-kelas--absensi-siswa)
   - [E. Domain Operasional Penjemputan Digital (Digital Pickup)](#e-domain-operasional-penjemputan-digital-digital-pickup)
   - [F. Domain Human Resource & Kepegawaian (HR Management)](#f-domain-human-resource--kepegawaian-hr-management)
   - [G. Domain Informasi, Kegiatan & Open House](#g-domain-informasi-kegiatan--open-house)
4. [Supabase Storage Buckets & Keamanan Berkas](#4-supabase-storage-buckets--keamanan-berkas)
5. [Audit Tabel Kosong / Legacy / Potensi Tidak Terpakai](#5-audit-tabel-kosong--legacy--potensi-tidak-terpakai)
6. [Rekomendasi Pemeliharaan & Optimalisasi](#6-rekomendasi-pemeliharaan--optimalisasi)

---

## 1. Ringkasan Eksekutif & Arsitektur Database

* **Platform Database**: PostgreSQL (Hosted on Supabase)
* **Mode Akses**:
  1. **Browser Client (Anon Key)**: Mengakses data via session cookie terisolasi dengan Row Level Security (RLS).
  2. **Server Actions (Service Role Key)**: Bypasses RLS untuk operasi sistem terverifikasi, batch process, pendaftaran publik, dan sinkronisasi antar entitas.
* **Jumlah Tabel Teridentifikasi**: 30+ Tabel Utama
* **Storage Buckets**: 3 Buckets (`admission-documents`, `openhouse-banners`, `announcement-thumbnails`)

---

## 2. Arsitektur Keamanan & Autentikasi (Security Model)

### 2.1. Dual-Session Cookie Isolation
Sistem JACOS menerapkan pemisahan token autentikasi antara Admin/Guru dan Orang Tua untuk mencegah *session leakage* atau eskalasi hak akses:
* **Admin / Staf Portal**: Disimpan pada cookie `sb-admin-auth-token`.
* **Parent Portal**: Disimpan pada cookie `sb-parent-auth-token`.

### 2.2. Hirarki Hak Akses (Role-Based Access Control)
* `SUPERADMIN` / `ADMIN`: Akses penuh terhadap seluruh konfigurasi, master data siswa, admisi, keuangan, dan pengaturan.
* `HR` / `KEPEGAWAIAN`: Akses modul karyawan, payroll, perizinan cuti, absensi staf, dan klaim reimburse.
* `TEACHER` / `GURU`: Akses kelas, input absensi harian siswa, posting agenda/kegiatan kelas, dan informasi siswa kelas binaannya.
* `PARENT` / `ORANG TUA`: Akses terisolasi hanya untuk melihat profil anaknya sendiri, jadwal kelas anak, QR code penjemputan, status dokumen persetujuan (*Declaration Agreement*), dan pengumuman sekolah.
* `SECURITY` / `PETUGAS LOBBY`: Akses scanner QR penjemputan dan monitor TV antrian lobby.

### 2.3. Lapisan Pertahanan Data
1. **Row Level Security (RLS)**: Diaktifkan pada tabel kependudukan dan privasi (misal: `applicants`, `guardians`, `documents`, `profiles`).
2. **Server-Side Validation**: Seluruh transaksi sensitif (seperti approve admisi, create user login, update status dokumen) diproteksi di lapisan Next.js Server Actions dengan verifikasi server role.

---

## 3. Daftar Lengkap Tabel Berdasarkan Modul / Domain

---

### A. Domain Core Identity & Autentikasi

#### 1. `auth.users` (Supabase Internal)
* **Fungsi**: Tabel inti autentikasi bawaan Supabase yang mengelola email, kata sandi terenkripsi (bcrypt), email confirmation, dan `raw_user_meta_data`.
* **Penggunaan**:
  * Menyimpan metadata seperti `role` (`ADMIN`, `PARENT`, `TEACHER`), `full_name`, `admission_status`, `applicant_id`, `student_id`, dan flag `first_login`.
* **Keamanan**: Diproteksi langsung oleh *Auth Engine* Supabase. Kata sandi tidak dapat dibaca oleh admin sekalipun.

#### 2. `profiles`
* **Fungsi**: Menyimpan profil publik/aplikasi yang berelasi 1:1 dengan `auth.users(id)`.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK, References `auth.users.id` ON DELETE CASCADE)
  * `full_name` (text, not null)
  * `role` (enum: `PARENT`, `ADMIN`, `TEACHER`, `PRINCIPAL`)
  * `created_at` (timestamptz)
* **Keamanan (RLS)**:
  * User hanya dapat membaca profil mereka sendiri.
  * Staf (`is_staff()`) dapat membaca profil untuk kebutuhan verifikasi.

---

### B. Domain PPDB & Online Admission

#### 3. `applicants`
* **Fungsi**: Tabel sentral untuk menampung seluruh formulir pendaftaran calon siswa baru dari form publik maupun direct admin.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `registration_no` (text, unique, format: `JCS-2026-XXXXX`)
  * `student_name` (text, not null)
  * `birth_place`, `birth_date`, `gender` (enum)
  * `program` (`PRIMARY_SCHOOL`, `KINDERGARTEN`, `PRESCHOOL`)
  * `category` (`NEW_STUDENT`, `TRANSFER_STUDENT`)
  * `nisn`, `nik`, `address`, `religion`, `nationality`
  * `status` (enum: `SUBMITTED`, `UNDER_REVIEW`, `TRIAL_SCHEDULED`, `ACCEPTED`, `REJECTED`, `ENROLLED`)
  * `batch` (text, misal: `BATCH_1`, `BATCH_2`)
  * `student_record_id` (uuid, foreign key opsional ke `students.id` saat siswa resmi diterima/enrolled)
  * **Kolom Dokumen & Bukti Bayar**:
    * `transfer_receipt_url` (text, bukti transfer pendaftaran)
    * `transfer_receipt_status` (`PENDING`, `VERIFIED`, `REJECTED`)
    * `doc_jacos_agreement`, `doc_jacos_agreement_status`, `doc_jacos_agreement_note`
    * `doc_photo_4x3`, `doc_birth_certificate`, `doc_family_card`, `doc_immunization_card`, `doc_parent_id`, `doc_previous_report`
* **Operasi di Aplikasi**:
  * Insert: Pendaftaran online publik (`/onlineadmission`, `/ppdb/daftar`, `/reg/[token]`).
  * Update: Verifikasi berkas, perubahan status pendaftaran, approval oleh Admin/TU.
* **Keamanan**:
  * RLS enabled: Parent hanya bisa melihat berkas yang mereka daftarkan (`created_by = auth.uid()`).
  * Admin / Staff memiliki hak `UPDATE` seluruh status admisi.

#### 4. `guardians`
* **Fungsi**: Menyimpan data orang tua / wali yang terikat dengan pendaftaran calon siswa.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `applicant_id` (uuid, References `applicants.id` ON DELETE CASCADE)
  * `full_name`, `relation` (`FATHER`, `MOTHER`, `GUARDIAN`)
  * `email`, `phone` (WhatsApp)
  * `occupation`, `education_level`, `address`
* **Keamanan**:
  * RLS enabled via relasi `applicants`. Akses dibatasi pada pemilik berkas atau staf sekolah.

#### 5. `documents` (Sub-modul Lampiran)
* **Fungsi**: Penyimpanan terstruktur multi-dokumen (PDF/Gambar) lampiran admisi dengan status review individual.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `applicant_id` (uuid, References `applicants.id` ON DELETE CASCADE)
  * `type` (`FAMILY_CARD`, `BIRTH_CERTIFICATE`, `PHOTO_4X3`, `PHOTO_2X3`, `JACOS_AGREEMENT`)
  * `file_url`, `verification` (`PENDING`, `VERIFIED`, `REJECTED`), `review_note`
* **Keamanan**: Disimpan di private storage bucket `admission-documents`. Hanya bisa dibuka via signed URL berdurasi terbatas.

---

### C. Domain Manajemen Kesiswaan (Student Master)

#### 6. `students`
* **Fungsi**: Master data resmi seluruh siswa aktif yang terdaftar di Jakarta Cosmopolite Islamic School.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `nis` (Nomor Induk Siswa), `nisn`
  * `full_name`, `gender`, `birth_date`, `birth_place`
  * `program`, `class_id` (References `school_classes.id`)
  * `applicant_id` (References `applicants.id`, relasi balik ke data pendaftaran awal)
  * `is_active` (boolean, default: `true`)
  * `profile_picture` (text URL)
  * `address`, `religion`
* **Operasi di Aplikasi**:
  * Ditampilkan di menu *Kesiswaan > Data Siswa*, *Rekap Absensi*, *Papan Penjemputan*, dan *Parent Portal*.
* **Keamanan**:
  * Hanya admin/guru yang dapat mengubah data master siswa.
  * Parent hanya dapat melihat data siswa miliknya yang diidentifikasi melalui session metadata atau email guardian.

#### 7. `school_classes`
* **Fungsi**: Menyimpan data ruang kelas / rombel (romongan belajar).
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `name` (misal: `Kelas 1A`, `Kelas 1B`, `Preschool Alpha`)
  * `grade` (integer / text, misal: `1`, `2`, `Preschool`)
  * `academic_year` (misal: `2026/2027`)
  * `homeroom_teacher_id` (uuid, wali kelas)
  * `room_number`, `capacity`
* **Operasi di Aplikasi**:
  * Manajemen Kelas, filter absensi siswa, filter target pengumuman khusus kelas.

#### 8. `student_parents`
* **Fungsi**: Tabel normalisasi relasi data Orang Tua (Ayah & Ibu) yang terikat langsung ke `students.id`.
* **Struktur Kolom**:
  * `student_id` (uuid), `parent_type` (`FATHER`, `MOTHER`), `full_name`, `nik`, `phone`, `email`, `occupation`, `address`.

#### 9. `student_guardians`
* **Fungsi**: Tabel relasi data Wali alternatif jika siswa tidak tinggal bersama orang tua kandung.
* **Struktur Kolom**:
  * `student_id` (uuid), `full_name`, `relation`, `phone`, `email`, `address`.

---

### D. Domain Akademik, Kelas & Absensi Siswa

#### 10. `student_attendance`
* **Fungsi**: Menyimpan log presensi harian siswa (Check-in / Check-out).
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `student_id` (uuid, References `students.id`)
  * `class_id` (uuid, References `school_classes.id`)
  * `date` (date, YYYY-MM-DD)
  * `status` (`HADIR`, `SAKIT`, `IZIN`, `ALPHA`)
  * `check_in_time` (time / timestamptz)
  * `check_out_time` (time / timestamptz)
  * `notes` (text)
* **Operasi di Aplikasi**:
  * Input manual guru di classroom, auto-rekap pada *Dashboard Overview* dan *Rekap Absensi Siswa*.

#### 11. `student_absences`
* **Fungsi**: Pengajuan surat izin atau sakit siswa oleh orang tua dengan lampiran surat dokter.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `student_id` (uuid), `class_id` (uuid)
  * `start_date`, `end_date`, `type` (`SAKIT`, `IZIN`)
  * `reason` (alasan), `document_url` (bukti surat dokter), `status` (`PENDING`, `APPROVED`, `REJECTED`)

#### 12. `class_schedules`
* **Fungsi**: Jadwal mata pelajaran mingguan per kelas.
* **Struktur Kolom**:
  * `id`, `class_id`, `day_of_week` (`SENIN`, `SELASA`, dst), `start_time`, `end_time`, `subject_name`, `teacher_name`.

#### 13. `class_posts`
* **Fungsi**: Timeline / feed postingan kelas (kegiatan harian, PR, dokumentasi materi) yang dibuat guru untuk orang tua.
* **Struktur Kolom**:
  * `id`, `class_id`, `teacher_id`, `title`, `content`, `media_urls`, `created_at`.

---

### E. Domain Operasional Penjemputan Digital (Digital Pickup)

#### 14. `pickup_queue`
* **Fungsi**: Antrian penjemputan *real-time* di lobby sekolah saat penjemput memindai QR Code di pos security gerbang.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `student_id` (uuid, References `students.id`)
  * `pickup_date` (date)
  * `status` (`WAITING` / Antri, `CALLED` / Dipanggil, `PICKED_UP` / Diserahkan)
  * `picked_by_name` (nama penjemput)
  * `picked_by_relation` (Ayah, Ibu, Supir, Wali)
  * `created_at` (waktu scan QR)
  * `picked_up_at` (waktu siswa diserahkan ke penjemput)
* **Operasi di Aplikasi**:
  * Generate QR di Parent Portal, scan QR oleh security, display di TV Lobby live stream (`/penjemputan-app`), dan rekap harian admin.

---

### F. Domain Human Resource & Kepegawaian (HR Management)

#### 15. `employees`
* **Fungsi**: Master data resmi seluruh staf pengajar (Guru) dan tenaga kependidikan (TU, Staf, Security, Kebersihan).
* **Struktur Kolom Utama**:
  * `id` (uuid, PK)
  * `employee_code` (NIP / Kode Karyawan, misal: `EMP-001`, `TCH-004`)
  * `nik`, `full_name`, `gender`, `phone`, `email`
  * `employee_type` (`GURU`, `STAF`, `KARYAWAN`)
  * `position` (Jabatan, misal: *Guru Bahasa Inggris*, *Staff Keuangan*, *Wali Kelas*)
  * `contract_status` (`TETAP`, `KONTRAK`, `PROBATION`)
  * `join_date`, `contract_end_date`
  * `status` (`ACTIVE`, `INACTIVE`, `RESIGNED`)
  * `basic_salary`, `bank_name`, `bank_account_number`
  * `photo_url`, `is_deleted` (soft delete flag)

#### 16. `staff_attendance`
* **Fungsi**: Presensi harian guru dan staf sekolah.
* **Struktur Kolom**:
  * `id`, `employee_id`, `date`, `check_in_time`, `check_out_time`, `status` (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`, `ALPHA`).

#### 17. `hr_leave_types`
* **Fungsi**: Master jenis cuti dan perizinan karyawan.
* **Data Bawaan**: `Cuti Tahunan` (12 hari), `Cuti Sakit`, `Izin Penting` (3 hari), `Dinas Luar`.

#### 18. `hr_leave_balances`
* **Fungsi**: Kuota saldo cuti tahunan per karyawan per tahun berjalan.
* **Struktur Kolom**:
  * `id`, `employee_id`, `leave_type_id`, `year`, `total_days`, `used_days`, `remaining_days`.

#### 19. `hr_leave_requests`
* **Fungsi**: Formulir pengajuan cuti/izin karyawan beserta persetujuan berjenjang HR/Kepala Sekolah.
* **Struktur Kolom**:
  * `id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `total_days`, `reason`, `document_url`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `approved_by`, `approved_at`, `notes`.

#### 20. `hr_payslips`
* **Fungsi**: Slip gaji digital bulanan staf dan guru.
* **Struktur Kolom**:
  * `id`, `employee_id`, `period_month`, `period_year`, `basic_salary`, `total_allowances`, `total_deductions`, `net_salary`, `status` (`DRAFT`, `PUBLISHED`, `PAID`), `paid_at`.

#### 21. `hr_salary_components`
* **Fungsi**: Komponen tunjangan (struktural, transport, makan) dan potongan (BPJS, kasbon, pajak).

#### 22. `hr_reimbursements`
* **Fungsi**: Pengajuan klaim pengeluaran operasional staf (reimburse kuitansi).
* **Struktur Kolom**:
  * `id`, `employee_id`, `title`, `amount`, `category`, `receipt_url`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `PAID`).

#### 23. `hr_item_requests`
* **Fungsi**: Pengadaan barang dan perlengkapan kelas / kantor oleh guru/staf.
* **Struktur Kolom**:
  * `id`, `employee_id`, `item_name`, `quantity`, `estimated_cost`, `urgency`, `status`.

#### 24. `hr_announcements`
* **Fungsi**: Mading digital khusus internal karyawan dan guru.
* **Struktur Kolom**:
  * `id`, `title`, `category`, `content`, `is_important`, `target`, `attachment_url`, `created_at`.

#### 25. `hr_announcement_reads`
* **Fungsi**: Pelacak tanda baca pengumuman karyawan (`announcement_id`, `employee_id`, `read_at`).

#### 26. `employee_kpi_scores`
* **Fungsi**: Rekapitulasi penilaian kinerja (Key Performance Indicator) guru dan staf per periode.
* **Struktur Kolom**:
  * `id`, `employee_id`, `period_month`, `period_year`, `total_score`, `grade` (A, B, C, D).

---

### G. Domain Informasi, Kegiatan & Open House

#### 27. `announcements`
* **Fungsi**: Pengumuman resmi sekolah untuk publik dan orang tua murid.
* **Struktur Kolom Utama**:
  * `id` (uuid, PK), `title`, `content` (HTML/RichText), `category` (Akademik, Libur, Event)
  * `target_type` (`GENERAL` / Umum, `SPECIFIC_CLASSES` / Khusus Kelas Tertentu)
  * `target_classes` (array uuid `school_classes.id`)
  * `thumbnail_url`, `is_published`, `created_at`
* **Operasi di Aplikasi**:
  * Admin Management: Buat, edit, hapus, dan arsipkan pengumuman.
  * Parent Portal: Ditampilkan di widget dashboard dan halaman Informasi lengkap.

#### 28. `open_house_events`
* **Fungsi**: Jadwal agenda event Open House sekolah untuk calon wali murid.
* **Struktur Kolom**:
  * `id`, `title`, `event_date`, `start_time`, `end_time`, `location`, `quota`, `banner_url`, `status` (`UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`).

#### 29. `open_house_registrations`
* **Fungsi**: Data calon orang tua yang mendaftar menghadiri sesi Open House.
* **Struktur Kolom**:
  * `id`, `event_id`, `parent_name`, `phone`, `email`, `child_name`, `target_grade`, `attendance_status`, `notes`.

#### 30. `open_house_settings`
* **Fungsi**: Konfigurasi global event open house (toggle buka/tutup pendaftaran, deskripsi sambutan, auto-reply text).

#### 31. `guestbook_entries`
* **Fungsi**: Buku tamu digital resepsionis untuk pengunjung sekolah, dinas, atau tamu eksternal.
* **Struktur Kolom**:
  * `id`, `visitor_name`, `institution`, `phone`, `email`, `purpose`, `meet_with`, `signature_url`, `created_at`.

---

## 4. Supabase Storage Buckets & Keamanan Berkas

| Nama Bucket | Sifat Akses | Jenis Konten / File | Kebijakan Keamanan (Storage Security) |
|---|---|---|---|
| **`admission-documents`** | 🔒 **Private** | Kartu Keluarga, Akta Kelahiran, Foto 4x3, KTP Orang Tua, Rapor, PDF Perjanjian (*JACOS Agreement*) | **Sangat Ketat**. Hanya dapat diakses melalui *Signed URL* berdurasi 10 menit. File path diisolasi berdasarkan `{applicant_id}/{document_type}`. |
| **`announcement-thumbnails`**| 🌐 **Public** | Gambar cover & ilustrasi berita/pengumuman sekolah | Akses publik *read-only* via CDN URL. Upload/Update/Delete hanya diizinkan untuk Admin (`is_staff()`). |
| **`openhouse-banners`** | 🌐 **Public** | Banner dan poster promosi event Open House | Akses publik *read-only*. Upload/Delete hanya diizinkan untuk Admin. |

---

## 5. Audit Tabel Kosong / Legacy / Potensi Tidak Terpakai

Berdasarkan analisis *source code* dan aliran data, ditemukan beberapa tabel yang berstatus **Legacy** atau **Redundan**:

| Nama Tabel | Status Saat Ini | Analisis & Penyebab | Rekomendasi Tindakan |
|---|---|---|---|
| `teachers` | ⚠️ **Legacy / Deprecated** | Dibuat pada tahap awal prototype untuk menyimpan nama guru. Seluruh data staf dan guru saat ini telah distandarisasi ke tabel `employees` dengan kolom `employee_type = 'GURU'`. | **Aman untuk dihapus** setelah memastikan foreign key `staff_attendance` dan `school_classes` mengarah ke `employees.id`. |
| `leave_requests` | ⚠️ **Duplikat Lama** | Terdapat tabel awal `leave_requests`, namun modul HR perizinan yang aktif saat ini telah menggunakan tabel terstruktur `hr_leave_requests`, `hr_leave_types`, dan `hr_leave_balances`. | **Arsipkan / Hapus**. Semua query di `hr/actions.ts` sebaiknya diarahkan ke `hr_leave_requests`. |
| `documents` (sebagai tabel) | 🟡 **Tumpang Tindih Paruh Waktu** | Pada desain awal, dokumen dipecah ke tabel `documents`. Pada pembaruan terakhir, kolom berkas telah di-*flatten* ke tabel `applicants` (`doc_jacos_agreement`, `doc_photo_4x3`, `doc_birth_certificate`, dll). | Tabel `documents` dapat dipertahankan sebagai relasi multi-dokumen riwayat, atau dibersihkan jika seluruh berkas menggunakan kolom di `applicants`. |

---

## 6. Rekomendasi Pemeliharaan & Optimalisasi

1. **Database Indexing**:
   * Pastikan index aktif pada kolom yang sering dicari:
     * `applicants(registration_no)`, `applicants(status)`, `applicants(created_by)`
     * `guardians(email)`, `guardians(applicant_id)`
     * `students(nis)`, `students(class_id)`
     * `student_attendance(student_id, date)`
     * `pickup_queue(pickup_date, status)`
2. **Standardisasi Foreign Keys**:
   * Ubah referensi `teachers.id` pada tabel absensi staf lama ke `employees.id` agar struktur data HR 100% terpadu.
3. **Pembersihan Berkas Storage Yatim (Orphan Files)**:
   * Buat routine / trigger untuk menghapus berkas di storage bucket `admission-documents` jika pendaftaran dibatalkan atau ditolak permanen.

---
*Dokumen audit ini dibuat secara otomatis dan diverifikasi terhadap codebase repositori JACOS Management.*
