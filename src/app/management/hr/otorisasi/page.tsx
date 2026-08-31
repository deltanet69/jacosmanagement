import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Otorisasi Staff - JACOS HR Management",
};

export default function HrOtorisasiPage() {
  return (
    <UnderDevelopment
      title="Otorisasi & Hak Akses Staff HR"
      category="Administrasi HR"
      description="Pengaturan peran HR, delegasi wewenang persetujuan (delegation of authority), dan izin modul SDM."
      iconName="lock"
      expectedFeatures={[
        "Pengaturan hirarki persetujuan (Approval Chain HR)",
        "Pengalihan wewenang sementara saat Manajer Cuti",
        "Kustomisasi hak akses data sensitif gaji dan perizinan",
        "Log perubahan konfigurasi otorisasi pegawai"
      ]}
    />
  );
}
