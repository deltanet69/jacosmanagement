import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Overtime Management - JACOS HR Management",
};

export default function HrOvertimePage() {
  return (
    <UnderDevelopment
      title="Overtime Management HR"
      category="Kepegawaian HR"
      description="Pengelolaan dan otorisasi kerja lembur bagi seluruh staf administrasi dan guru untuk acara sekolah."
      iconName="briefcase"
      expectedFeatures={[
        "Validasi pengajuan lembur berdasarkan rekomendasi atasan",
        "Penghitungan kompensasi lembur sesuai regulasi Ketenagakerjaan/Sekolah",
        "Statistik distribusi jam lembur per unit kerja",
        "Pencatatan persetujuan lembur ke laporan penggajian bulanan"
      ]}
    />
  );
}
