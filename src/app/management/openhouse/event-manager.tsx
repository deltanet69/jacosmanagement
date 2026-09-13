'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDays,
  Check,
  Clipboard,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Share2,
  Trash2,
  Users,
  X,
  Search,
  Sparkles,
  Calendar,
  Clock,
  Download,
  Printer,
  CheckCircle2,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  createOpenHouseEvent,
  deleteOpenHouseEvent,
  toggleOpenHouseEvent,
  updateOpenHouseEvent,
  uploadOpenHouseBanner,
} from './event-actions';
import { slugify, type OpenHouseEvent, type OpenHouseSchedule } from './event-store';

const emptySchedule: OpenHouseSchedule = {
  date: 'Sabtu, 29 Agustus 2026',
  start_time: '08:30',
  end_time: '10:00',
};

export default function OpenHouseEventManager({
  initialEvents = [],
}: {
  initialEvents: OpenHouseEvent[];
}) {
  const [events, setEvents] = useState<OpenHouseEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [origin, setOrigin] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OpenHouseEvent | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<OpenHouseEvent | null>(null);
  const [deleteModalEvent, setDeleteModalEvent] = useState<OpenHouseEvent | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [description, setDescription] = useState('');
  const [schedules, setSchedules] = useState<OpenHouseSchedule[]>([{ ...emptySchedule }]);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Loading & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Hydration-safe origin setup
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Auto dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFormOpen(false);
        setQrModalEvent(null);
        setDeleteModalEvent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Create Form
  const openCreateModal = () => {
    setEditingEvent(null);
    setName('');
    setSlug('');
    setIsCustomSlug(false);
    setDescription(
      'Temukan lingkungan belajar islami terpadu dan trilingual bertaraf internasional. Ikuti School Tour, Kids Trial Class, serta konsultasi program bersama tim pimpinan akademik JACOS.'
    );
    setSchedules([
      { date: 'Sabtu, 29 Agustus 2026', start_time: '08:30', end_time: '10:00' },
      { date: 'Ahad, 30 Agustus 2026', start_time: '10:30', end_time: '12:00' },
    ]);
    setBannerUrl(null);
    setIsActive(true);
    setFormOpen(true);
  };

  // Open Edit Form
  const openEditModal = (evt: OpenHouseEvent) => {
    setEditingEvent(evt);
    setName(evt.name);
    setSlug(evt.slug);
    setIsCustomSlug(true);
    setDescription(evt.description);
    setSchedules(
      evt.event_dates && evt.event_dates.length > 0
        ? evt.event_dates.map((s) => ({ ...s }))
        : [{ ...emptySchedule }]
    );
    setBannerUrl(evt.banner_url || null);
    setIsActive(evt.is_active);
    setFormOpen(true);
  };

  // Handle banner upload
  const handleBannerUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const data = new FormData();
      data.set('file', file);
      const res = await uploadOpenHouseBanner(data);
      if (res.success && res.url) {
        setBannerUrl(res.url);
        setFeedback({ type: 'success', message: 'Banner berhasil diunggah' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal mengunggah banner' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan saat unggah banner' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Save Event (Create / Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (schedules.length === 0) {
      setFeedback({ type: 'error', message: 'Tambahkan minimal satu jadwal pelaksanaan acara.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      name: name.trim(),
      slug: isCustomSlug && slug.trim() ? slugify(slug.trim()) : slugify(name.trim()),
      description: description.trim(),
      banner_url: bannerUrl,
      event_dates: schedules,
      is_active: isActive,
    };

    try {
      if (editingEvent) {
        const res = await updateOpenHouseEvent(editingEvent.id, payload);
        if (res.success && res.event) {
          setEvents((prev) =>
            prev.map((item) =>
              item.id === res.event!.id ? { ...res.event!, audience_count: item.audience_count } : item
            )
          );
          setFormOpen(false);
          setFeedback({ type: 'success', message: `Event "${res.event.name}" berhasil diperbarui!` });
        } else {
          setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui event.' });
        }
      } else {
        const res = await createOpenHouseEvent(payload);
        if (res.success && res.event) {
          setEvents((prev) => [res.event!, ...prev]);
          setFormOpen(false);
          setFeedback({ type: 'success', message: `Event "${res.event.name}" berhasil dibuat!` });
        } else {
          setFeedback({ type: 'error', message: res.message || 'Gagal membuat event.' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan pada sistem.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (evt: OpenHouseEvent) => {
    const nextState = !evt.is_active;
    try {
      const res = await toggleOpenHouseEvent(evt.id, nextState);
      if (res.success) {
        setEvents((prev) =>
          prev.map((item) => (item.id === evt.id ? { ...item, is_active: nextState } : item))
        );
        setFeedback({
          type: 'success',
          message: `Status event "${evt.name}" diubah menjadi ${nextState ? 'Aktif' : 'Nonaktif'}.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal mengubah status event.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Gagal mengubah status event.' });
    }
  };

  // Delete event confirmation
  const handleConfirmDelete = async () => {
    if (!deleteModalEvent) return;
    try {
      const res = await deleteOpenHouseEvent(deleteModalEvent.id);
      if (res.success) {
        setEvents((prev) => prev.filter((item) => item.id !== deleteModalEvent.id));
        setFeedback({ type: 'success', message: `Event "${deleteModalEvent.name}" berhasil dihapus.` });
        setDeleteModalEvent(null);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus event.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kendala saat menghapus event.' });
    }
  };

  // Copy link helper
  const handleCopyLink = async (evt: OpenHouseEvent) => {
    const fullUrl = `${window.location.origin}/openhouse/${evt.slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(evt.slug);
    setFeedback({ type: 'success', message: `Link publik untuk "${evt.name}" berhasil disalin!` });
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (evt: OpenHouseEvent) => {
    const fullUrl = `${window.location.origin}/openhouse/${evt.slug}`;
    const text = `Assalamu'alaikum Wr. Wb. Ayah & Bunda, ikuti acara ${evt.name} di Jakarta Cosmopolite Islamic School (JACOS). Daftar online di link berikut: ${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Add schedule row
  const addScheduleRow = () => {
    setSchedules((prev) => [
      ...prev,
      { date: 'Sabtu, 29 Agustus 2026', start_time: '08:30', end_time: '10:00' },
    ]);
  };

  // Remove schedule row
  const removeScheduleRow = (index: number) => {
    if (schedules.length <= 1) return;
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  // Update schedule row
  const updateSchedule = (index: number, field: keyof OpenHouseSchedule, val: string) => {
    setSchedules((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        evt.name.toLowerCase().includes(q) ||
        evt.slug.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && evt.is_active) ||
        (statusFilter === 'INACTIVE' && !evt.is_active);

      return matchSearch && matchStatus;
    });
  }, [events, searchQuery, statusFilter]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => e.is_active).length;
    const totalAudience = events.reduce((acc, curr) => acc + (curr.audience_count || 0), 0);
    const totalSchedules = events.reduce((acc, curr) => acc + (curr.event_dates?.length || 0), 0);
    return { totalEvents, activeEvents, totalAudience, totalSchedules };
  }, [events]);

  return (
    <div className="space-y-8 pb-16 font-body">
      {/* 1. TOP HEADER & KPI HERO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/10 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-8 h-8 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-gold-600" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky">
              JACOS Open House Workspace
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Daftar Event & Listing Open House
          </h1>
          <p className="text-ink-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Kelola acara Open House mandiri dengan link publik, QR Code, dan listing pendaftar terpisah untuk setiap event.
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl shadow-sm h-12 px-6 cursor-pointer shrink-0 transition-transform active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Buat Open House Baru</span>
        </Button>
      </div>

      {/* FEEDBACK TOAST / ALERT */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-coral-50 border-coral-200 text-coral-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-coral-600 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. OVERALL KPI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mb-3 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Total Event</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-ink mt-0.5">
            {overallStats.totalEvents}
          </p>
          <p className="text-[11px] text-ink-400 mt-1">Acara dibuat di sistem</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mb-3 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-leaf animate-pulse"></span>
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Event Aktif</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-leaf-600 mt-0.5">
            {overallStats.activeEvents}
          </p>
          <p className="text-[11px] text-ink-400 mt-1">Form publik dapat diakses</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mb-3 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Total Audience</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-gold-600 mt-0.5">
            {overallStats.totalAudience}
          </p>
          <p className="text-[11px] text-ink-400 mt-1">Pendaftar seluruh event</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Jadwal Sesi</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-purple-600 mt-0.5">
            {overallStats.totalSchedules}
          </p>
          <p className="text-[11px] text-ink-400 mt-1">Sesi pelaksanaan tersedia</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/10 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input
            type="text"
            placeholder="Cari nama event, deskripsi, atau link slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-sm"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-ink text-white shadow-xs'
                : 'bg-cloud text-ink-400 hover:text-ink'
            }`}
          >
            Semua ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-leaf text-white shadow-xs'
                : 'bg-cloud text-ink-400 hover:text-leaf-600'
            }`}
          >
            Aktif ({events.filter((e) => e.is_active).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-cloud text-ink-400 hover:text-ink'
            }`}
          >
            Nonaktif ({events.filter((e) => !e.is_active).length})
          </button>
        </div>
      </div>

      {/* 4. EVENT CARDS GRID */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-ink">Tidak ada event Open House</h3>
          <p className="text-sm text-ink-400 max-w-md mx-auto">
            {searchQuery
              ? 'Tidak ditemukan event yang cocok dengan kata kunci pencarian.'
              : 'Belum ada event yang dibuat. Klik tombol "Buat Open House Baru" untuk memulai.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={openCreateModal}
              className="bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl px-5 h-11 text-xs sm:text-sm mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Buat Event Sekarang
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((evt) => {
            return (
              <div
                key={evt.id}
                className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md hover:border-sky/40 group"
              >
                {/* Event Card Top / Banner */}
                <div>
                  {evt.banner_url ? (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={evt.banner_url}
                        alt={`Banner ${evt.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                            evt.is_active
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              evt.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'
                            }`}
                          ></span>
                          {evt.is_active ? 'Form Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="font-mono text-xs text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                          /openhouse/{evt.slug}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-28 w-full bg-gradient-to-r from-sky via-sky-600 to-indigo-700 p-5 flex items-start justify-between text-white">
                      <div>
                        <span className="inline-block bg-white/20 text-gold-200 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1">
                          JACOS Open House Event
                        </span>
                        <p className="font-mono text-xs text-white/80">/openhouse/{evt.slug}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                          evt.is_active
                            ? 'bg-leaf-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            evt.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'
                          }`}
                        ></span>
                        {evt.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  )}

                  {/* Body Info */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-bold text-ink group-hover:text-sky transition-colors">
                          {evt.name}
                        </h3>
                        <p className="text-xs text-ink-400 mt-1 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                      {/* Audience Badge */}
                      <Link
                        href={`/management/openhouse/${evt.id}`}
                        title="Lihat Data Pendaftar"
                        className="shrink-0 bg-sky-50 hover:bg-sky-100 text-sky px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition text-xs font-bold"
                      >
                        <Users className="w-4 h-4 text-sky" />
                        <span>{evt.audience_count || 0} Pendaftar</span>
                      </Link>
                    </div>

                    {/* Schedules Tags */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-300">
                        Jadwal & Sesi Pelaksanaan:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {evt.event_dates && evt.event_dates.length > 0 ? (
                          evt.event_dates.map((sch, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 bg-cloud px-3 py-1.5 rounded-xl text-xs font-medium text-ink border border-ink/5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                              <span>{sch.date}</span>
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

                {/* Card Action Bar */}
                <div className="p-5 bg-slate-50/70 border-t border-ink/5 flex flex-wrap items-center justify-between gap-2.5">
                  {/* Primary: View Audience */}
                  <Link
                    href={`/management/openhouse/${evt.id}`}
                    className="inline-flex items-center gap-2 bg-sky hover:bg-sky-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>Detail & Audience</span>
                  </Link>

                  {/* Secondary Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Copy Link */}
                    <button
                      type="button"
                      title="Salin Link Pendaftaran"
                      onClick={() => handleCopyLink(evt)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-ink-400 hover:text-sky hover:border-sky/40 transition cursor-pointer"
                    >
                      {copiedSlug === evt.slug ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clipboard className="w-4 h-4" />
                      )}
                    </button>

                    {/* Open Public Page */}
                    <a
                      href={`/openhouse/${evt.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka Form Publik di Tab Baru"
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-ink-400 hover:text-sky hover:border-sky/40 transition cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* QR Code */}
                    <button
                      type="button"
                      title="Tampilkan QR Code"
                      onClick={() => setQrModalEvent(evt)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-ink-400 hover:text-gold-600 hover:border-gold/40 transition cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {/* WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(evt)}
                      title="Bagikan Link ke WhatsApp"
                      className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      title="Edit Event"
                      onClick={() => openEditModal(evt)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-ink-400 hover:text-ink hover:border-slate-400 transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      title="Hapus Event"
                      onClick={() => setDeleteModalEvent(evt)}
                      className="p-2.5 rounded-xl bg-coral-50 border border-coral-100 text-coral hover:bg-coral hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL FORM: CREATE / EDIT OPEN HOUSE EVENT */}
      {/* ============================================================ */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky">
                  {editingEvent ? 'Edit Open House' : 'Buat Event Baru'}
                </span>
                <h3 className="font-display text-2xl font-bold text-ink mt-0.5">
                  {editingEvent ? 'Perbarui Data Open House' : 'Formulir Buat Open House'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-9 h-9 rounded-xl bg-cloud text-ink-400 hover:bg-ink hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-left">
              {/* Field 1: Nama Event */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Nama Event Open House <span className="text-coral">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: JACOS Open House Primary & Kindergarten 2026"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isCustomSlug && !editingEvent) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  className="h-12 rounded-2xl bg-cloud border-slate-200 font-medium text-sm"
                />
              </div>

              {/* Field 2: Custom URL Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    URL Link Publik Open House <span className="text-coral">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSlug(!isCustomSlug)}
                    className="text-xs text-sky font-bold hover:underline cursor-pointer"
                  >
                    {isCustomSlug ? 'Otomatis dari Nama' : 'Kustomisasi URL Slug'}
                  </button>
                </div>
                <div className="flex items-center rounded-2xl bg-cloud border border-slate-200 px-4 h-12 text-sm">
                  <span className="text-ink-300 font-mono text-xs select-none">.../openhouse/</span>
                  <input
                    type="text"
                    required
                    placeholder="nama-event-openhouse"
                    value={slug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-xs font-bold text-ink pl-1"
                  />
                </div>
                <p className="text-[11px] text-ink-300">
                  Link ini akan menjadi alamat pendaftaran publik yang dibagikan ke calon wali murid.
                </p>
              </div>

              {/* Field 3: Deskripsi Event */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Deskripsi & Benefit Acara <span className="text-coral">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan mengenai agenda acara, School Tour, Trial Class, dan promo khusus open house..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-cloud border border-slate-200 text-sm font-medium text-ink outline-none focus:border-sky transition resize-y"
                />
              </div>

              {/* Field 4: Banner Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Banner Event (Opsional)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {bannerUrl ? (
                    <div className="relative w-full sm:w-48 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerUrl(null)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex-1 w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-sky p-4 rounded-2xl cursor-pointer bg-cloud/50 hover:bg-sky-50/50 transition">
                      <ImagePlus className="w-5 h-5 text-sky" />
                      <span className="text-xs font-bold text-ink">
                        {isUploadingBanner ? 'Mengunggah Banner...' : 'Pilih File Banner (JPG, PNG, WebP)'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploadingBanner}
                        onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar banner langsung di sini..."
                      value={bannerUrl || ''}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-cloud border border-slate-200 text-xs text-ink outline-none focus:border-sky"
                    />
                  </div>
                </div>
              </div>

              {/* Field 5: Set Hari & Tanggal Open House (Multiple Schedules) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      Jadwal Pelaksanaan (Multiple Bisa Ditambah) <span className="text-coral">*</span>
                    </label>
                    <p className="text-[11px] text-ink-300">
                      Pilihan jadwal ini akan otomatis muncul pada formulir pendaftaran publik.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addScheduleRow}
                    className="h-8 rounded-xl text-xs font-bold text-sky border-sky/30 hover:bg-sky-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Jadwal
                  </Button>
                </div>

                <div className="space-y-3">
                  {schedules.map((sch, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2.5 p-3 rounded-2xl bg-cloud border border-slate-200 items-center"
                    >
                      {/* Date */}
                      <div>
                        <span className="text-[10px] font-bold text-ink-300 uppercase block mb-1">
                          Hari & Tanggal #{idx + 1}
                        </span>
                        <input
                          type="date"
                          required
                          value={sch.date}
                          onChange={(e) => updateSchedule(idx, 'date', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-ink outline-none focus:border-sky"
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <span className="text-[10px] font-bold text-ink-300 uppercase block mb-1">
                          Jam Mulai
                        </span>
                        <input
                          type="time"
                          required
                          value={sch.start_time}
                          onChange={(e) => updateSchedule(idx, 'start_time', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-ink outline-none focus:border-sky"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <span className="text-[10px] font-bold text-ink-300 uppercase block mb-1">
                          Jam Selesai
                        </span>
                        <input
                          type="time"
                          required
                          value={sch.end_time}
                          onChange={(e) => updateSchedule(idx, 'end_time', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-ink outline-none focus:border-sky"
                        />
                      </div>

                      {/* Delete Row */}
                      <div className="flex sm:justify-center pt-2 sm:pt-4">
                        {schedules.length > 1 ? (
                          <button
                            type="button"
                            title="Hapus Jadwal"
                            onClick={() => removeScheduleRow(idx)}
                            className="p-2 text-coral hover:bg-coral-50 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="w-8"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field 6: Status Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-ink">Status Form Publik Aktif</p>
                  <p className="text-[11px] text-ink-300">
                    Jika aktif, orang tua dapat langsung mengisi form pendaftaran di URL publik.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-leaf"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-2xl h-11 px-5 font-bold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl h-11 px-6 shadow-sm cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : editingEvent ? (
                  'Simpan Perubahan'
                ) : (
                  'Buat Event Open House'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL: QR CODE EVENT */}
      {/* ============================================================ */}
      {qrModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 text-center shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky">QR Code Registrasi</span>
              <button
                type="button"
                onClick={() => setQrModalEvent(null)}
                className="w-8 h-8 rounded-xl bg-cloud text-ink-400 hover:bg-ink hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-ink">{qrModalEvent.name}</h4>
              <p className="text-xs text-ink-400 mt-0.5">Scan untuk membuka formulir pendaftaran</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mx-auto w-fit">
              <QRCodeSVG
                id={`qr-code-${qrModalEvent.slug}`}
                value={origin ? `${origin}/openhouse/${qrModalEvent.slug}` : `/openhouse/${qrModalEvent.slug}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="font-mono text-xs text-ink-400 bg-cloud p-2.5 rounded-xl break-all">
              {origin ? `${origin}/openhouse/${qrModalEvent.slug}` : `/openhouse/${qrModalEvent.slug}`}
            </p>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => handleCopyLink(qrModalEvent)}
                className="rounded-2xl h-10 text-xs font-bold cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 mr-1.5" /> Salin Link
              </Button>
              <Button
                onClick={() => handleShareWhatsApp(qrModalEvent)}
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl h-10 text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share WA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL: DELETE CONFIRMATION */}
      {/* ============================================================ */}
      {deleteModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-display font-bold text-xl text-ink">Hapus Event Open House?</h4>
              <p className="text-xs text-ink-400">
                Apakah Anda yakin ingin menghapus event <strong>"{deleteModalEvent.name}"</strong>? Link publik tidak akan dapat diakses lagi.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalEvent(null)}
                className="flex-1 rounded-2xl h-11 font-bold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-coral hover:bg-coral-600 text-white rounded-2xl h-11 font-bold cursor-pointer shadow-sm"
              >
                Ya, Hapus Event
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
