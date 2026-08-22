import Link from "next/link";
import Image from "next/image";

export default function DaftarPPDB() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/publicjacos/logo.png"
            alt="JACOS Logo"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-black text-slate-800">
            Pendaftaran Melalui Link Khusus
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Halaman pendaftaran ini tidak tersedia secara umum. Pendaftaran siswa baru JACOS dilakukan melalui <strong>link unik</strong> yang dikirimkan oleh Admin JACOS langsung kepada Anda.
          </p>

          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-4 text-left space-y-2">
            <p className="text-sky-700 font-bold text-sm">📋 Langkah Pendaftaran:</p>
            <ol className="text-sky-600 text-sm space-y-1.5 list-decimal list-inside">
              <li>Hubungi pihak sekolah JACOS</li>
              <li>Admin akan membuat slot pendaftaran untuk anak Anda</li>
              <li>Link formulir unik akan dikirimkan via WhatsApp/Email</li>
              <li>Isi formulir lengkap melalui link tersebut</li>
            </ol>
          </div>

          <a
            href="https://wa.me/6282140000477"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-full justify-center h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-sm transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Hubungi Admin via WhatsApp
          </a>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Jakarta Cosmopolite Islamic School
        </p>
      </div>
    </div>
  );
}
