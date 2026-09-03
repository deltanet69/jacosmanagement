# 🔗 Direktori Link & Rute Aplikasi JACOS

Dokumentasi lengkap alamat URL untuk seluruh modul dan fitur aplikasi JACOS di lingkungan **Localhost**, **Vercel Preview/Deployment**, dan **Production (Custom Subdomain)**.

---

## 1. Modul Publik & PPDB / Admisi

| Fitur | Localhost | Vercel (`jacosmanagement.vercel.app`) | Production Subdomain |
| :--- | :--- | :--- | :--- |
| **Landing Page Utama** | `http://localhost:3000/` | `https://jacosmanagement.vercel.app/` | `https://jacos.id/` / `https://admission.jacos.id/` |
| **Form Pendaftaran PPDB** | `http://localhost:3000/admission` | `https://jacosmanagement.vercel.app/admission` | `https://admission.jacos.id/admission` |
| **Pendaftaran Open House** | `http://localhost:3000/openhouse` | `https://jacosmanagement.vercel.app/openhouse` | `https://jacos.id/openhouse` |
| **Login Admin / Staff** | `http://localhost:3000/login` | `https://jacosmanagement.vercel.app/login` | `https://management.jacos.id/login` |

---

## 2. Kiosk & Display Screen (TV / HP Petugas)

| Fitur | Localhost | Vercel (`jacosmanagement.vercel.app`) | Production Subdomain |
| :--- | :--- | :--- | :--- |
| **Absensi RFID Kiosk (Per Kelas)** | `http://localhost:3000/absen/[nama-kelas]`<br>*(contoh: `/absen/1a`)* | `https://jacosmanagement.vercel.app/absen/[nama-kelas]` | `https://jacos.id/absen/[nama-kelas]` |
| **TV Lobby Display Penjemputan** | `http://localhost:3000/penjemputan-app` | `https://jacosmanagement.vercel.app/penjemputan-app` | `https://penjemputan.jacos.id/` |
| **Workstation Scanner HP Security** | `http://localhost:3000/management/absensi/penjemputan/scanner` | `https://jacosmanagement.vercel.app/management/absensi/penjemputan/scanner` | `https://management.jacos.id/absensi/penjemputan/scanner` |

---

## 3. Portal Orang Tua (Parent Portal)

| Fitur | Localhost | Vercel (`jacosmanagement.vercel.app`) | Production Subdomain (`parent.jacos.id`) |
| :--- | :--- | :--- | :--- |
| **Login Portal Orang Tua** | `http://localhost:3000/parent-portal/login` | `https://jacosmanagement.vercel.app/parent-portal/login` | `https://parent.jacos.id/login` |
| **Dashboard Orang Tua** | `http://localhost:3000/parent-portal` | `https://jacosmanagement.vercel.app/parent-portal` | `https://parent.jacos.id/` |
| **QR Penjemputan Siswa** | `http://localhost:3000/parent-portal/penjemputan` | `https://jacosmanagement.vercel.app/parent-portal/penjemputan` | `https://parent.jacos.id/penjemputan` |
| **Ruang Kelas & Perkembangan** | `http://localhost:3000/parent-portal/classroom` | `https://jacosmanagement.vercel.app/parent-portal/classroom` | `https://parent.jacos.id/classroom` |
| **Tagihan & Keuangan SPP** | `http://localhost:3000/parent-portal/finance` | `https://jacosmanagement.vercel.app/parent-portal/finance` | `https://parent.jacos.id/finance` |
| **Buku Tabungan Siswa** | `http://localhost:3000/parent-portal/tabungan` | `https://jacosmanagement.vercel.app/parent-portal/tabungan` | `https://parent.jacos.id/tabungan` |
| **Profil Siswa** | `http://localhost:3000/parent-portal/profil-siswa` | `https://jacosmanagement.vercel.app/parent-portal/profil-siswa` | `https://parent.jacos.id/profil-siswa` |

---

## 4. Dashboard Management / Admin

| Modul | Localhost | Vercel (`jacosmanagement.vercel.app`) | Production Subdomain (`management.jacos.id`) |
| :--- | :--- | :--- | :--- |
| **Dashboard Utama** | `http://localhost:3000/management` | `https://jacosmanagement.vercel.app/management` | `https://management.jacos.id/` |
| **Manajemen Penjemputan** | `http://localhost:3000/management/absensi/penjemputan` | `https://jacosmanagement.vercel.app/management/absensi/penjemputan` | `https://management.jacos.id/absensi/penjemputan` |
| **Rekap Presensi Siswa & Guru** | `http://localhost:3000/management/absensi` | `https://jacosmanagement.vercel.app/management/absensi` | `https://management.jacos.id/absensi` |
| **Admisi & Calon Siswa (PPDB)** | `http://localhost:3000/management/admisi` | `https://jacosmanagement.vercel.app/management/admisi` | `https://management.jacos.id/admisi` |
| **Manajemen Kelas (Classroom)** | `http://localhost:3000/management/classroom` | `https://jacosmanagement.vercel.app/management/classroom` | `https://management.jacos.id/classroom` |
| **Database Siswa** | `http://localhost:3000/management/siswa` | `https://jacosmanagement.vercel.app/management/siswa` | `https://management.jacos.id/siswa` |
| **Database Guru & Pengajar** | `http://localhost:3000/management/guru` | `https://jacosmanagement.vercel.app/management/guru` | `https://management.jacos.id/guru` |
| **Kepegawaian & HR** | `http://localhost:3000/management/kepegawaian` | `https://jacosmanagement.vercel.app/management/kepegawaian` | `https://management.jacos.id/kepegawaian` |
| **Keuangan & SPP Siswa** | `http://localhost:3000/management/keuangan` | `https://jacosmanagement.vercel.app/management/keuangan` | `https://management.jacos.id/keuangan` |
| **Informasi & Pengumuman** | `http://localhost:3000/management/informasi` | `https://jacosmanagement.vercel.app/management/informasi` | `https://management.jacos.id/informasi` |
| **Data Open House** | `http://localhost:3000/management/openhouse` | `https://jacosmanagement.vercel.app/management/openhouse` | `https://management.jacos.id/openhouse` |
| **User & Role Management** | `http://localhost:3000/management/user-management` | `https://jacosmanagement.vercel.app/management/user-management` | `https://management.jacos.id/user-management` |
| **Pengaturan Sekolah** | `http://localhost:3000/management/pengaturan` | `https://jacosmanagement.vercel.app/management/pengaturan` | `https://management.jacos.id/pengaturan` |

---

> **Catatan Routing:**  
> Logika pemetaan subdomain production diatur secara dinamis di file `src/proxy.ts`.
