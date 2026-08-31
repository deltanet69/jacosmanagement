import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Reimburse HR - JACOS HR Management",
};

export default function HrReimbursePage() {
  return (
    <UnderDevelopment
      title="Persetujuan Reimburse HR"
      category="Administrasi HR"
      description="Verifikasi akhir klaim pengeluaran staf dan biaya dinas sebelum diproses oleh tim keuangan."
      iconName="file-text"
      expectedFeatures={[
        "Pemeriksaan keabsahan dokumen bukti transaksi dan nota",
        "Pengelompokan jenis klaim (Transportasi, Pengajaran, Medis)",
        "Otorisasi pencairan dana bertingkat HR & Finance",
        "Pencatatan riwayat klaim per individu pegawai"
      ]}
    />
  );
}
