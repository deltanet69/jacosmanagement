"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Megaphone,
  BellRing,
  Calendar,
  Search,
  Globe,
  Users,
  Sparkles,
  BookOpen,
  Trophy,
  Palette,
  Eye,
  X,
  Radio,
  ArrowRight,
  Clock,
  ChevronRight,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { createParentClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getParentAnnouncements } from "@/app/parent-portal/actions";

interface Announcement {
  id: string;
  title: string;
  category: string;
  target_type: "GENERAL" | "SPECIFIC_CLASSES";
  target_classes: string[];
  thumbnail_url: string | null;
  content: string;
  is_published: boolean;
  created_at: string;
}

const CATEGORIES = [
  { key: "all", label: "Semua", icon: Sparkles, color: "bg-ink text-white" },
  { key: "Informasi Akademik", label: "Akademik", icon: BookOpen, color: "bg-sky text-white" },
  { key: "Informasi Non Akademik", label: "Non Akademik", icon: Palette, color: "bg-leaf text-white" },
  { key: "Informasi Kegiatan Sekolah", label: "Kegiatan Sekolah", icon: Megaphone, color: "bg-coral text-white" },
  { key: "Informasi Ekstrakurikuler", label: "Ekstrakurikuler", icon: Trophy, color: "bg-gold text-white" }
];

