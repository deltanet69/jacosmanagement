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
  { key: "all", label: "Semua", icon: Sparkles },
  { key: "Informasi Akademik", label: "Akademik", icon: BookOpen },
  { key: "Informasi Non Akademik", label: "Non Akademik", icon: Palette },
  { key: "Informasi Kegiatan Sekolah", label: "Kegiatan Sekolah", icon: Megaphone },
  { key: "Informasi Ekstrakurikuler", label: "Ekstrakurikuler", icon: Trophy }
];

export default function ParentInformasiPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeItem, setActiveItem] = useState<Announcement | null>(null);

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

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("realtime_parent_announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

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

  const getExcerpt = (html: string) => {
    if (!html) return "";
    const clean = html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
    return clean.length > 110 ? clean.substring(0, 110) + "..." : clean;
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-coral-50/30 border border-sky-100 p-5 sm:p-8 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-sky-700 text-[11px] font-bold tracking-wide uppercase mb-2 border border-sky-200/70 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-leaf animate-pulse" />
              <span>Pengumuman Sekolah</span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink tracking-tight">
              Informasi & Kegiatan
            </h1>
            <p className="text-ink-400 mt-1 text-xs sm:text-sm">
              Berita terbaru, surat edaran, dan agenda resmi JACOS Islamic School.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72 relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-ink-300">
              <Search size={16} />
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengumuman..."
              className="pl-10 pr-9 h-11 rounded-2xl bg-white border-ink/10 shadow-2xs text-xs font-medium focus-visible:ring-2 focus-visible:ring-sky/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-3 flex items-center text-ink-300 hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills (Smooth Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-2xs ${
                isSelected
                  ? "bg-ink text-white border-ink shadow-xs"
                  : "bg-white text-ink-500 border-ink/10 hover:border-ink/20 hover:text-ink hover:bg-cloud/50"
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Feed List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-ink-400 font-bold space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky border-t-transparent" />
              <p className="text-xs">Memuat informasi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-ink/10 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mx-auto">
                <Megaphone size={22} />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Belum Ada Informasi</h3>
              <p className="text-xs text-ink-400 max-w-sm mx-auto">
                {search || selectedCategory !== "all"
                  ? "Tidak ada informasi yang sesuai dengan filter atau kata kunci Anda."
                  : "Pengumuman dan agenda kegiatan sekolah akan muncul di sini."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => {
                const theme = getCategoryTheme(item.category);
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="bg-white rounded-3xl overflow-hidden border border-ink/10 shadow-2xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                  >
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[16/9] bg-cloud overflow-hidden">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50/70 to-coral-50/40 text-ink-300">
                          <Megaphone size={30} className="opacity-30 mb-1 text-sky" />
                          <span className="text-[11px] font-bold text-ink-300">Informasi JACOS</span>
                        </div>
                      )}

                      {/* Safe Badges Container without overlapping */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-2xs truncate max-w-[55%] ${theme.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                          <span className="truncate">{item.category}</span>
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-white/90 backdrop-blur-md text-ink shadow-2xs border border-ink/5 shrink-0">
                          {item.target_type === "GENERAL" ? "📢 Umum" : "🎒 Kelas"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-400 font-medium mb-1.5">
                          <Calendar size={12} className="text-coral" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>

                        <h3 className="font-display font-bold text-sm sm:text-base text-ink line-clamp-2 group-hover:text-sky transition-colors leading-snug">
                          {item.title}
                        </h3>

                        {item.content && (
                          <p className="text-[11.5px] text-ink-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {getExcerpt(item.content)}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-ink/5 flex items-center justify-between text-xs font-bold text-sky">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Info (Agenda & Support Hotline) */}
        <div className="space-y-4">
          {/* Agenda Terdekat */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/10 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-ink/5">
              <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <Calendar size={16} className="text-coral" /> Agenda Sekolah
              </h3>
              <span className="text-[10px] font-bold text-coral bg-coral-50 px-2 py-0.5 rounded-full">
                2026/2027
              </span>
            </div>

            <div className="space-y-2">
              {announcements.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="p-3 rounded-2xl bg-cloud/40 hover:bg-sky-50/40 border border-ink/5 hover:border-sky/20 transition-all cursor-pointer flex items-center gap-2.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-ink/10 flex items-center justify-center shrink-0 text-coral font-bold text-xs shadow-2xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-ink truncate group-hover:text-sky transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-ink-400">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hotline Tata Usaha */}
          <div className="bg-gradient-to-br from-leaf-50 to-emerald-50/50 rounded-3xl p-4 sm:p-5 border border-leaf-100 shadow-2xs space-y-2.5">
            <h4 className="font-display text-xs sm:text-sm font-bold text-leaf-800">Hotline Tata Usaha JACOS</h4>
            <p className="text-[11.5px] text-ink-500 leading-relaxed">
              Pertanyaan mengenai kalender kegiatan atau administrasi dapat ditanyakan via WhatsApp.
            </p>
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-leaf hover:bg-leaf-600 text-white text-xs font-bold transition-all shadow-2xs"
            >
              <MessageCircle size={14} />
              <span>Chat WhatsApp Admin</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modal Detail Informasi */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-ink/10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-ink/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border truncate ${
                    getCategoryTheme(activeItem.category).badge
                  }`}
                >
                  {activeItem.category}
                </span>
                <span className="text-[11px] font-medium text-ink-400 truncate">
                  • {formatDate(activeItem.created_at)}
                </span>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-xl bg-cloud hover:bg-ink/10 text-ink flex items-center justify-center transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {activeItem.thumbnail_url && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-ink/10 bg-cloud shadow-2xs">
                  <Image
                    src={activeItem.thumbnail_url}
                    alt={activeItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 576px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <h2 className="font-display text-lg sm:text-xl font-bold text-ink leading-snug">
                {activeItem.title}
              </h2>

              <div
                className="prose prose-sm max-w-none text-ink-600 text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: activeItem.content }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
