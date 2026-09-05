"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Calendar,
  Globe,
  Users,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AnnouncementItem,
  getAnnouncements,
  deleteAnnouncement,
} from "./actions";

interface InformasiClientPageProps {
  initialData: {
    data: AnnouncementItem[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
  classes: { id: string; name: string; grade?: string }[];
}

const CATEGORIES = [
  "all",
  "Informasi Akademik",
  "Informasi Non Akademik",
  "Informasi Kegiatan Sekolah",
  "Informasi Ekstrakurikuler",
];

export default function InformasiClientPage({
  initialData,
  classes,
}: InformasiClientPageProps) {
  const [data, setData] = useState<AnnouncementItem[]>(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [currentPage, setCurrentPage] = useState(initialData.currentPage);
  const [pageSize, setPageSize] = useState<number>(10);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTarget, setSelectedTarget] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [isPending, startTransition] = useTransition();

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);

  // Class Map for easy name lookup
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classes]);

  // Fetch with filter params
  const fetchFilteredData = (
    page: number,
    cat = selectedCategory,
    target = selectedTarget,
    q = search,
    limit = pageSize
  ) => {
    startTransition(async () => {
      const res = await getAnnouncements({
        search: q,
        category: cat,
        targetType: target,
        page,
        limit,
      });

      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCurrentPage(res.currentPage);
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchFilteredData(1, selectedCategory, selectedTarget, val, pageSize);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    fetchFilteredData(1, cat, selectedTarget, search, pageSize);
  };

  const handleTargetChange = (target: string) => {
    setSelectedTarget(target);
    fetchFilteredData(1, selectedCategory, target, search, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchFilteredData(1, selectedCategory, selectedTarget, search, newSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchFilteredData(newPage, selectedCategory, selectedTarget, search, pageSize);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteAnnouncement(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        fetchFilteredData(currentPage, selectedCategory, selectedTarget, search, pageSize);
      } else {
        alert(res.message || "Gagal menghapus informasi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Informasi Akademik":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Informasi Non Akademik":
        return "bg-leaf-50 text-leaf-700 border-leaf-200";
      case "Informasi Kegiatan Sekolah":
        return "bg-coral-50 text-coral-700 border-coral-200";
      case "Informasi Ekstrakurikuler":
        return "bg-gold-50 text-gold-700 border-gold-200";
      default:
        return "bg-cloud text-ink-500 border-ink/10";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full">
      {/* Header Premium JACOS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral-50 via-white to-cloud border border-coral-100 p-5 sm:p-7 lg:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-coral-200/40 to-coral-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-100/60 text-coral-700 text-[11px] font-bold tracking-wide uppercase mb-2.5 border border-coral-200/50">
              <Megaphone size={13} /> Portal Informasi
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
              Informasi &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-coral-600">Kegiatan</span>
            </h1>
            <p className="text-ink-400 mt-1.5 text-xs sm:text-sm leading-relaxed">
              Pusat kelola pengumuman sekolah, agenda kegiatan, dan siaran informasi untuk orang tua murid.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/management/informasi/tambah" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-5 bg-ink hover:bg-ink/90 text-white font-bold rounded-xl sm:rounded-2xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2">
                <Plus size={16} />
                <span>Buat Informasi</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-ink-300 group-focus-within:text-coral transition-colors">
              <Search size={16} />
            </div>
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari judul informasi..."
              className="pl-10 h-11 rounded-2xl bg-white border border-ink/10 shadow-2xs focus-visible:ring-2 focus-visible:ring-coral/30 text-xs sm:text-sm font-medium"
            />
          </div>

          {/* View Toggle & Target Selector */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Target Select */}
            <div className="flex items-center bg-white p-1 rounded-xl sm:rounded-2xl border border-ink/10 shadow-2xs">
              <button
                onClick={() => handleTargetChange("all")}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                  selectedTarget === "all" ? "bg-ink text-white shadow-2xs" : "text-ink-400 hover:text-ink"
                }`}
              >
                Semua Target
              </button>
              <button
                onClick={() => handleTargetChange("GENERAL")}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                  selectedTarget === "GENERAL" ? "bg-sky text-white shadow-2xs" : "text-ink-400 hover:text-ink"
                }`}
              >
                Umum
              </button>
              <button
                onClick={() => handleTargetChange("SPECIFIC_CLASSES")}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                  selectedTarget === "SPECIFIC_CLASSES" ? "bg-coral text-white shadow-2xs" : "text-ink-400 hover:text-ink"
                }`}
              >
                Khusus Kelas
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white p-1 rounded-xl sm:rounded-2xl border border-ink/10 shadow-2xs shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg sm:rounded-xl transition-all ${
                  viewMode === "grid" ? "bg-cloud text-ink font-bold shadow-2xs" : "text-ink-300 hover:text-ink"
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg sm:rounded-xl transition-all ${
                  viewMode === "table" ? "bg-cloud text-ink font-bold shadow-2xs" : "text-ink-300 hover:text-ink"
                }`}
                title="Tampilan Tabel"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 hide-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === "all" ? "Semua Kategori" : cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-ink text-white border-ink shadow-2xs"
                    : "bg-white text-ink-400 border-ink/10 hover:border-ink/20 hover:text-ink shadow-2xs"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Listing */}
      {isPending ? (
        <div className="py-20 text-center text-ink-400 font-bold bg-white rounded-3xl border border-ink/5">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-coral border-t-transparent mb-3" />
          <p className="text-xs">Memuat informasi...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-ink/10 shadow-xs space-y-3.5 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-coral-50 text-coral flex items-center justify-center mx-auto">
            <Megaphone size={24} />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Belum Ada Informasi</h3>
          <p className="text-xs text-ink-400">
            {search || selectedCategory !== "all" || selectedTarget !== "all"
              ? "Tidak ada informasi yang sesuai dengan filter pencarian Anda."
              : "Mulai buat informasi atau pengumuman pertama Anda untuk dibagikan ke orang tua."}
          </p>
          <Link href="/management/informasi/tambah" className="inline-block pt-1">
            <Button className="h-10 rounded-xl bg-ink hover:bg-ink/90 text-white font-bold text-xs">
              <Plus size={15} className="mr-1.5" /> Buat Informasi Baru
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Bento View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data.map((item) => {
            const classNames =
              item.target_type === "SPECIFIC_CLASSES" && item.target_classes
                ? item.target_classes.map((id) => classMap.get(id) || id).join(", ")
                : "";

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-ink/10 shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Card Thumbnail */}
                <div className="relative aspect-[16/10] sm:aspect-video bg-cloud overflow-hidden">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ink-300 bg-gradient-to-br from-cloud to-sky-50/50">
                      <Megaphone size={30} className="opacity-40 mb-1 text-sky" />
                      <span className="text-[11px] font-semibold text-ink-300">Tanpa Thumbnail</span>
                    </div>
                  )}

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border backdrop-blur-md shadow-2xs ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>

                    {!item.is_published && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gold text-white shadow-2xs">
                        DRAF
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Meta info: Date & Target */}
                    <div className="flex items-center justify-between text-[11px] text-ink-400 font-semibold mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-coral" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.target_type === "GENERAL" ? (
                          <span className="inline-flex items-center gap-1 text-sky font-bold">
                            <Globe size={12} /> Umum
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-coral font-bold truncate max-w-[120px]"
                            title={`Kelas: ${classNames}`}
                          >
                            <Users size={12} /> {classNames || "Kelas Khusus"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-sm sm:text-base text-ink line-clamp-2 group-hover:text-coral transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-ink/5 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-ink transition-colors"
                    >
                      <Eye size={15} /> Pratinjau
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link href={`/management/informasi/${item.id}/edit`}>
                        <button
                          className="w-8 h-8 rounded-xl bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky transition-colors flex items-center justify-center"
                          title="Edit Informasi"
                        >
                          <Edit size={14} />
                        </button>
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="w-8 h-8 rounded-xl bg-cloud hover:bg-coral-50 text-ink-400 hover:text-coral transition-colors flex items-center justify-center"
                        title="Hapus Informasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="space-y-3">
          {/* Mobile Card List for Table Mode */}
          <div className="space-y-3 md:hidden">
            {data.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <span className="text-[10px] text-ink-400 font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-ink line-clamp-2">{item.title}</h4>

                <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                  <span className="text-[11px] font-semibold text-sky-700">
                    {item.target_type === "GENERAL" ? "Target: Umum" : "Target: Kelas Khusus"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 rounded-lg bg-cloud text-ink-400 hover:text-ink"
                      title="Pratinjau"
                    >
                      <Eye size={14} />
                    </button>
                    <Link href={`/management/informasi/${item.id}/edit`}>
                      <button
                        className="p-1.5 rounded-lg bg-cloud text-ink-400 hover:text-sky"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg bg-cloud text-ink-400 hover:text-coral"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-ink/10 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cloud/60 border-b border-ink/10 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <th className="py-3.5 px-6">Informasi</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Target Penerima</th>
                    <th className="py-3.5 px-4">Tanggal Buat</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {data.map((item) => {
                    const classNames =
                      item.target_type === "SPECIFIC_CLASSES" && item.target_classes
                        ? item.target_classes.map((id) => classMap.get(id) || id).join(", ")
                        : "";

                    return (
                      <tr key={item.id} className="hover:bg-cloud/40 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cloud overflow-hidden relative shrink-0 border border-ink/10">
                              {item.thumbnail_url ? (
                                <Image
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-300">
                                  <Megaphone size={16} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-ink line-clamp-1">{item.title}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getCategoryColor(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.target_type === "GENERAL" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky">
                              <Globe size={13} /> Umum
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-bold text-coral truncate max-w-[140px]"
                              title={`Kelas: ${classNames}`}
                            >
                              <Users size={13} /> {classNames || "Kelas Tertentu"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-ink-400 font-medium">
                          {formatDate(item.created_at)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.is_published ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf">
                              <CheckCircle2 size={13} /> Terbit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gold">
                              Draf
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-cloud transition-colors"
                              title="Pratinjau"
                            >
                              <Eye size={15} />
                            </button>
                            <Link href={`/management/informasi/${item.id}/edit`}>
                              <button
                                className="p-2 rounded-xl text-ink-400 hover:text-sky hover:bg-sky-50 transition-colors"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 rounded-xl text-ink-400 hover:text-coral hover:bg-coral-50 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination & Short View Toolbar (10/20/50/100) */}
      <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-ink-400 font-medium">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-coral text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-ink-400 font-medium">data</span>
          </div>

          <span className="text-ink-400">
            Menampilkan{" "}
            <strong className="text-ink">
              {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              -
              {Math.min(currentPage * pageSize, total)}
            </strong>{" "}
            dari <strong className="text-ink">{total}</strong> informasi
          </span>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
            className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
          >
            <ChevronLeft size={14} className="mr-1" /> Prev
          </Button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) {
                  pageNum = totalPages - (4 - i);
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isPending}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                    currentPage === pageNum
                      ? "bg-ink text-white shadow-2xs"
                      : "text-ink-400 hover:bg-cloud hover:text-ink"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => handlePageChange(currentPage + 1)}
            className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
          >
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-ink/5 space-y-5">
            <div className="flex items-center gap-3 text-coral">
              <div className="w-10 h-10 rounded-2xl bg-coral-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">Hapus Informasi</h3>
            </div>

            <p className="text-xs text-ink-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus informasi{" "}
              <strong className="text-ink font-bold">"{deleteTarget.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border-ink/15 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-10 rounded-xl bg-coral hover:bg-coral-600 text-white font-bold text-xs shadow-md"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-ink/5 relative">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-ink-400 hover:text-ink transition"
            >
              <X size={16} />
            </button>

            {previewItem.thumbnail_url && (
              <div className="relative aspect-video w-full bg-cloud">
                <Image
                  src={previewItem.thumbnail_url}
                  alt={previewItem.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(
                    previewItem.category
                  )}`}
                >
                  {previewItem.category}
                </span>

                <span className="text-xs text-ink-400 font-semibold flex items-center gap-1">
                  <Calendar size={13} className="text-coral" /> {formatDate(previewItem.created_at)}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
                {previewItem.title}
              </h2>

              <div className="pt-3 border-t border-ink/5 text-xs text-ink-600 leading-relaxed space-y-2 whitespace-pre-line">
                {previewItem.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
