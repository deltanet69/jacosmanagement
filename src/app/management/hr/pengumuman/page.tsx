import { getHrAnnouncements, HrAnnouncementRecord } from "./actions";
import { PengumumanListClient } from "@/components/hr/PengumumanListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengumuman HR - JACOS Management",
  description: "Pusat informasi, regulasi, dan pengumuman resmi HR JACOS",
};

export default async function PengumumanPage() {
  const result = await getHrAnnouncements({ includeArchived: true });

  const initialAnnouncements: HrAnnouncementRecord[] = result.success ? result.data : [];
  const totalEmployees: number = result.totalEmployees || 0;

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <PengumumanListClient 
        initialData={initialAnnouncements} 
        totalEmployeesCount={totalEmployees} 
      />
    </div>
  ); 
}
