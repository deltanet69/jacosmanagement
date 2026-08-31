import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "KPI Staff - JACOS HR Management",
};

export default function HrKpiPage() {
  return (
    <UnderDevelopment
      title="KPI Staff & Penilaian Performa"
      category="Kepegawaian HR"
      description="Evaluasi Key Performance Indicator (KPI) berkala bagi guru dan staf administrasi untuk penilaian kinerja dan bonus."
      iconName="trending-up"
      expectedFeatures={[
        "Form penilaian indikator kinerja kuantitatif dan kualitatif",
        "Penilaian 360 derajat (Self, Atasan Langsung, & Rekan Kerja)",
        "Grafik radar indikator kompetensi dan pencapaian target kerja",
        "Rekomendasi pengembangan kompetensi & pelatihan pegawai"
      ]}
    />
  );
}
