import { UnderDevelopment } from "@/components/shared/UnderDevelopment";

export const metadata = {
  title: "Dashboard Utama HR - JACOS HR Management",
};

export default function HrDashboardPage() {
  return (
    <UnderDevelopment
      title="Dashboard Utama HR Management"
      category="HR Management"
      description="Pusat kendali dan ringkasan eksekutif sumber daya manusia, statistik pegawai, distribusi produktivitas, dan pengumuman HR."
      iconName="dashboard"
      expectedFeatures={[
        "Metrik jumlah staf, rasio keaktifan guru, dan turnover pegawai",
        "Widget persetujuan cepat (Pending Izin, Lembur, dan Reimbursement)",
        "Kalender acara internal HR, evaluasi KPI, dan ulang tahun pegawai",
        "Grafik tren produktivitas dan kehadiran bulanan"
      ]}
    />
  );
}
