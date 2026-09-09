import { getGuestbookEntries } from "./actions";
import GuestbookClient from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buku Tamu (Guestbook) - JACOS Management",
  description: "Manajemen data calon wali murid & ananda yang berkunjung ke sekolah JACOS",
};

export default async function GuestbookAdminPage() {
  const { entries, stats } = await getGuestbookEntries();

  return (
    <GuestbookClient
      initialEntries={entries}
      initialStats={stats}
    />
  );
}
