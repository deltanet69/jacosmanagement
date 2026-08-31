import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Perizinan Kepegawaian - JACOS Admin",
};

export default function PerizinanAdminPage() {
  return (
    <UnderDevelopment
      title="Perizinan Staff & Guru"
      category="Kepegawaian"
      description="Pengelolaan permohonan izin tidak masuk, sakit, cuti tahunan, dan tugas luar sekolah bagi tenaga pengajar dan staf."
      iconName="calendar-days"
      expectedFeatures={[
        "Form pengajuan izin & lampiran surat keterangan medis/dinas",
        "Sistem penjadwalan guru pengganti (Inval) otomatis",
        "Kuota cuti tahunan pegawai dan kuota izin sakit",
        "Export laporan perizinan bulanan untuk audit HR"
      ]}
    />
  );
}
