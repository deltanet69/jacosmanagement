import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Payslip Management - JACOS HR Management",
};

export default function HrPayslipPage() {
  return (
    <UnderDevelopment
      title="Payslip & Penggajian Staff"
      category="Administrasi HR"
      description="Penyusunan slip gaji, kalkulasi gaji pokok, tunjangan jabatan, potongan BPJS/PPh21, dan pengiriman otomatis ke akun pegawai."
      iconName="banknote"
      expectedFeatures={[
        "Kalkulator gaji otomatis terintegrasi absensi & lembur",
        "Generasi dokumen slip gaji PDF terenkripsi dengan PIN",
        "Pengiriman slip gaji via Email & WhatsApp terenkripsi",
        "Laporan rekapitulasi pengeluaran gaji (Payroll Summary)"
      ]}
    />
  );
}
