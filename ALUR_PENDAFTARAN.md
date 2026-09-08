# Alur Pendaftaran Siswa JACOS

Dokumen ini menjelaskan alur teknis dan operasional pendaftaran calon peserta didik di Jakarta Cosmopolite Islamic School (JACOS). Sistem mencakup dua jalur masuk awal, satu formulir pengisian data lengkap, serta alur seleksi dan penempatan kelas.

---

## 1. Ringkasan Arsitektur Pendaftaran

Sistem pendaftaran JACOS terbagi menjadi empat tahapan utama:

1. **Pintu Masuk Awal (Entry Point)**:
   - **Public Admission (Online Mandiri)**: Calon wali murid mendaftar mandiri via web publik dan mengunggah bukti transfer.
   - **Direct Admin (Onsite / Manual)**: Admin memasukkan data calon siswa yang mendaftar atau membayar langsung di sekolah.
2. **Tautan Formulir Unik**: Setiap pendaftar yang pembayarannya valid akan mendapatkan tautan khusus berbasis token acak (`/reg/[token]`).
3. **Pengisian Formulir Lengkap**: Orang tua mengisi biodata rinci, riwayat kesehatan, dan mengunggah dokumen persyaratan.
4. **Verifikasi, Approval Batch, dan Onboarding**: Panitia admisi meninjau berkas, menetapkan gelombang (batch), membuat akun Parent Portal, dan memplot kelas siswa.

---

## 2. Jalur 1: Public Admission (Pendaftaran Online Mandiri)

Jalur ini ditujukan untuk masyarakat umum yang mendaftar melalui situs publik sekolah.

### Rute dan File Terkait
- Halaman Publik: `src/app/(public)/admission/page.tsx`
- Redirect URL: `src/app/(public)/ppdb/daftar/page.tsx` (mengarahkan langsung ke `/admission`)
- Server Action: `src/app/(public)/admission/actions.ts` (`submitPublicAdmission`)
- Panel Admin: `src/app/management/admisi/client-page.tsx` (Tab: "Admisi Publik")

### Tahapan Operasional

1. **Pengisian Data Awal oleh Orang Tua**:
   - Orang tua mengakses halaman `/admission`.
   - Mengisi data calon siswa: Nama lengkap, jenjang (Preschool / Kindergarten / Primary School), jenis kelamin.
   - Mengisi data wali: Hubungan (Ayah/Ibu), nama lengkap, nomor WhatsApp aktif, dan alamat email aktif.
   - Melakukan transfer biaya formulir pendaftaran sebesar Rp 1.000.000 ke rekening resmi sekolah (Bank BNI 2332334216 a.n Yayasan Cahaya Pembangunan Global Indonesia atau scan QRIS).
   - Mengunggah berkas bukti transfer (format JPG, PNG, atau PDF, maksimal 5 MB).
   - Menekan tombol **Kirim Pendaftaran & Bukti Transfer**.

2. **Proses Backend Saat Form Terkirim**:
   - Sistem menghasilkan Nomor Registrasi otomatis berformat `JCS-{TAHUN}-{NOMOR}` (contoh: `JCS-2026-00001`).
   - Sistem membuat token pendaftaran acak 12 karakter hex (`registration_token`).
   - Berkas bukti pembayaran diunggah ke Supabase Storage pada bucket `admission-documents/payment-proofs/`.
   - Data disimpan ke tabel `applicants` dengan status awal:
     - `status`: `WAITING_REVIEW`
     - `payment_status`: `PENDING_VERIFICATION`
     - `payment_amount`: `1000000`
     - `form_submitted`: `false`
   - Data kontak wali disimpan ke tabel `guardians`.
   - Sistem mengirimkan email konfirmasi penerimaan pendaftaran (`sendPublicAdmissionReceivedEmail`) ke email orang tua sebagai bukti bahwa pendaftaran telah masuk antrean verifikasi admin.

3. **Verifikasi Bukti Bayar oleh Admin**:
   - Admin membuka menu **Admisi** pada dashboard manajemen dan memilih tab **Admisi Publik (Online)**.
   - Admin melihat daftar pendaftar dengan status `WAITING_REVIEW`.
   - Admin menekan tombol **Lihat Bukti Transfer** untuk memvalidasi keaslian struk pembayaran via signed URL.

