import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Reimbursement Kepegawaian - JACOS Admin",
};

export default function ReimbursementAdminPage() {
  return (
    <UnderDevelopment
      title="Reimbursement Kepegawaian"
      category="Kepegawaian"
      description="Pengajuan dan verifikasi pencairan dana reimbursement kegiatan pengajaran, operasional kelas, dan perlengkapan guru."
      iconName="file-text"
      expectedFeatures={[
        "Upload bukti nota / struk belanja kegiatan sekolah",
        "Alur persetujuan bertingkat (Kepala Sekolah & Bendahara)",
        "Notifikasi status pencairan dana langsung ke pegawai",
        "Pencatatan saldo anggaran per mata pelajaran / divisi"
      ]}
    />
  );
}
