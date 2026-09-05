import { getHrDashboardData } from "./actions";
import HrDashboardClient from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard HR - JACOS HR Management",
  description: "Dashboard overview HR dan manajemen kepegawaian Jakarta Cosmopolite Islamic School",
};

export default async function HrDashboardPage() {
  const initialData = await getHrDashboardData();

  return <HrDashboardClient initialData={initialData} />;
}
