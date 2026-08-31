import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "eSaldo Jacos - JACOS Admin",
};

export default function ESaldoPage() {
  return (
    <UnderDevelopment
      title="eSaldo Jacos"
      category="Finance"
      description="Sistem dompet digital internal siswa untuk transaksi di kantin, koperasi, dan kebutuhan operasional sekolah berbasis RFID/NFC."
      iconName="wallet"
      expectedFeatures={[
        "Top-up eSaldo oleh orang tua melalui Parent Portal",
        "Pencatatan riwayat transaksi kantin & belanja sekolah",
        "Pembatasan limit harian belanja yang diatur orang tua",
        "Export laporan arus kas eSaldo mingguan/bulanan"
      ]}
    />
  );
}