4. **Keputusan Verifikasi Pembayaran**:
   - **Jika Pembayaran Diterima (Approve)**:
     - Admin menekan tombol **Terima Pembayaran** (`approvePublicPayment`).
     - Status pembayaran diperbarui menjadi `payment_status = PAID` dan `status = PENDING`.
     - Sistem otomatis mengirimkan email pembuka (`sendInitialGreetingEmail`) berisi tautan formulir pendaftaran eksklusif (`/reg/[token]`).
     - Sistem menampilkan dialog berisi tautan unik dan draf pesan WhatsApp siap kirim untuk memudahkan konfirmasi langsung ke nomor wali murid.
   - **Jika Pembayaran Ditolak (Reject)**:
     - Admin menekan tombol **Tolak Pembayaran** (`rejectPublicPayment`) dan mengisi alasan penolakan.
     - Status diubah menjadi `payment_status = REJECTED` dan `status = REJECTED`.
     - Sistem mengirimkan email pemberitahuan penolakan (`sendRejectionEmail`) beserta catatan perbaikan ke orang tua.

---

## 3. Jalur 2: Direct Admin Admission (Input Langsung oleh Admin)

Jalur ini digunakan jika orang tua datang langsung ke sekolah, membayar via kasir tunai, atau transfer langsung yang diproses manual oleh staf admisi.

### Rute dan File Terkait
- Halaman Input Admin: `src/app/management/admisi/tambah/page.tsx`
- Server Action: `src/app/management/admisi/actions.ts` (`createNewAdmission`)
- Panel Admin: `src/app/management/admisi/client-page.tsx` (Tab: "Pendaftaran Direct")

### Tahapan Operasional

1. **Input oleh Petugas Admisi**:
   - Petugas membuka menu **Admisi** -> klik tombol **+ Pendaftaran Baru** (`/management/admisi/tambah`).
   - Memasukkan data dasar siswa: Nama lengkap, jenjang pendidikan, jenis kelamin.
   - Memasukkan data orang tua: Hubungan keluarga, nama lengkap, nomor telepon/WhatsApp, dan email.
   - Mencatat detail pembayaran: Nominal pembayaran (default Rp 1.000.000), metode pembayaran (Transfer BNI, QRIS, atau Tunai), serta catatan tambahan.
   - Menekan tombol **Buat & Generate Link**.

2. **Proses Backend**:
   - Sistem membuat Nomor Registrasi baru (`JCS-{TAHUN}-{NOMOR}`) dan `registration_token`.
   - Data disimpan ke tabel `applicants` dengan status:
     - `status`: `PENDING`
     - `payment_status`: `PAID`
     - `form_submitted`: `false`
   - Data orang tua disimpan ke tabel `guardians`.
   - Sistem mengirimkan email pembuka (`sendInitialGreetingEmail`) ke email orang tua yang memuat tautan pengisian formulir lengkap (`/reg/[token]`).
   - Petugas dialihkan ke halaman detail pendaftar (`/management/admisi/[applicantId]`).

---

## 4. Tahap Pengisian Formulir Lengkap (`/reg/[token]`)

Tahap ini merupakan titik temu dari kedua jalur pendaftaran. Hanya pemohon dengan pembayaran berstatus lunas yang memiliki tautan token aktif.

### Rute dan File Terkait
- Halaman Publik Token: `src/app/(public)/reg/[token]/page.tsx`
- Komponen Wizard: `src/app/(public)/reg/[token]/RegFormClient.tsx`
- Server Action: `src/app/(public)/reg/[token]/actions.ts` (`submitApplicantByToken`)

### Validasi Akses Halaman
- Jika token tidak ditemukan di database, sistem menampilkan pesan error bahwa tautan tidak valid atau kedaluwarsa.
- Jika formulir sudah pernah dikirim sebelumnya (`form_submitted = true`), sistem menampilkan status bahwa data sedang diverifikasi agar tidak terjadi pengiriman ganda.
- Jika valid, sistem memuat formulir dan mengisi otomatis (pre-fill) data nama siswa, jenjang, dan kontak orang tua yang telah dimasukkan sebelumnya.

### 5 Langkah Pengisian Formulir (Multi-Step Form)

1. **Langkah 1: Data Calon Siswa & Riwayat Medis**
   - Nama lengkap, nama panggilan, tempat lahir, tanggal lahir.
   - NIK siswa, NISN (opsional), agama, kewarganegaraan, alamat tempat tinggal.
   - Bahasa sehari-hari di rumah, anak ke berapa, nama sekolah sebelumnya (jika siswa pindahan).
   - Golongan darah, tinggi badan (cm), berat badan (kg).
   - Keterangan alergi atau kebutuhan khusus, serta riwayat penyakit.

2. **Langkah 2: Data Orang Tua & Wali**
   - Data Ayah: Nama lengkap, NIK, pekerjaan, rentang penghasilan bulanan, nomor telepon, email.
   - Data Ibu: Nama lengkap, NIK, pekerjaan, rentang penghasilan bulanan, nomor telepon, email.
   - Data Wali (opsional): Nama wali, hubungan keluarga, pekerjaan, penghasilan, dan nomor telepon.

