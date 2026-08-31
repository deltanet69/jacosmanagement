import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "SPP Sekolah - JACOS Admin",
};

export default function SppPage() {
  return (
    <UnderDevelopment
      title="Manajemen SPP Sekolah"
      category="Finance"
      description="Modul pengelolaan SPP bulanan siswa, histori pembayaran, penagihan otomatis, dan integrasi payment gateway."
      iconName="credit-card"
      expectedFeatures={[
        "Monitoring status pembayaran SPP per kelas dan angkatan",
        "Penagihan via Email & WhatsApp otomatis ke orang tua",
        "Pencatatan konfirmasi pembayaran otomatis via Midtrans",
        "Laporan rekapitulasi tunggakan dan penerimaan SPP"
      ]}
    />
  );
}
