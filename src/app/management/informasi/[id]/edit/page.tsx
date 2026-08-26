import { notFound } from "next/navigation";
import { getAnnouncementById, getSchoolClasses } from "../../actions";
import { FormInformasi } from "../../form-informasi";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Informasi - JACOS Management",
  description: "Ubah detail informasi dan kegiatan"
};

export default async function EditInformasiPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [announcementRes, classes] = await Promise.all([
    getAnnouncementById(id),
    getSchoolClasses()
  ]);

  if (!announcementRes.success || !announcementRes.data) {
    notFound();
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header Info */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-wider mb-2 border border-sky-100">
          Ubah Pengumuman
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Edit Informasi & <span className="text-sky">Kegiatan</span>
        </h1>
        <p className="text-ink-400 mt-2 text-base">
          Perbarui konten atau target penerima untuk pengumuman ini.
        </p>
      </div>

      {/* Form Component */}
      <FormInformasi
        initialData={announcementRes.data}
        classes={classes}
        isEdit={true}
      />
    </div>
  );
}