3. **Langkah 3: Kontak Darurat & Otorisasi Penjemputan**
   - Nama kontak darurat di luar orang tua inti, hubungan dengan siswa, nomor telepon.
   - Moda transportasi harian yang digunakan siswa ke sekolah.
   - Nama pihak yang diberikan wewenang untuk menjemput siswa sepulang sekolah.

4. **Langkah 4: Unggah Dokumen Persyaratan**
   - Akta Kelahiran siswa (`doc_birth_certificate`).
   - Kartu Keluarga (`doc_family_card`).
   - KTP Orang Tua / Wali (`doc_parent_id`).
   - Pas Foto 3x4 Calon Siswa (`doc_photo_4x3`).
   - Kartu Imunisasi (`doc_immunization_card`).
   - Buku Rapor Sekolah Sebelumnya (`doc_previous_report` - khusus jenjang Primary / Pindahan).
   - *Catatan teknis*: Gambar dikompresi otomatis di sisi browser sebelum diunggah ke storage `admission-documents/[applicantId]/`.

5. **Langkah 5: Konfirmasi & Pernyataan**
   - Tinjauan ringkasan seluruh data yang telah diisi.
   - Persetujuan publikasi media kegiatan belajar siswa (Media Consent).
   - Pernyataan kebenaran data dan kesediaan mematuhi tata tertib sekolah.

### Proses Backend Saat Formulir Lengkap Disubmit
- Data pendaftar di tabel `applicants` diperbarui:
  - `status`: `SUBMITTED`
  - `form_submitted`: `true`
  - `submitted_at`: Timestamp pengiriman formulir.
- Seluruh data orang tua di tabel `guardians` disinkronkan dengan data terbaru.
- Dokumen tersimpan di Supabase Storage dan tautan path dicatat pada kolom `doc_*`.
- Sistem mengirimkan email konfirmasi penyerahan berkas (`sendFormWaitingApprovalEmail`) kepada orang tua.

---

## 5. Tahap Verifikasi Berkas, Approval Batch, dan Onboarding Portal

Setelah formulir diserahkan oleh orang tua, panitia admisi melakukan pemeriksaan menyeluruh pada panel admin.

### Rute dan File Terkait
- Halaman Detail Pendaftar: `src/app/management/admisi/[applicantId]/page.tsx`
- Komponen Detail: `src/app/management/admisi/[applicantId]/client-page.tsx`
- Server Action: `src/app/management/admisi/actions.ts`
  - `approveApplicantWithBatch`: Menyetujui pendaftar dan memasukkannya ke batch.
  - `rejectApplicant`: Menolak pendaftaran dengan alasan resmi.
  - `verifyDocumentAgreement`: Memverifikasi surat pernyataan JACOS Agreement.
  - `assignStudentToClass`: Menempatkan siswa ke rombel kelas.
  - `resetParentAccountPassword`: Mereset atau membuat ulang kata sandi akun wali murid.

### Tahapan Operasional

1. **Pemeriksaan Berkas di Admin Dashboard**:
   - Admin membuka berkas calon siswa di `/management/admisi/[applicantId]`.
   - Admin dapat membuka dan meninjau setiap dokumen yang diunggah melalui signed URL sementara yang aman.
   - Jika terdapat kekeliruan data kontak orang tua, admin dapat memperbaruinya langsung via modal pengeditan data wali (`upsertGuardians`).

2. **Approval Pendaftar dan Penetapan Gelombang (Batch)**:
   - Admin menekan tombol **Terima Siswa (Approve)**.
   - Muncul modal pemilihan gelombang penerimaan. Gelombang dikonfigurasi pada `src/lib/admission-config.ts`:
     - **Batch 1 (Gelombang Pertama)**: Periode Juli sampai September.
     - **Batch 2 (Gelombang Kedua)**: Periode Oktober sampai Desember.
     - **Batch 3 (Gelombang Ketiga)**: Periode Januari sampai Maret.
   - Admin memilih batch yang sesuai (sistem otomatis memilih batch aktif berdasarkan bulan saat ini).
   - Admin menekan tombol konfirmasi persetujuan.

