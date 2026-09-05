import { getAdminDashboardData } from "./actions";
import DashboardClient from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Overview - JACOS Management",
  description: "Dashboard overview operasional harian Jakarta Cosmopolite Islamic School",
};

export default async function DashboardPage() {
  const initialData = await getAdminDashboardData();

  return <DashboardClient initialData={initialData} />;
}
