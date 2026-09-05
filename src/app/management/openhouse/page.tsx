import { getOpenHouseRegistrations } from "./actions";
import OpenHouseClient from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Open House Leads - JACOS Management",
  description: "Manajemen data calon wali murid pendaftar Open House JACOS",
};

export default async function OpenHouseAdminPage() {
  const { registrations, stats, setting } = await getOpenHouseRegistrations();

  return (
    <OpenHouseClient
      initialRegistrations={registrations}
      initialStats={stats}
      initialSetting={setting}
    />
  );
}
