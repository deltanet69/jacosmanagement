import { getSchoolClasses } from "../actions";
import { FormInformasi } from "../form-informasi";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Informasi Baru - JACOS Management",
  description: "Formulir pembuatan informasi dan kegiatan baru"
};

export default async function TambahInformasiPage() {
  const classes = await getSchoolClasses();

  return (
    <div className="space-y-8 w-full">
      {/* Header Info */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-50 text-coral-600 text-xs font-bold uppercase tracking-wider mb-2 border border-coral-100">
          Publikasi Pengumuman
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Buat Informasi & <span className="text-coral">Kegiatan Baru</span>
        </h1>
        <p className="text-ink-400 mt-2 text-base">
          Tulis informasi atau jadwal kegiatan yang ingin disampaikan kepada orang tua murid.
        </p>
      </div>

      {/* Form Component */}
      <FormInformasi classes={classes} isEdit={false} />
    </div>
  );
}
