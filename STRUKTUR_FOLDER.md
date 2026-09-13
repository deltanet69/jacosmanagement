# 📁 PANDUAN STRUKTUR FOLDER PROYEK JACOS
### Jakarta Cosmopolite Islamic School Management & Parent Portal

Dokumen ini disusun agar struktur folder, arsitektur modul, dan penempatan file di proyek **JACOS** mudah dipahami oleh pengembang (*developer*), *project manager*, maupun tim teknis lainnya.

---

## 🗺️ 1. Peta Ringkas Direktori Utama (Root Level)

```
jacos2/
├── 📁 public/                 → Aset statis (Logo sekolah, Gambar, Dokumen PDF, Favicon)
├── 📁 src/                    → Seluruh source code aplikasi (App Router, Komponen, Lib)
│   ├── 📁 app/                → Routing halaman, API endpoints, dan Server Actions
│   ├── 📁 components/         → Komponen UI (Shared, HR, Parent Portal, UI Primitives)
│   ├── 📁 lib/                → Konfigurasi Supabase, Email, Helper, & Data Store
│   └── 📄 proxy.ts            → Routing cerdas berbasis Subdomain (Multi-tenant URL)
├── 📁 Brief Project/          → Dokumen referensi, PRD, dan panduan awal pengembangan
├── 📄 AUDIT_DATABASE.md       → Spesifikasi lengkap tabel database & keamanan RLS
├── 📄 STRUKTUR_FOLDER.md      → Panduan arsitektur & struktur folder (Dokumen ini)
├── 📄 package.json            → Daftar dependensi & script runner (Next.js, Tailwind, Radix)
└── 📄 tsconfig.json           → Konfigurasi TypeScript
```

---

## 🧭 2. Arsitektur Routing & Subdomain (`src/proxy.ts`)

Aplikasi JACOS mendukung multi-portal dengan sistem URL terpadu melalui *subdomain rewrite*:

| Subdomain URL | Rute Internal di `src/app/` | Peruntukan Pengguna |
|---|---|---|
| `admission.jacos.id` / `ppdb.jacos.id` | `src/app/(public)/` | Publik & Calon Orang Tua Murid (Formulir PPDB, Open House, Buku Tamu) |
| `management.jacos.id` | `src/app/management/` | Tim Admin, Tata Usaha, Guru, & HR Management |
| `parent.jacos.id` | `src/app/parent-portal/` | Orang Tua Siswa Aktif (Absensi, QR Penjemputan, Tagihan SPP, Info) |
| `absensi.jacos.id` | `src/app/absen/` | Tablet / Kios Absensi Harian Siswa di Sekolah |
| `penjemputan.jacos.id` | `src/app/penjemputan-app/` | TV Lobby & Pos Security untuk Monitor Antrian Penjemputan Live |

---

## 📂 3. Penjelasan Detail Folder `src/app/` (Next.js App Router)

Folder `src/app/` menggunakan standar Next.js App Router. Setiap modul memiliki konvensi file yang seragam:
* `page.tsx` : Halaman utama (Server Component).
* `client-page.tsx` : Interaksi antarmuka pengguna (Client Component).
* `actions.ts` : Fungsi logika backend dan komunikasi database (Server Actions).
* `layout.tsx` : Pembungkus layout, navigasi, dan proteksi sesi.

