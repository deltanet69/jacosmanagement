import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Pengaturan Admin - JACOS Admin",
};

export default function PengaturanAdminPage() {
  return (
    <UnderDevelopment
      title="Pengaturan Sistem Admin"
      category="Other"
      description="Konfigurasi profil sekolah, tahun ajaran aktif, skema penomoran registrasi, dan preferensi aplikasi portal."
      iconName="settings"
      expectedFeatures={[
        "Pengaturan identitas sekolah (Nama, Logo, Alamat, Kontak)",
        "Manajemen semester & tahun ajaran berjalan",
        "Integrasi layanan email & WhatsApp gateway notifikasi",
        "Backup & Restore basis data berkala"
      ]}
    />
  );
}