export default function ParentInformasiPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeItem, setActiveItem] = useState<Announcement | null>(null);
  const [realtimeCount, setRealtimeCount] = useState(0);

  const supabase = useMemo(() => createParentClient(), []);

  const loadData = useCallback(async () => {
    try {
      const res = await getParentAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data as Announcement[]);
      }
    } catch (err) {
      console.error("Gagal memuat pengumuman parent:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + Realtime Subscription
  useEffect(() => {
    loadData();

    // Supabase Realtime channel
    const channel = supabase
      .channel("realtime_parent_announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          setRealtimeCount((prev) => prev + 1);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

  // Filtered list
  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [announcements, selectedCategory, search]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "Informasi Akademik":
        return {
          badge: "bg-sky-50 text-sky-700 border-sky-200",
          iconBg: "bg-sky-100 text-sky",
          dot: "bg-sky"
        };
      case "Informasi Non Akademik":
        return {
          badge: "bg-leaf-50 text-leaf-700 border-leaf-200",
          iconBg: "bg-leaf-100 text-leaf-600",
          dot: "bg-leaf"
        };
      case "Informasi Kegiatan Sekolah":
        return {
          badge: "bg-coral-50 text-coral-700 border-coral-200",
          iconBg: "bg-coral-100 text-coral",
          dot: "bg-coral"
        };
      case "Informasi Ekstrakurikuler":
        return {
          badge: "bg-gold-50 text-gold-700 border-gold-200",
          iconBg: "bg-gold-100 text-gold-600",
          dot: "bg-gold"
        };
      default:
        return {
          badge: "bg-cloud text-ink-500 border-ink/10",
          iconBg: "bg-cloud text-ink-400",
          dot: "bg-ink-300"
        };
    }
  };

  // Strip HTML tags for card snippet
  const getExcerpt = (html: string) => {
    if (!html) return "";
    const clean = html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
    return clean.length > 130 ? clean.substring(0, 130) + "..." : clean;
  };

  return (
    <div className="space-y-8 pb-16 max-w-full mx-auto">
      {/* Playful & Modern Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-50 via-white to-coral-50/40 border border-sky-100/80 p-8 sm:p-10 shadow-xs">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 bg-gradient-to-br from-coral-200/30 to-sky-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-56 h-56 bg-gradient-to-tr from-gold-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-sky-700 text-xs font-bold tracking-wide uppercase mb-3.5 border border-sky-200/70 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-leaf animate-pulse" />
              <span>Update Real-time Sekolah</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Informasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky to-coral">Kegiatan</span>
            </h1>
            <p className="text-ink-400 mt-2.5 text-base sm:text-lg leading-relaxed">
              Dapatkan berita terbaru, agenda penting, dan pengumuman resmi sekolah secara langsung.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-80 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink-300 group-focus-within:text-sky transition-colors">
              <Search size={18} />
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengumuman..."
              className="pl-12 h-14 rounded-full bg-white border-ink/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-sky/30 text-sm font-medium transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-4 flex items-center text-ink-300 hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills (Playful Style) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shadow-xs ${
                isSelected
                  ? "bg-ink text-white border-ink shadow-md scale-102"
                  : "bg-white text-ink-500 border-ink/10 hover:border-ink/20 hover:text-ink hover:bg-cloud/50"
              }`}
            >
              <Icon size={15} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed List (2 Cols on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-ink-400 font-bold space-y-3">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-sky border-t-transparent" />
              <p>Memuat informasi terbaru...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-ink/10 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mx-auto">
                <Megaphone size={28} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Belum Ada Informasi</h3>
              <p className="text-sm text-ink-400 max-w-md mx-auto">
                {search || selectedCategory !== "all"
                  ? "Tidak ada informasi yang sesuai dengan kata kunci atau kategori yang Anda pilih."
                  : "Pengumuman dan agenda kegiatan sekolah akan muncul di sini saat dipublikasikan oleh pihak sekolah."}
              </p>
              {(search || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="rounded-xl font-bold"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((item) => {
                const theme = getCategoryTheme(item.category);
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="bg-white rounded-[2.2rem] overflow-hidden border border-ink/10 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1"
                  >
                    {/* Card Thumbnail */}
                    <div className="relative aspect-[16/10] bg-cloud overflow-hidden">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50/60 to-coral-50/40 text-ink-300">
                          <Megaphone size={36} className="opacity-30 mb-2 text-sky" />
                          <span className="text-xs font-bold text-ink-300">Informasi JACOS</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs ${theme.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                          {item.category}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-ink shadow-xs border border-ink/5">
                          {item.target_type === "GENERAL" ? "📢 Umum" : "🎒 Khusus Kelas"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-xs text-ink-400 font-semibold mb-2">
                          <Calendar size={13} className="text-coral" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-bold text-lg text-ink line-clamp-2 group-hover:text-sky transition-colors leading-snug">
                          {item.title}
                        </h3>

                        {/* Text Snippet */}
                        <p className="text-xs text-ink-400 mt-2.5 line-clamp-2 leading-relaxed">
                          {getExcerpt(item.content)}
                        </p>
                      </div>

                      {/* Card Action Link */}
                      <div className="pt-4 border-t border-ink/5 flex items-center justify-between text-xs font-bold text-sky group-hover:translate-x-1 transition-transform">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Mini (Widgets & Highlights) */}
        <div className="space-y-6">
          {/* Live Status Widget */}
          <div className="bg-gradient-to-br from-sky-50 to-white rounded-[2rem] p-6 border border-sky-100 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky text-white flex items-center justify-center shadow-xs">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink">Pusat Siaran Sekolah</h3>
                <p className="text-xs text-ink-400">Sinkronisasi langsung dengan portal admin</p>
              </div>
            </div>
            <p className="text-xs text-ink-600 leading-relaxed">
              Semua surat edaran, libur akademik, dan kegiatan siswa yang diunggah sekolah akan langsung tayang di sini.
            </p>
          </div>

          {/* Agenda Terdekat Card */}
          <div className="bg-white rounded-[2rem] p-6 border border-ink/10 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Calendar size={18} className="text-coral" /> Agenda Sekolah
              </h3>
              <span className="text-[11px] font-bold text-coral bg-coral-50 px-2.5 py-1 rounded-full">
                Tahun Ajaran 2026/2027
              </span>
            </div>

            <div className="space-y-3.5">
              {announcements.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="p-3.5 rounded-2xl bg-cloud/50 hover:bg-sky-50/50 border border-ink/5 hover:border-sky/20 transition-all cursor-pointer flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-ink/10 flex items-center justify-center shrink-0 text-coral font-extrabold text-xs shadow-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-ink truncate group-hover:text-sky transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-ink-400 mt-0.5">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && (
                <p className="text-xs text-ink-300 text-center py-4">Belum ada agenda terdaftar</p>
              )}
            </div>
          </div>

          {/* Contact Support Hotline */}
          <div className="bg-gradient-to-br from-leaf-50 via-white to-cloud rounded-[2rem] p-6 border border-leaf-100 shadow-xs space-y-3">
            <h4 className="font-display text-sm font-bold text-leaf-800">Ada Pertanyaan Kegiatan?</h4>
            <p className="text-xs text-ink-500 leading-relaxed">
              Jika Anda memerlukan informasi lebih detail tentang kegiatan belajar atau administrasi, hubungi Hotline Tata Usaha JACOS.
            </p>
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-leaf hover:bg-leaf-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <MessageCircle size={15} />
              <span>Hubungi Admin Sekolah</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modal Detail Informasi (Pop-up Baca Lengkap) */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-ink/10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-ink/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    getCategoryTheme(activeItem.category).badge
                  }`}
                >
                  {activeItem.category}
                </span>
                <span className="text-xs font-bold text-ink-400">
                  • {formatDate(activeItem.created_at)}
                </span>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="w-10 h-10 rounded-2xl bg-cloud hover:bg-ink/10 text-ink flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {activeItem.thumbnail_url && (
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-ink/10 bg-cloud shadow-xs">
                  <Image
                    src={activeItem.thumbnail_url}
                    alt={activeItem.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-snug">
                  {activeItem.title}
                </h2>

                <div className="mt-3 flex items-center gap-3 text-xs font-bold text-ink-400">
                  {activeItem.target_type === "GENERAL" ? (
                    <span className="flex items-center gap-1.5 text-sky">
                      <Globe size={14} /> Seluruh Orang Tua Murid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-coral">
                      <Users size={14} /> Khusus Kelas Anda
                    </span>
                  )}
                </div>
              </div>

              {/* Rich Text Body with explicit typography classes */}
              <div
                className="text-ink-700 leading-relaxed border-t border-ink/10 pt-6
                  [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-ink [&_h2]:my-3 [&_h2]:leading-snug
                  [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink [&_h3]:my-2.5 [&_h3]:leading-snug
                  [&_p]:my-2 [&_p]:leading-relaxed
                  [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink
                  [&_i]:italic [&_em]:italic
                  [&_u]:underline [&_u]:decoration-coral/60 [&_u]:underline-offset-4
                  [&_strike]:line-through [&_s]:line-through
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
                  [&_li]:leading-relaxed
                  [&_blockquote]:border-l-4 [&_blockquote]:border-coral [&_blockquote]:bg-coral-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:rounded-r-2xl [&_blockquote]:text-ink-600
                  [&_hr]:my-4 [&_hr]:border-ink/10
                  [&_a]:text-sky [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2"
                dangerouslySetInnerHTML={{ __html: activeItem.content }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-cloud/50 border-t border-ink/10 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setActiveItem(null)}
                className="rounded-xl font-bold border-ink/10 px-5"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
