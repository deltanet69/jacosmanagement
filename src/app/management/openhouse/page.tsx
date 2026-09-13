import { getOpenHouseEvents } from "./event-actions";
import OpenHouseEventManager from "./event-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Open House - JACOS Management",
  description: "Kelola daftar event Open House, link publik, QR Code, dan data audience JACOS",
};

export default async function OpenHouseAdminPage() {
  const events = await getOpenHouseEvents();

  return (
    <div className="space-y-6">
      <OpenHouseEventManager initialEvents={events} />
    </div>
  );
}