```
src/app/
│
├── 📁 (public)/                        → AREA PUBLIK (Tanpa Perlu Login)
│   ├── 📄 page.tsx                     → Landing page utama pendaftaran
│   ├── 📁 onlineadmission/             → Formulir pendaftaran calon siswa publik
│   │   ├── 📄 page.tsx
│   │   └── 📄 actions.ts
│   ├── 📁 ppdb/daftar/                 → Portal alur pendaftaran PPDB bertahap
│   ├── 📁 reg/[token]/                 → Form pendaftaran privat lanjutan via tautan token unik
│   ├── 📁 openhouse/                   → Halaman registrasi event Open House sekolah
│   ├── 📁 guessbook/                   → Buku tamu digital resepsionis publik
│   └── 📁 login/                       → Halaman login umum staf dan admin
│
├── 📁 parent-portal/                   → PORTAL ORANG TUA SISWA
│   ├── 📄 layout.tsx                   → Layout utama (Proteksi sesi cookie 'sb-parent-auth-token')
│   ├── 📄 actions.ts                   → Server action dokumen perjanjian & dashboard data
│   ├── 📄 server-actions.ts            → Pengambilan profil lengkap siswa & histori penjemputan
│   ├── 📁 login/                       → Halaman login khusus orang tua murid
│   ├── 📁 change-password/             → Halaman wajib ganti kata sandi pada login pertama (First Login)
│   └── 📁 (dashboard)/                 → Halaman dalam dashboard orang tua (Dilengkapi Bottom Nav)
│       ├── 📄 page.tsx                 → Dashboard ringkasan aktivitas siswa (Server Component)
│       ├── 📄 DashboardClient.tsx      → Interaksi UI, trigger QR modal, upload berkas
│       ├── 📁 profil-siswa/            → Informasi biodata lengkap siswa, kelas, dan data orang tua
│       ├── 📁 classroom/               → Kehadiran, agenda harian kelas, dan materi dari guru
│       ├── 📁 penjemputan/             → Halaman utama QR Penjemputan, timer 30s, & input penjemput manual
│       ├── 📁 informasi/               → Pengumuman resmi dari sekolah untuk orang tua
│       ├── 📁 finance/                 → Status tagihan SPP bulanan & riwayat pembayaran
│       └── 📁 tabungan/                → Rekening tabungan siswa di sekolah
│
├── 📁 management/                      → PORTAL ADMIN, GURU & HR
│   ├── 📄 layout.tsx                   → Layout dashboard admin (Sidebar navigasi & Topbar profil)
│   ├── 📄 page.tsx                     → Overview dashboard statistik operasional (Server Component)
│   ├── 📄 client-page.tsx              → Tampilan 2x2 metrik KPI & grafik aktivitas
│   ├── 📄 actions.ts                   → Pengambilan metrik ringkasan dashboard
│   │
│   ├── 📁 admisi/                      → Manajemen Pendaftaran & Verifikasi Calon Siswa
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts               → Verifikasi berkas, approve pendaftaran, kirim akun login
│   │   └── 📁 [id]/                    → Halaman detail biodata pendaftar, bukti bayar & dokumen
│   │
│   ├── 📁 siswa/                       → Manajemen Master Data Siswa Aktif
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts               → CRUD data siswa, mutasi kelas, & export data
│   │   └── 📁 [id]/                    → Detail rekam jejak siswa lengkap
│   │
│   ├── 📁 classroom/                   → Manajemen Ruang Kelas & Rombel
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts               → Tambah kelas, alokasi wali kelas, kapasitas
│   │   └── 📁 [classId]/               → Detail kelas: daftar siswa, jadwal pelajaran, & postingan agenda
│   │
│   ├── 📁 absensi/                     → Rekapitulasi Presensi & Penjemputan
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts               → Log check-in/out, rekap per kelas, status sakit/izin
│   │   └── 📁 penjemputan/             → Monitoring antrian penjemputan siswa di lobby
│   │
│   ├── 📁 hr/                          → MODUL HUMAN RESOURCES (HR MANAGEMENT)
│   │   ├── 📄 page.tsx                 → Dashboard statistik kepegawaian & KPI
│   │   ├── 📄 actions.ts               → Server actions HR
│   │   ├── 📁 guru/                    → Direktori master data guru & staf (NIP, kontrak, jabatan)
│   │   ├── 📁 perizinan/               → Pengajuan & persetujuan cuti / izin staf (Leave balances)
│   │   ├── 📁 payslip/                 → Pembuatan & distribusi slip gaji bulanan karyawan
│   │   ├── 📁 reimburse/               → Manajemen klaim pengeluaran kuitansi operasional
│   │   ├── 📁 pengajuan/               → Pengajuan pengadaan barang / perlengkapan sekolah
│   │   └── 📁 pengumuman/              → Mading digital pengumuman internal karyawan
│   │
│   ├── 📁 informasi/                   → Publikasi Pengumuman Sekolah
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts               → Publikasi pengumuman (Umum vs Khusus Kelas)
│   │   └── 📁 tambah/ & [id]/edit/     → Form editor pengumuman (Rich Text)
│   │
│   ├── 📁 openhouse/                   → Manajemen Agenda Event Open House
│   │   ├── 📄 page.tsx & client-page.tsx
│   │   ├── 📄 actions.ts & event-actions.ts → Buat sesi acara, kuota, banner, daftar peserta
│   │   └── 📁 [eventId]/               → Detail kehadiran pengunjung sesi tertentu
│   │
│   ├── 📁 guessbook/                   → Rekap Buku Tamu Resepsionis
│   │   └── 📄 actions.ts & client-page.tsx
│   │
│   ├── 📁 keuangan/                    → Modul Keuangan & SPP Sekolah (Under development)
│   ├── 📁 pengaturan/                  → Pengaturan Sekolah, Profil Instansi, & Tahun Ajaran
│   └── 📁 user-management/             → Manajemen Akun Pengguna & Hak Akses Staf
│
├── 📁 penjemputan-app/                 → LIVE DISPLAY TV LOBBY & SECURITY SCANNER
│   ├── 📄 page.tsx                     → Layar TV Lobby (Panggilan suara & visual nama siswa dijemput)
│   └── 📁 scan/                        → Antarmuka pemindai kamera QR Code untuk petugas keamanan
│
├── 📁 absen/                           → KIOSK / TABLET ABSENSI KELAS
│   └── 📁 [className]/                 → Halaman presensi cepat harian per kelas
│
└── 📁 api/                             → BACKEND API ENDPOINTS
    ├── 📁 wilayah/                     → API lookup data wilayah (Provinsi, Kota, Kecamatan, Kelurahan)
    └── 📁 debug-email/                 → Utilitas pengetesan pengiriman email transaksi
```

