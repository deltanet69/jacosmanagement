import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, CalendarDays, Sparkles, Calendar, Clock, MapPin } from 'lucide-react';
import { getOpenHouseEvents } from '@/app/management/openhouse/event-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilih Jadwal Open House - Jakarta Cosmopolite Islamic School',
  description:
    'Pilih dan daftarkan kehadiran Anda di acara JACOS Open House untuk jenjang Kindergarten dan Primary School.',
};

export default async function OpenHouseCatalogPage() {
  const events = (await getOpenHouseEvents()).filter((event) => event.is_active);

  return (
    <main className="min-h-[100dvh] bg-[#F7F9FD] text-ink selection:bg-sky selection:text-white relative overflow-x-hidden">
      {/* Decorative Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-gold-50/20 to-transparent opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-coral-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">
        {/* Navigation / Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group transition">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={150}
              height={42}
              style={{ width: 'auto', height: 'auto' }}
              className="h-auto w-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-leaf-50 text-leaf-700 border border-leaf-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-leaf animate-pulse"></span>
              Pendaftaran Terbuka
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-coral-50 border border-coral-100 text-coral-600 text-xs font-bold px-3.5 py-1 rounded-full shadow-xs">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>JACOS Discovery Day</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-ink leading-[1.1]">
            Pilih Jadwal Open House Pilihan Anda.
          </h1>
          <p className="text-base sm:text-lg text-ink-400 leading-relaxed max-w-2xl">
            Kenali lingkungan belajar berstandar internasional, kurikulum integrasi Islami & trilingual, serta tim pimpinan akademik JACOS secara langsung.
          </p>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/openhouse/${event.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-sky/40 flex flex-col justify-between"
              >
                <div>
                  {event.banner_url ? (
                    <div className="relative aspect-[16/8] w-full overflow-hidden bg-slate-100">
                      <img
                        src={event.banner_url}
                        alt={`Banner ${event.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full">
                        E-Ticket VIP
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-r from-sky via-sky-600 to-indigo-700 p-6 flex items-start justify-between text-white">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold-200 bg-white/20 px-2.5 py-0.5 rounded-full">
                          Open House Pass
                        </span>
                        <p className="font-display text-lg font-bold mt-2 text-white">JACOS Discovery Day</p>
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-2xl font-bold text-ink group-hover:text-sky transition-colors">
                        {event.name}
                      </h2>
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky group-hover:bg-sky group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-ink-400">
                      {event.description}
                    </p>

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-300">
                        Jadwal Pelaksanaan:
                      </p>
                      {event.event_dates && event.event_dates.length > 0 ? (
                        event.event_dates.map((sch, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink"
                          >
                            <Calendar className="w-4 h-4 text-gold-600 shrink-0" />
                            <span>{sch.date}</span>
                            <span className="text-ink-300 font-normal">
                              ({sch.start_time} - {sch.end_time} WIB)
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-ink-300 italic">Jadwal akan diumumkan segera</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="w-full h-12 rounded-2xl bg-cloud group-hover:bg-sky group-hover:text-white text-ink text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <span>Daftar Sekarang (100% Free)</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mx-auto">
              <CalendarDays className="w-7 h-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">Belum ada Open House yang aktif</h2>
            <p className="text-sm text-ink-400 max-w-md mx-auto leading-relaxed">
              Jadwal gelombang Open House berikutnya sedang disiapkan. Pantau terus akun Instagram resmi kami @jacos.school.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-white py-10 mt-16 text-center text-xs text-ink-300">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <p className="font-medium text-ink-400">
            Jakarta Cosmopolite Islamic School (JACOS) — Nurturing Faithful, Globally-Minded Leaders
          </p>
          <p>© {new Date().getFullYear()} JACOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
