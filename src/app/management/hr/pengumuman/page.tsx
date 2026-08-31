import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Pengumuman HR - JACOS HR Management",
};

export default function HrPengumumanPage() {
  return (
    <UnderDevelopment
      title="Manajemen Pengumuman HR"
      category="HR Management"
      description="Penerbitan surat edaran internal, kebijakan sumber daya manusia, pengumuman libur nasional, dan kabar staf sekolah."
      iconName="megaphone"
      expectedFeatures={[
        "Pembuatan edaran HR kaya teks (Rich Text) & lampiran dokumen PDF",
        "Target penyiaran pengumuman (Semua Pegawai, Guru Saja, Staf TU)",
        "Tracking pembacaan surat edaran oleh pegawai",
        "Penjadwalan otomatis publikasi edaran internal"
      ]}
    />
  );
}