---

## 🧩 4. Penjelasan Detail Folder `src/components/` (Komponen Antarmuka)

Semua komponen UI dibagi berdasarkan domain agar rapi dan mudah digunakan ulang (*reusable*):

```
src/components/
│
├── 📁 parent-portal/                   → KOMPONEN KHUSUS PORTAL ORANG TUA
│   ├── 📄 ParentTopNav.tsx             → Header mobile dengan logo JACOS, lonceng notifikasi, & avatar
│   ├── 📄 ParentBottomNav.tsx          → Floating bottom navigation (Home, Classroom, Pickup, Info, Keuangan)
│   ├── 📄 ParentSidebar.tsx            → Sidebar navigasi untuk tampilan layar desktop / tablet
│   └── 📄 PickupQRModal.tsx            → Modal QR code penjemputan (Timer 30s, QR responsif besar, quick chip penjemput)
│
├── 📁 shared/                          → KOMPONEN BERSAMA (Dipakai lintas modul)
│   ├── 📄 TopNav.tsx                   → Header Admin dengan search bar, TA 2026/2027 badge, & mobile sheet menu
│   ├── 📄 DashboardSidebar.tsx         → Sidebar Admin dengan modul switcher (Admin Portal vs HR Management)
│   ├── 📄 RichTextEditor.tsx           → Editor WYSIWYG untuk membuat pengumuman & berita
│   └── 📄 UnderDevelopment.tsx         → Placeholder informatif untuk halaman fitur yang sedang disiapkan
│
├── 📁 hr/                              → KOMPONEN MODUL HR MANAGEMENT
│   ├── 📄 GuruListClient.tsx           → Tabel & kartu daftar karyawan/guru
│   ├── 📄 PayslipListClient.tsx        → Pengelolaan slip gaji dan komponen pendapatan
│   ├── 📄 PerizinanListClient.tsx      → Antarmuka approval cuti dan saldo kuota izin
│   ├── 📄 ReimburseListClient.tsx      → Pengelolaan klaim bukti kuitansi staf
│   ├── 📄 PengajuanListClient.tsx      → Daftar request pengadaan inventaris
│   ├── 📄 PengumumanListClient.tsx     → Mading pengumuman internal
│   └── 📄 HrKpiChart.tsx               → Visualisasi grafik capaian skor performa kerja
│
├── 📁 pickup/                          → KOMPONEN PEMINDAI PENJEMPUTAN
│   └── 📄 phone-qr-scanner.tsx         → Komponen kamera barcode/QR scanner untuk security
│
└── 📁 ui/                              → SHADCN / RADIX UI PRIMITIVES
    ├── 📄 button.tsx, input.tsx, select.tsx, textarea.tsx
    ├── 📄 sheet.tsx, checkbox.tsx, radio-group.tsx, switch.tsx, label.tsx
```

