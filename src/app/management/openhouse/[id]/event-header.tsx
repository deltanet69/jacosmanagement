'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Clipboard,
  Check,
  QrCode,
  Share2,
  Calendar,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { formatIndoDate, type OpenHouseEvent } from '../event-store';

export default function OpenHouseEventHeader({ event }: { event: OpenHouseEvent }) {
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const getFullUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/openhouse/${event.slug}`;
    }
    return `/openhouse/${event.slug}`;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getFullUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWA = () => {
    const fullUrl = getFullUrl();
    const text = `Assalamu'alaikum Wr. Wb. Ayah & Bunda, ikuti acara ${event.name} di Jakarta Cosmopolite Islamic School (JACOS). Formulir pendaftaran resmi: ${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-ink/10 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Navigation Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/management/openhouse"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-sky hover:text-sky-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Semua Event Open House</span>
          </Link>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              event.is_active ? 'bg-leaf-50 text-leaf-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                event.is_active ? 'bg-leaf animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            {event.is_active ? 'Form Publik Aktif' : 'Form Ditutup'}
          </span>
        </div>

        {/* Main Content Info */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {event.banner_url ? (
            <div className="relative w-full lg:w-72 h-44 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-xs">
              <img
                src={event.banner_url}
                alt={`Banner ${event.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-sky font-bold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                /openhouse/{event.slug}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-ink-400 leading-relaxed max-w-3xl">
              {event.description}
            </p>

            {/* Schedules */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-300">
                Jadwal & Sesi Terdaftar:
              </p>
              <div className="flex flex-wrap gap-2">
                {event.event_dates && event.event_dates.length > 0 ? (
                  event.event_dates.map((sch, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-cloud px-3 py-1.5 rounded-xl text-xs font-semibold text-ink border border-ink/5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                      <span>{formatIndoDate(sch.date)}</span>
                      <span className="text-ink-300">({sch.start_time} - {sch.end_time} WIB)</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-300 italic">Belum ada jadwal yang diset</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Link */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="rounded-2xl h-11 text-xs sm:text-sm font-bold gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4 text-sky" />}
              <span>{copied ? 'Link Disalin!' : 'Salin Link Pendaftaran'}</span>
            </Button>

            {/* Open QR Modal */}
            <Button
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="rounded-2xl h-11 text-xs sm:text-sm font-bold gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-gold-600" />
              <span>QR Code</span>
            </Button>

            {/* Share WhatsApp */}
            <button
              type="button"
              onClick={handleShareWA}
              className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-2xl h-11 px-4 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share ke WA</span>
            </button>
          </div>

          {/* Open Public Form Button */}
          <a
            href={`/openhouse/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-ink hover:bg-ink/90 text-white rounded-2xl h-11 px-5 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <span>Buka Form Publik</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* QR Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 text-center shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky">QR Code Registrasi</span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-cloud text-ink-400 hover:bg-ink hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-ink">{event.name}</h4>
              <p className="text-xs text-ink-400 mt-0.5">Scan untuk membuka formulir pendaftaran</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mx-auto w-fit">
              <QRCodeSVG
                value={origin ? `${origin}/openhouse/${event.slug}` : `/openhouse/${event.slug}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="font-mono text-xs text-ink-400 bg-cloud p-2.5 rounded-xl break-all">
              {origin ? `${origin}/openhouse/${event.slug}` : `/openhouse/${event.slug}`}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="rounded-2xl h-10 text-xs font-bold cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 mr-1.5" /> Salin Link
              </Button>
              <Button
                onClick={handleShareWA}
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl h-10 text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share WA
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
