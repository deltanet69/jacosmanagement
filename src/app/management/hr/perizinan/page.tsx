import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Perizinan HR - JACOS HR Management",
};

export default function HrPerizinanPage() {
  return (
    <UnderDevelopment
      title="Manajemen Perizinan HR"
      category="Kepegawaian HR"
      description="Pusat validasi dan penyetujuan surat permohonan izin, sakit, cuti, dan tugas dinas dari divisi HR."
      iconName="calendar-days"
      expectedFeatures={[
        "Panel approval cepat untuk Manager HR / Kepala Sekolah",
        "Kalkulasi sisa kuota cuti tahunan pegawai secara realtime",
        "Penanganan izin sakit dengan verifikasi surat medis resmi",
        "Export laporan perizinan terintegrasi dengan penggajian"
      ]}
    />
  );
}
