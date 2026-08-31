import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Rekap Kehadiran - JACOS Admin",
};

export default function RekapKehadiranPage() {
  return (
    <UnderDevelopment
      title="Rekap Kehadiran Kepegawaian"
      category="Kepegawaian"
      description="Pencatatan dan rekapitulasi kehadiran harian guru dan staf administrasi berbasis presensi digital dan GPS."
      iconName="clock"
      expectedFeatures={[
        "Monitoring jam masuk dan jam pulang real-time",
        "Integrasi mesin presensi fingerprint / biometric & mobile app",
        "Rekap persentase tingkat kehadiran per unit / departemen",
        "Sinkronisasi data kehadiran ke perhitungan insentif & penggajian"
      ]}
    />
  );
}
