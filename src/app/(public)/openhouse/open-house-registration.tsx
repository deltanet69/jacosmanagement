'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  HeartHandshake,
  Check,
  Download,
  ArrowRight,
  Info,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitOpenHouseRegistration, type OpenHouseFormData, type OpenHouseRegistrationResult } from './actions';
import type { OpenHouseEvent } from '@/app/management/openhouse/event-store';

// Source Options
const SOURCE_OPTIONS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'WhatsApp',
  'Website JACOS',
  'Teman atau Keluarga',
  'Banner / Spanduk',
  'Google Search',
  'Lainnya',
];

// Topics of Interest
const TOPIC_OPTIONS = [
  'Kurikulum & Metode Belajar',
  'Program Trilingual / Bilingual',
  'Pendidikan Karakter Islami',
  'Fasilitas & Lingkungan Sekolah',
  'Trial Class & Aktivitas Siswa',
  'Guru & Academic Team',
  'Biaya Pendidikan & Investasi',
  'Promo & Special Offer',
  'Proses & Alur Pendaftaran',
  'Lainnya',
];

// Helper to format date if it's in YYYY-MM-DD format
const formatIndoDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function OpenHouseRegistration({ event }: { event: OpenHouseEvent }) {
  const firstSchedule = event.event_dates[0];
  const currentYearStr = String(new Date().getFullYear());
  const yearMatch = firstSchedule?.date.match(/\d{4}/);
  const entryYear = yearMatch ? yearMatch[0] : currentYearStr;
  const entryYears = [entryYear, String(Number(entryYear) + 1), String(Number(entryYear) + 2)];
  const [formData, setFormData] = useState<OpenHouseFormData>({
    event_slug: event.slug,
    parent_name: '',
    whatsapp: '',
    email: '',
    child_name: '',
    child_age: 5,
    target_program: 'Primary School',
    entry_year: entryYear,
    interest_attendance: 'Ya',
    attendance_date: firstSchedule?.date ? (firstSchedule.date.match(/^\d{4}-\d{2}-\d{2}$/) ? formatIndoDate(firstSchedule.date) : firstSchedule.date) : '',
    attendance_session: firstSchedule ? `${firstSchedule.start_time} - ${firstSchedule.end_time}` : '',
    source_info: 'Instagram',
    topics_of_interest: ['Kurikulum & Metode Belajar', 'Pendidikan Karakter Islami'],
    admission_consultation: 'Ya',
  });

  const [customEntryYear, setCustomEntryYear] = useState('');
  const [isCustomEntryYear, setIsCustomEntryYear] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<OpenHouseRegistrationResult['ticket'] | null>(null);

  // Toggle multi-select topics
  const toggleTopic = (topic: string) => {
    if (topic === 'Lainnya') {
      setIsCustomTopic(!isCustomTopic);
      return;
    }
    setFormData((prev) => {
      const exists = prev.topics_of_interest.includes(topic);
      if (exists) {
        return { ...prev, topics_of_interest: prev.topics_of_interest.filter((t) => t !== topic) };
      } else {
        return { ...prev, topics_of_interest: [...prev.topics_of_interest, topic] };
      }
    });
  };

  const handleSourceSelect = (source: string) => {
    if (source === 'Lainnya') {
      setIsCustomSource(true);
      setFormData((prev) => ({ ...prev, source_info: customSource || 'Lainnya' }));
    } else {
      setIsCustomSource(false);
      setFormData((prev) => ({ ...prev, source_info: source }));
    }
  };

  const handleEntryYearSelect = (year: string) => {
    if (year === 'Lainnya') {
      setIsCustomEntryYear(true);
      setFormData((prev) => ({ ...prev, entry_year: customEntryYear ? `Lainnya: ${customEntryYear}` : 'Lainnya' }));
    } else {
      setIsCustomEntryYear(false);
      setFormData((prev) => ({ ...prev, entry_year: year }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Compile final topics
      const finalTopics = [...formData.topics_of_interest];
      if (isCustomTopic && customTopic.trim()) {
        finalTopics.push(`Lainnya: ${customTopic.trim()}`);
      }

      // Compile final source
      let finalSource = formData.source_info;
      if (isCustomSource && customSource.trim()) {
        finalSource = `Lainnya: ${customSource.trim()}`;
      }

      // Compile final entry year
      let finalEntryYear = formData.entry_year;
      if (isCustomEntryYear && customEntryYear.trim()) {
        finalEntryYear = `Lainnya: ${customEntryYear.trim()}`;
      }

      const payload: OpenHouseFormData = {
        ...formData,
        source_info: finalSource,
        entry_year: finalEntryYear,
        topics_of_interest: finalTopics,
      };

      const res = await submitOpenHouseRegistration(payload);

      if (res.success && res.ticket) {
        setTicketResult(res.ticket);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan pendaftaran. Silakan periksa kembali isian Anda.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kendala teknis. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    const schedule = event.event_dates.find(({ date, start_time, end_time }) =>
      date === formData.attendance_date && `${start_time} - ${end_time}` === formData.attendance_session
    ) ?? firstSchedule;
    if (!schedule) return '#';

    const toUtc = (time: string) => new Date(`${schedule.date}T${time}:00+07:00`)
      .toISOString().replace(/[-:]/g, '').replace(/\.000Z$/, 'Z');
    const title = encodeURIComponent(event.name);
    const details = encodeURIComponent(
      `Kehadiran ${event.name}.\nKode Tiket: ${ticketResult?.ticketCode || '-'}\nCalon Siswa: ${formData.child_name}\nJenjang: ${formData.target_program}\nSesi: ${formData.attendance_session}`
    );
    const location = encodeURIComponent('Jakarta Cosmopolite Islamic School Campus');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toUtc(schedule.start_time)}/${toUtc(schedule.end_time)}&details=${details}&location=${location}`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7F9FD] text-[#16233D] overflow-x-hidden selection:bg-sky selection:text-white">
      {/* Decorative Star & Dot Backdrop Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/50 via-gold-50/20 to-transparent opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-coral-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-leaf-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* TOP FLOATING NAVBAR */}
      <header className="relative z-20 border-b border-ink/5 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={150}
              height={42}
              style={{ width: "auto", height: "auto" }}
              priority
              className="object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky px-3.5 py-1.5 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-sky animate-pulse"></span>
              {event.event_dates.map((schedule) => schedule.date).join(' · ') || 'Jadwal Open House'}
            </div>

            <a
              href="https://wa.me/6282140000477"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white px-4 py-2 rounded-full transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tanya Admin</span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {ticketResult ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
            {/* Success Celebration Alert */}
            <div className="bg-leaf-50 border border-leaf-100 rounded-3xl p-6 sm:p-8 text-center mb-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-leaf text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-leaf/20 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="inline-block bg-leaf/20 text-leaf-600 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2">
                Pendaftaran Berhasil Terkonfirmasi!
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-ink font-bold leading-tight mb-2">
                Sampai Jumpa di {event.name}
              </h2>
              <p className="text-ink-400 text-sm sm:text-base max-w-lg mx-auto">
                Terima kasih, <strong>{ticketResult.parentName}</strong>. E-Ticket VIP & jadwal kehadiran untuk{' '}
                <strong>{ticketResult.childName}</strong> telah berhasil diterbitkan.
              </p>
            </div>

            {/* THE TICKET CONTAINER */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-2xl overflow-hidden relative mb-8">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-sky to-sky-700 text-white p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-gold-100 bg-white/15 px-3 py-1 rounded-full">
                    VIP Admission Pass
                  </span>
                  <span className="text-xs font-semibold text-white/80">{event.name}</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Jakarta Cosmopolite Islamic School
                </h3>
                <p className="text-white/80 text-sm mt-1">Kindergarten & Primary School Discovery Day</p>
              </div>

              {/* Ticket Body with Cutouts */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* QR Code & Ticket Code Box */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-cloud border border-slate-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                    <QRCodeSVG
                      value={`${event.name}-${ticketResult.ticketCode}-${ticketResult.childName}`}
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-xs font-bold text-sky uppercase tracking-wider">Kode Tiket Registrasi</p>
                    <p className="font-mono font-black text-2xl sm:text-3xl text-ink tracking-wider">
                      {ticketResult.ticketCode}
                    </p>
                    <p className="text-xs text-ink-300">
                      Tunjukkan QR Code ini pada meja registrasi di lobi utama sekolah.
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-ink-300 font-semibold block mb-1">Nama Calon Siswa</span>
                    <p className="font-bold text-ink text-base">
                      {ticketResult.childName}{' '}
                      {ticketResult.childAge ? (
                        <span className="text-xs font-normal text-ink-400">({ticketResult.childAge} Tahun)</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-ink-300 font-semibold block mb-1">Jenjang & Tahun Masuk</span>
                    <p className="font-bold text-sky text-base">
                      {ticketResult.targetProgram}{' '}
                      <span className="text-xs font-semibold text-ink-400">({ticketResult.entryYear})</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-ink-300 font-semibold block mb-1">Tanggal Kehadiran</span>
                    <div className="flex items-center gap-2 font-bold text-gold-600">
                      <Calendar className="w-4 h-4 text-gold shrink-0" />
                      <span>{ticketResult.attendanceDate}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-ink-300 font-semibold block mb-1">Sesi Waktu</span>
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <Clock className="w-4 h-4 text-sky shrink-0" />
                      <span>{ticketResult.attendanceSession}</span>
                    </div>
                  </div>
                </div>

                {/* Event Highlights Reminder */}
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-sky-700 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-sky">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    Agenda & Fasilitas yang Didapatkan:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-ink-400 pl-1">
                    <li>School Tour & fasilitas kurikulum integrasi Islami</li>
                    <li>Interaktif Kids Trial Class & Character Playzone</li>
                    <li>Konsultasi personal dengan Kepala Sekolah & Tim Admission</li>
                    <li>Exclusive Open House Promo & Welcome Goodie Bag</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <a
                    href={`https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20sudah%20mendaftar%20Open%20House%20dengan%20Kode%20Tiket:%20${ticketResult.ticketCode}%20untuk%20${encodeURIComponent(ticketResult.childName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Konfirmasi Langsung ke WhatsApp Admission</span>
                  </a>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-ink border border-slate-200 font-bold py-3 px-4 rounded-2xl text-sm transition"
                    >
                      <CalendarPlus className="w-4 h-4 text-sky" />
                      <span>Simpan ke Google Calendar</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-ink border border-slate-200 font-bold py-3 px-4 rounded-2xl text-sm transition"
                    >
                      <Download className="w-4 h-4 text-gold-600" />
                      <span>Cetak / Simpan Tiket (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-coral" />
                  Kampus JACOS — Jakarta Cosmopolite Islamic School
                </span>
                <button
                  onClick={() => {
                    setTicketResult(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sky hover:underline font-semibold"
                >
                  + Daftarkan Ananda Lainnya
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM VIEW */
          <div className="space-y-10">
            {/* HERO SECTION */}
            <section className="text-center space-y-5 max-w-6xl mx-auto">
              {event.banner_url && (
                <div className="relative w-full max-h-[360px] rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 mb-4">
                  <img
                    src={event.banner_url}
                    alt={`Banner ${event.name}`}
                    className="w-full h-full object-cover max-h-[360px]"
                  />
                </div>
              )}

              <div className="inline-flex items-center gap-2 bg-coral-50 border border-coral-100 text-coral-600 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>JACOS Discovery Day</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-ink">
                {event.name}
              </h1>

              {/* Greeting & Description Accordion Style Box */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-sky-900/5 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0 mt-0.5">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">Assalamu&apos;alaikum Wr. Wb. Mommy & Daddy</h3>
                    <p className="text-ink-400 text-sm sm:text-base leading-relaxed mt-1">{event.description}</p>
                  </div>
                </div>

                {/* Event Schedule Bento Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3.5 bg-sky-50/80 border border-sky-100 p-3.5 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-sky text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-sky uppercase tracking-wider">Jadwal Acara</p>
                      {event.event_dates.map((schedule) => <p key={`${schedule.date}-${schedule.start_time}`} className="text-sm font-bold text-ink">{schedule.date}</p>)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 bg-gold-50/80 border border-gold-100 p-3.5 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-gold-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gold-600 uppercase tracking-wider">Pilihan Sesi</p>
                      {event.event_dates.map((schedule) => <p key={`${schedule.date}-${schedule.start_time}`} className="text-xs font-bold text-ink">{schedule.start_time}–{schedule.end_time} WIB</p>)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FORM CONTAINER */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-2xl p-6 sm:p-10 md:p-12 relative overflow-hidden">
              {/* Form Title & Instruction */}
              <div className="mb-10 text-center sm:text-left border-b border-slate-100 pb-6">
                <span className="text-sky font-extrabold text-xs uppercase tracking-widest block mb-1">
                  Registrasi Kehadiran
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
                  Formulir Pendaftaran Open House
                </h2>
                <p className="text-ink-400 text-sm mt-1.5">
                  Silakan lengkapi formulir di bawah ini untuk mengamankan tiket VIP & sesi konsultasi Ananda.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-8 p-4 rounded-2xl bg-coral-50 border border-coral-100 text-coral-600 text-sm flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-10">
                {/* 1. BAGIAN DATA ORANG TUA & ANAK */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <span className="w-7 h-7 rounded-full bg-sky text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      1
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">Informasi Orang Tua & Ananda</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Field 1: Parent Name */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        Nama Lengkap Orang Tua / Wali <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Mommy Aisyah Rahman"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        className="w-full mt-1 h-12 px-4 rounded-2xl border border-slate-200 bg-cloud/50 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-medium text-ink placeholder:text-slate-400"
                      />
                    </div>

                    {/* Field 2: WhatsApp Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        Nomor WhatsApp Aktif <span className="text-coral">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="081234567890"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full mt-1 h-12 px-4 rounded-2xl border border-slate-200 bg-cloud/50 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-medium text-ink placeholder:text-slate-400"
                        />
                      </div>
                      <span className="text-[11px] text-ink-300">Kami akan mengirimkan e-ticket konfirmasi via WhatsApp.</span>
                    </div>

                    {/* Field 3: Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        Email Aktif <span className="text-coral">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="daddy.mommy@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full mt-1 h-12 px-4 rounded-2xl border border-slate-200 bg-cloud/50 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-medium text-ink placeholder:text-slate-400"
                      />
                    </div>

                    {/* Field 4: Child Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        Nama Lengkap Ananda <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Rayyan Alfatih"
                        value={formData.child_name}
                        onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                        className="w-full mt-1 h-12 px-4 rounded-2xl border border-slate-200 bg-cloud/50 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-medium text-ink placeholder:text-slate-400"
                      />
                    </div>

                    {/* Field 5: Child Age */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                        Usia Ananda Saat Ini (Tahun)
                      </label>
                      <div className="flex items-center gap-2">
                        {[3, 4, 5, 6, 7, 8].map((age) => (
                          <button
                            key={age}
                            type="button"
                            onClick={() => setFormData({ ...formData, child_age: age })}
                            className={`flex-1 mt-1 h-12 rounded-2xl font-bold text-sm transition-all ${
                              formData.child_age === age
                                ? 'bg-sky text-white shadow-md shadow-sky/25 scale-[1.02]'
                                : 'bg-slate-100 text-ink-400 hover:bg-slate-200'
                            }`}
                          >
                            {age} Thn
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BAGIAN JENJANG & TAHUN MASUK */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <span className="w-7 h-7 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      2
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">Jenjang Pendidikan & Tahun Masuk</h3>
                  </div>

                  {/* Field 6: Target Program (Playful Cards) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Jenjang yang Diminati <span className="text-coral">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {/* Kindergarten Card */}
                      <div
                        onClick={() => setFormData({ ...formData, target_program: 'Kindergarten' })}
                        className={`cursor-pointer p-5 rounded-3xl border-2 transition-all flex items-start gap-4 ${
                          formData.target_program === 'Kindergarten'
                            ? 'border-gold bg-gold-50/60 shadow-lg shadow-gold/10 ring-2 ring-gold/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* <div className="w-12 h-12 rounded-2xl bg-gold text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                          🧸
                        </div> */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-base text-ink">Kindergarten</h4>
                            {formData.target_program === 'Kindergarten' && (
                              <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Playgroup & TK Islam Terpadu berfokus pada fitrah, adab, sensory, dan bilingual curiosity.
                          </p>
                        </div>
                      </div>

                      {/* Primary School Card */}
                      <div
                        onClick={() => setFormData({ ...formData, target_program: 'Primary School' })}
                        className={`cursor-pointer p-5 rounded-3xl border-2 transition-all flex items-start gap-4 ${
                          formData.target_program === 'Primary School'
                            ? 'border-sky bg-sky-50/60 shadow-lg shadow-sky/10 ring-2 ring-sky/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* <div className="w-12 h-12 rounded-2xl bg-sky text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                          🎓
                        </div> */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-base text-ink">Primary School</h4>
                            {formData.target_program === 'Primary School' && (
                              <span className="w-6 h-6 rounded-full bg-sky text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Sekolah Dasar Islam bertaraf internasional dengan kurikulum komprehensif & trilingual mastery.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 7: Entry Year (Selection Chips) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Akan Masuk JACOS Pada Tahun: <span className="text-coral">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {[...entryYears, 'Lainnya'].map((year) => {
                        const isSelected = isCustomEntryYear ? year === 'Lainnya' : formData.entry_year === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleEntryYearSelect(year)}
                            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                              isSelected
                                ? 'bg-ink text-white shadow-md scale-[1.02]'
                                : 'bg-slate-100 text-ink hover:bg-slate-200'
                            }`}
                          >
                            {year === 'Lainnya' ? 'Tahun Lainnya...' : `Tahun Ajaran ${year}`}
                          </button>
                        );
                      })}
                    </div>

                    {isCustomEntryYear && (
                      <input
                        type="text"
                        placeholder="Ketik tahun rencana masuk (contoh: 2029 / 2030)"
                        value={customEntryYear}
                        onChange={(e) => {
                          setCustomEntryYear(e.target.value);
                          setFormData({ ...formData, entry_year: `Lainnya: ${e.target.value}` });
                        }}
                        className="w-full mt-2 h-11 px-4 rounded-xl border border-slate-300 text-sm outline-none focus:border-sky"
                      />
                    )}
                  </div>
                </div>

                {/* 3. BAGIAN JADWAL KEHADIRAN OPEN HOUSE */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <span className="w-7 h-7 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      3
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">Konfirmasi Jadwal & Waktu Kehadiran</h3>
                  </div>

                  {/* Field 8: Interest in Attendance */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Apakah Mommny/Daddy berminat untuk datang ke Open House? <span className="text-coral">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md mt-2">
                      {['Ya', 'Tidak'].map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest_attendance: choice })}
                          className={`h-12 rounded-2xl font-bold text-sm transition-all ${
                            formData.interest_attendance === choice
                              ? choice === 'Ya'
                                ? 'bg-leaf text-white shadow-md shadow-leaf/20'
                                : 'bg-slate-700 text-white'
                              : 'bg-slate-100 text-ink hover:bg-slate-200'
                          }`}
                        >
                          {choice === 'Ya' ? 'Ya, Siap Hadir' : 'Belum Bisa Hadir'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* If Yes: Show Date and Session */}
                  {formData.interest_attendance === 'Ya' && (
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-5">
                      {/* Field 9: Date Attendance */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                          Akan Hadir Pada Tanggal: <span className="text-coral">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {event.event_dates.map((schedule) => {
                            const session = `${schedule.start_time} - ${schedule.end_time}`;
                            const displayDate = schedule.date.match(/^\d{4}-\d{2}-\d{2}$/) ? formatIndoDate(schedule.date) : schedule.date;
                            const selected = formData.attendance_date === displayDate && formData.attendance_session === session;

                            return (
                              <button
                                key={`${schedule.date}-${schedule.start_time}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, attendance_date: displayDate, attendance_session: session })}
                                className={`min-h-16 p-4 rounded-2xl text-left border font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${selected ? 'border-sky bg-sky text-white shadow-md shadow-sky/20' : 'border-slate-200 bg-white text-ink hover:border-slate-300'}`}
                              >
                                <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 shrink-0" /><span>{displayDate}<small className="mt-1 block font-medium opacity-80">{session} WIB</small></span></span>
                                {selected && <Check className="w-4 h-4 shrink-0 stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. BAGIAN INFORMASI MINAT & KONSULTASI */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <span className="w-7 h-7 rounded-full bg-leaf text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      4
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">Preferensi Informasi & Konsultasi</h3>
                  </div>

                  {/* Field 11: Source Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Dari mana mengetahui acara ini? <span className="text-coral">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-10">
                      {SOURCE_OPTIONS.map((src) => {
                        const isSelected = isCustomSource ? src === 'Lainnya' : formData.source_info === src;
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => handleSourceSelect(src)}
                            className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                              isSelected
                                ? 'bg-sky text-white shadow-sm'
                                : 'bg-slate-100 text-ink-400 hover:bg-slate-200'
                            }`}
                          >
                            {src}
                          </button>
                        );
                      })}
                    </div>

                    {isCustomSource && (
                      <input
                        type="text"
                        placeholder="Sebutkan sumber lainnya..."
                        value={customSource}
                        onChange={(e) => {
                          setCustomSource(e.target.value);
                          setFormData({ ...formData, source_info: `Lainnya: ${e.target.value}` });
                        }}
                        className="w-full mt-2 h-11 px-4 rounded-xl border border-slate-300 text-sm outline-none focus:border-sky"
                      />
                    )}
                  </div>

                  {/* Field 12: Topics of Interest (Multi Select) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Hal yang paling ingin diketahui selama Open House (Bisa pilih lebih dari satu):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                      {TOPIC_OPTIONS.map((topic) => {
                        const isSelected =
                          topic === 'Lainnya' ? isCustomTopic : formData.topics_of_interest.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`p-4 rounded-2xl text-left border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-sky-600 bg-sky-50 text-sky-700 font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-ink-400 hover:border-slate-300'
                            }`}
                          >
                            <span>{topic}</span>
                            <span
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-sky border-sky text-white' : 'border-slate-300 bg-slate-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isCustomTopic && (
                      <input
                        type="text"
                        placeholder="Tulis topik atau pertanyaan lainnya yang ingin dibahas..."
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="w-full mt-2 h-11 px-4 rounded-xl border border-slate-300 text-sm outline-none focus:border-sky"
                      />
                    )}
                  </div>

                  {/* Field 13: Admission Consultation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Apakah Ayah/Bunda ingin melakukan konsultasi pribadi dengan Tim Admission?{' '}
                      <span className="text-coral">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {['Ya', 'Mungkin', 'Tidak'].map((consult) => (
                        <button
                          key={consult}
                          type="button"
                          onClick={() => setFormData({ ...formData, admission_consultation: consult })}
                          className={`h-12 rounded-2xl font-bold text-sm transition-all ${
                            formData.admission_consultation === consult
                              ? 'bg-gold-600 text-white shadow-md shadow-gold/20'
                              : 'bg-slate-100 text-ink-400 hover:bg-slate-200'
                          }`}
                        >
                          {consult === 'Ya' ? '💬 Ya, Berminat' : consult === 'Mungkin' ? '🤔 Mungkin Nanti' : 'Tidak'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-sky via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-extrabold text-base shadow-xl shadow-sky/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menerbitkan VIP Pass & Mendaftarkan...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftarkan Kehadiran & Terbitkan E-Ticket</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-ink-300 mt-8">
                    🔒 Data Anda aman bersama JACOS. Tidak ada biaya registrasi (100% Free & Open for Public).
                  </p>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-ink/10 bg-white py-10 mt-16 text-center text-xs text-ink-300">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <div className="flex justify-center">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={120}
              height={34}
              style={{ width: "auto", height: "auto" }}
              className="object-contain opacity-75"
            />
          </div>
          <p className="font-medium text-ink-400">
            Jakarta Cosmopolite Islamic School (JACOS) — Nurturing Faithful, Globally-Minded Leaders
          </p>
          <p>© {new Date().getFullYear()} JACOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
