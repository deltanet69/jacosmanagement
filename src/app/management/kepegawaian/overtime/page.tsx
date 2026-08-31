import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Overtime Kepegawaian - JACOS Admin",
};

export default function OvertimeAdminPage() {
  return (
    <UnderDevelopment
      title="Overtime (Jam Lembur) Staff & Guru"
      category="Kepegawaian"
      description="Pencatatan jam kerja lembur pegawai untuk kegiatan ekstrakurikuler, rapat wali murid, dan event khusus sekolah."
      iconName="briefcase"
      expectedFeatures={[
        "Pengajuan Surat Perintah Kerja Lembur (SPKL)",
        "Perhitungan tarif lembur otomatis berdasarkan aturan sekolah",
        "Persetujuan lembur oleh koordinator bidang / kepala sekolah",
        "Rekapitulasi jam lembur bulanan untuk payroll"
      ]}
    />
  );
}
