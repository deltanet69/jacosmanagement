import { getAnnouncements, getSchoolClasses } from "./actions";
import InformasiClientPage from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Informasi & Kegiatan - JACOS Management",
  description: "Kelola pengumuman, berita sekolah, dan agenda kegiatan"
};

export default async function InformasiPage() {
  const [initialData, classes] = await Promise.all([
    getAnnouncements({ page: 1, limit: 12 }),
    getSchoolClasses()
  ]);

  return <InformasiClientPage initialData={initialData} classes={classes} />;
}