3. **Dampak Sistemik Backend dari Approval (`approveApplicantWithBatch`)**:
   - **Pembuatan Data Master Siswa**: Sistem membuat record baru di tabel `students` dengan status aktif (`is_active = true`), menyimpan batch terpilih, dan mengaitkan `applicant_id`.
   - **Pembuatan Relasi Orang Tua**: Sistem mencatat data wali pada tabel `student_parents`.
   - **Pembuatan Akun Parent Portal**:
     - Sistem membuat akun auth di Supabase (`supabase.auth.admin.createUser`) menggunakan email wali murid.
     - Diberikan role `PARENT` dan kata sandi sementara (temp password acak).
     - Metadata akun dikaitkan langsung dengan `student_id` dan `student_name`.
   - **Pengiriman Surat Kelulusan Digital**:
     - Sistem mengirimkan email resmi penerimaan (`sendApprovalEmail`) yang memuat informasi kelulusan, rincian batch, alamat login Parent Portal (`https://parent.jacos.id`), dan password sementara.
   - **Pembaruan Status Pendaftar**: Status di tabel `applicants` berubah menjadi `status = ENROLLED` dan batch tercatat pada kolom pendaftaran.

4. **Unggah Surat Perjanjian di Parent Portal**:
   - Orang tua masuk ke Parent Portal menggunakan kredensial yang telah dikirimkan.
   - Orang tua mengunduh, menandatangani, dan mengunggah kembali Surat Perjanjian / Surat Pernyataan Sekolah (JACOS Agreement).
   - Admin memverifikasi dokumen tersebut (`verifyDocumentAgreement`). Sistem mengirimkan email konfirmasi verifikasi perjanjian (`sendAgreementApprovedEmail`).

5. **Penempatan Rombel Kelas (Classroom Assignment)**:
   - Di panel admin tab **Approval & Batch** (`src/app/management/admisi/client-page.tsx`), admin dapat memfilter siswa yang telah berstatus `ENROLLED` berdasarkan Batch.
   - Admin melihat status penempatan kelas (Unassigned vs Assigned).
   - Admin menekan tombol penempatan kelas (`assignStudentToClass`) untuk memasukkan siswa ke rombel kelas yang tersedia pada tabel `school_classes`.

---

## 6. Jalur Pendukung: Registrasi Open House & School Tour

Selain pendaftaran siswa reguler, terdapat formulir pra-admisi untuk kegiatan Open House dan konsultasi tatap muka.

### Rute dan File Terkait
- Halaman Publik: `src/app/(public)/openhouse/page.tsx`
- Server Action Publik: `src/app/(public)/openhouse/actions.ts` (`submitOpenHouseRegistration`)
- Panel Manajemen Open House: `src/app/management/openhouse/page.tsx`

### Alur Singkat
1. Orang tua mengisi data nama, kontak WhatsApp, email, nama dan usia anak, jenjang yang diminati, serta memilih sesi kehadiran.
2. Sistem menerbitkan tiket pendaftaran digital lengkap dengan kode tiket dan QR Code verifikasi kehadiran.
3. Tim admisi mengelola data leads dan kehadiran peserta open house melalui panel manajemen open house untuk tindak lanjut ke pendaftaran reguler.

---

## 7. Rangkuman Status dan Tabel Database

### Siklus Status Pendaftar (`applicants.status`)
1. `WAITING_REVIEW`: Pendaftaran mandiri publik masuk, bukti bayar menunggu verifikasi admin.
2. `PENDING`: Pembayaran lunas, pendaftar memegang token aktif dan belum mengirim formulir lengkap.
3. `SUBMITTED`: Orang tua telah selesai mengisi formulir 5 langkah dan mengunggah seluruh berkas.
4. `ENROLLED`: Admin telah menyetujui pendaftaran, menetapkan batch, dan menerbitkan akun siswa serta akun orang tua.
5. `REJECTED`: Pendaftaran atau bukti pembayaran ditolak oleh panitia admisi.

### Siklus Status Pembayaran (`applicants.payment_status`)
1. `PENDING_VERIFICATION`: Bukti transfer telah diunggah oleh pendaftar online dan menunggu konfirmasi mutasi bank.
2. `PAID`: Pembayaran Rp 1.000.000 dinyatakan valid dan tercatat lunas.
3. `REJECTED`: Bukti pembayaran tidak valid atau ditolak oleh admin.

### Tabel Database Utama yang Digunakan
- `applicants`: Menyimpan data pendaftaran utama, token, status seleksi, dan status pembayaran.
- `guardians`: Menyimpan data kontak ayah, ibu, atau wali yang mengajukan pendaftaran.
- `students`: Menyimpan data master siswa resmi setelah pendaftar disetujui (`ENROLLED`).
- `student_parents`: Menghubungkan siswa master dengan profil orang tua.
- `school_classes`: Daftar rombel kelas aktif untuk penempatan siswa baru.
- Storage Bucket `admission-documents`: Menyimpan bukti transfer dan seluruh berkas syarat pendaftaran.