---

## ⚙️ 5. Penjelasan Detail Folder `src/lib/` (Libraries, Konfigurasi & Utilitas)

```
src/lib/
│
├── 📁 supabase/                        → INTEGRASI SUPABASE DATABASE & AUTH
│   ├── 📄 client.ts                    → Browser Singleton Supabase Client (`createClient` & `createParentClient`)
│   ├── 📄 server.ts                    → Server Supabase Client (`createClient`, `createParentServerClient`, `createAdminClient`)
│   └── 📄 middleware.ts                → Sinkronisasi session cookie & proteksi rute
│
├── 📄 admission-config.ts              → Konfigurasi gelombang PPDB aktif (Tahun Ajaran, Kuota, Biaya Pendaftaran)
├── 📄 email.ts                         → Engine Resend Email (Template aktivasi akun, notifikasi admisi, bukti bayar)
├── 📄 utils.ts                         → Format mata uang (Rupiah), tanggal Indonesia, string helpers, `cn()` Tailwind merger
└── 📁 data/                            → Local fallback store saat mode offline / demo
```

---

## 🖼️ 6. Penjelasan Detail Folder `public/` (Aset Statis)

```
public/
├── 📁 publicjacos/                     → BRANDING & ASSET RESMI SEKOLAH
│   ├── 📄 logo.png                     → Logo resmi JACOS (Versi Berwarna)
│   ├── 📄 logoputih.png                → Logo resmi JACOS (Versi Putih untuk Background Gelap)
│   ├── 📄 fav.png                      → Favicon browser
│   ├── 📄 bglogin.jpeg                 → Background foto gedung kampus sekolah untuk halaman login
│   ├── 📁 agreements/                  → Dokumen PDF resmi (PD_LETTER_JACOS.pdf untuk Declaration Agreements)
│   ├── 📁 about/, campus/, finance/    → Dokumentasi foto fasilitas & kegiatan belajar
│
├── 📁 illustrations/                   → Ilustrasi grafis pendukung antarmuka
└── 📄 jacos-primary.pdf                → Dokumen panduan kurikulum & handbook sekolah
```

---

## 💡 7. Panduan Praktis untuk Developer (Where to Put New Code)

1. **Ingin Menambah Halaman Baru di Admin Portal?**
   * Buat folder di `src/app/management/<nama-modul>/`
   * Siapkan `page.tsx` (Server Component), `client-page.tsx` (UI), dan `actions.ts` (Database logic).
   * Daftarkan menu baru di `src/components/shared/DashboardSidebar.tsx`.

2. **Ingin Menambah Halaman Baru di Parent Portal?**
   * Buat folder di `src/app/parent-portal/(dashboard)/<nama-modul>/`
   * Hubungkan ikon navigasi jika perlu di `src/components/parent-portal/ParentBottomNav.tsx` dan `ParentSidebar.tsx`.

3. **Ingin Menambahkan Email Notifikasi Otomatis?**
   * Buat fungsi template email baru di `src/lib/email.ts` menggunakan library `resend`.

4. **Ingin Menambah Komponen UI Baru (Modal, Form, Card)?**
   * Jika khusus modul tertentu → letakkan di `src/components/<nama-modul>/`.
   * Jika dipakai bersama → letakkan di `src/components/shared/`.

---
*Dokumentasi ini dijaga agar selalu sinkron dengan struktur kode terkini pada repositori JACOS.*
