import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "HR Settings - JACOS HR Management",
};

export default function HrSettingsPage() {
  return (
    <UnderDevelopment
      title="Pengaturan Modul HR"
      category="HR Menu Umum"
      description="Konfigurasi parameter sistem HR, standar hari kerja, skema kuota cuti, dan rumus perhitungan lembur."
      iconName="settings"
      expectedFeatures={[
        "Pengaturan pola jam kerja standar dan toleransi keterlambatan",
        "Master data jenis cuti, izin, dan hari libur nasional",
        "Pengaturan batas maksimal klaim reimbursement",
        "Konfigurasi template email notifikasi perizinan & payslip"
      ]}
    />
  );
}
