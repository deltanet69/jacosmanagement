"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  FileText,
  Megaphone,
  Pin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Archive,
  ArchiveRestore,
  Download,
  ExternalLink,
  Paperclip,
  Share2,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Check,
  ChevronRight,
  UserCheck,
  UserX,
  Copy,
  CheckCheck,
  UploadCloud,
  FileSpreadsheet,
  File,
  Info,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
  HrAnnouncementRecord,
  HrAnnouncementInput,
  AnnouncementCategory,
  ReaderEmployee,
  createHrAnnouncement,
  updateHrAnnouncement,
  deleteHrAnnouncement,
  archiveHrAnnouncement,
  toggleImportantHrAnnouncement,
  uploadHrAnnouncementAttachment,
  getAnnouncementReaderDetails,
} from "@/app/management/hr/pengumuman/actions";

interface PengumumanListClientProps {
  initialData: HrAnnouncementRecord[];
  totalEmployeesCount: number;
}

type ViewMode = "grid" | "table";
type TabFilter = "active" | "important" | "archived";

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { label: string; badge: string; border: string; bg: string }
> = {
  KEBIJAKAN_BARU: {
    label: "Kebijakan Baru",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    border: "border-sky-500",
    bg: "bg-sky-500/10",
  },
  INFO_CUTI: {
    label: "Info Cuti & Libur",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-500",
    bg: "bg-emerald-500/10",
  },
  EVENT: {
    label: "Event & Agenda",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-500",
    bg: "bg-purple-500/10",
  },
  PENTING: {
    label: "Penting & Mendesak",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "border-rose-500",
    bg: "bg-rose-500/10",
  },
  LAINNYA: {
    label: "Informasi Umum",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-500",
    bg: "bg-amber-500/10",
  },
};

const TARGET_OPTIONS = [
  { id: "SEMUA", label: "Semua Karyawan"},
  { id: "GURU", label: "Seluruh Guru"},
  { id: "STAF", label: "Seluruh Staf"},
  { id: "HR_ADMIN", label: "Khusus Tim HR"},
];

export function PengumumanListClient({
  initialData,
  totalEmployeesCount,
}: PengumumanListClientProps) {
  const [data, setData] = useState<HrAnnouncementRecord[]>(initialData);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [targetFilter, setTargetFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<TabFilter>("active");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "readers" | "priority">("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Transitions
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HrAnnouncementRecord | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HrAnnouncementRecord | null>(null);
  const [detailTab, setDetailTab] = useState<"content" | "readers">("content");
  const [readerStats, setReaderStats] = useState<{
    readers: ReaderEmployee[];
    total: number;
    readCount: number;
    unreadCount: number;
    readPercentage: number;
  } | null>(null);
  const [isLoadingReaders, setIsLoadingReaders] = useState(false);
  const [readerSearch, setReaderSearch] = useState("");
  const [readerFilter, setReaderFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<HrAnnouncementRecord | null>(null);

  // Form State for Create/Edit
  const [formState, setFormState] = useState<HrAnnouncementInput>({
    title: "",
    category: "KEBIJAKAN_BARU",
    content: "",
    is_important: false,
    target: ["SEMUA"],
    attachment_url: "",
    is_archived: false,
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const activeList = data.filter((d) => !d.is_archived && !d.is_deleted);
    const archivedList = data.filter((d) => d.is_archived && !d.is_deleted);
    const importantList = activeList.filter((d) => d.is_important);

    const totalReads = activeList.reduce((acc, cur) => acc + (cur.read_count || 0), 0);
    const maxPossibleReads = activeList.length * (totalEmployeesCount || 1);
    const avgReadRate =
      maxPossibleReads > 0 ? Math.round((totalReads / maxPossibleReads) * 100) : 0;

    return {
      activeCount: activeList.length,
      importantCount: importantList.length,
      archivedCount: archivedList.length,
      avgReadRate,
    };
  }, [data, totalEmployeesCount]);

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        if (item.is_deleted) return false;

        // Tab filter
        if (activeTab === "active") {
          if (item.is_archived) return false;
        } else if (activeTab === "important") {
          if (item.is_archived || !item.is_important) return false;
        } else if (activeTab === "archived") {
          if (!item.is_archived) return false;
        }

        // Search filter
        if (search.trim() !== "") {
          const q = search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchContent = item.content.toLowerCase().includes(q);
          const matchTarget = item.target.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTarget) return false;
        }

        // Category filter
        if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
          return false;
        }

        // Target filter
        if (targetFilter !== "ALL") {
          if (!item.target.includes(targetFilter) && !item.target.includes("SEMUA")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "readers") {
          return (b.read_count || 0) - (a.read_count || 0);
        }
        if (sortBy === "priority") {
          return (b.is_important ? 1 : 0) - (a.is_important ? 1 : 0);
        }
        return 0;
      });
  }, [data, activeTab, search, categoryFilter, targetFilter, sortBy]);

  // Date Formatter
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return formatDate(dateStr);
    } catch {
      return formatDate(dateStr);
    }
  };

  // Open Readers Detail Modal
  const openDetailModal = async (item: HrAnnouncementRecord, tab: "content" | "readers" = "content") => {
    setSelectedItem(item);
    setDetailTab(tab);
    setIsDetailModalOpen(true);
    setIsLoadingReaders(true);

    try {
      const res = await getAnnouncementReaderDetails(item.id);
      if (res.success && res.data) {
        setReaderStats(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReaders(false);
    }
  };

  // Handlers for Form
  const openCreateModal = () => {
    setFormState({
      title: "",
      category: "KEBIJAKAN_BARU",
      content: "",
      is_important: false,
      target: ["SEMUA"],
      attachment_url: "",
      is_archived: false,
    });
    setUploadFileName(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item: HrAnnouncementRecord) => {
    setEditingItem(item);
    setFormState({
      title: item.title,
      category: item.category,
      content: item.content,
      is_important: item.is_important,
      target: item.target || ["SEMUA"],
      attachment_url: item.attachment_url || "",
      is_archived: item.is_archived,
    });
    setUploadFileName(item.attachment_url ? "Lampiran Dokumen Terlampir" : null);
    setIsEditModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadHrAnnouncementAttachment(formData);
      if (res.success && res.url) {
        setFormState((prev) => ({ ...prev, attachment_url: res.url }));
        setUploadFileName(res.fileName || file.name);
        showNotification("success", "Lampiran berhasil diunggah");
      } else {
        showNotification("error", res.message || "Gagal mengunggah lampiran");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan upload");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const toggleTarget = (targetId: string) => {
    setFormState((prev) => {
      let current = [...prev.target];
      if (targetId === "SEMUA") {
        return { ...prev, target: ["SEMUA"] };
      }
      current = current.filter((t) => t !== "SEMUA");
      if (current.includes(targetId)) {
        current = current.filter((t) => t !== targetId);
      } else {
        current.push(targetId);
      }
      if (current.length === 0) {
        return { ...prev, target: ["SEMUA"] };
      }
      return { ...prev, target: current };
    });
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createHrAnnouncement(formState);
      if (res.success && res.data) {
        const newItem: HrAnnouncementRecord = {
          id: res.data.id,
          title: res.data.title,
          category: res.data.category,
          content: res.data.content,
          is_important: res.data.is_important,
          target: res.data.target,
          attachment_url: res.data.attachment_url,
          is_archived: false,
          is_deleted: false,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
          read_count: 0,
          total_employees: totalEmployeesCount,
          author_name: "HR Management",
        };
        setData((prev) => [newItem, ...prev]);
        setIsCreateModalOpen(false);
        showNotification("success", "Pengumuman berhasil diterbitkan!");
      } else {
        showNotification("error", res.message || "Gagal membuat pengumuman");
      }
    });
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    startTransition(async () => {
      const res = await updateHrAnnouncement(editingItem.id, formState);
      if (res.success && res.data) {
        setData((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  title: res.data.title,
                  category: res.data.category,
                  content: res.data.content,
                  is_important: res.data.is_important,
                  target: res.data.target,
                  attachment_url: res.data.attachment_url,
                  updated_at: res.data.updated_at,
                }
              : item
          )
        );
        setIsEditModalOpen(false);
        setEditingItem(null);
        showNotification("success", "Pengumuman berhasil diperbarui!");
      } else {
        showNotification("error", res.message || "Gagal memperbarui pengumuman");
      }
    });
  };

  // Toggle Important Quick
  const handleToggleImportant = (item: HrAnnouncementRecord) => {
    const nextVal = !item.is_important;
    startTransition(async () => {
      const res = await toggleImportantHrAnnouncement(item.id, nextVal);
      if (res.success) {
        setData((prev) =>
          prev.map((d) => (d.id === item.id ? { ...d, is_important: nextVal } : d))
        );
        showNotification(
          "success",
          nextVal ? "Pengumuman ditandai PENTING 📌" : "Tanda Penting dinonaktifkan"
        );
      } else {
        showNotification("error", res.message);
      }
    });
  };

  // Toggle Archive
  const handleToggleArchive = (item: HrAnnouncementRecord) => {
    const nextVal = !item.is_archived;
    startTransition(async () => {
      const res = await archiveHrAnnouncement(item.id, nextVal);
      if (res.success) {
        setData((prev) =>
          prev.map((d) => (d.id === item.id ? { ...d, is_archived: nextVal } : d))
        );
        showNotification(
          "success",
          nextVal ? "Pengumuman dipindahkan ke Arsip 📦" : "Pengumuman dipulihkan ke Aktif ✨"
        );
      } else {
        showNotification("error", res.message);
      }
    });
  };

  // Delete Announcement
  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    startTransition(async () => {
      const res = await deleteHrAnnouncement(deletingItem.id);
      if (res.success) {
        setData((prev) => prev.filter((d) => d.id !== deletingItem.id));
        setIsDeleteModalOpen(false);
        setDeletingItem(null);
        showNotification("success", "Pengumuman berhasil dihapus");
      } else {
        showNotification("error", res.message);
      }
    });
  };

  // Copy Link Helper
  const copyAnnouncementLink = (id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/management/hr/pengumuman#${id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      showNotification("success", "Tautan pengumuman disalin ke clipboard");
    }
  };

  // Format Helper for Quick Content Inserts
  const insertContentFormat = (syntax: "bold" | "bullet" | "number" | "quote") => {
    const current = formState.content;
    let appended = "";
    if (syntax === "bold") appended = "\n**Teks Tebal**";
    if (syntax === "bullet") appended = "\n- Poin 1\n- Poin 2\n- Poin 3";
    if (syntax === "number") appended = "\n1. Langkah pertama\n2. Langkah kedua";
    if (syntax === "quote") appended = "\n> Catatan penting:";
    setFormState((prev) => ({ ...prev, content: current + appended }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/20"
              : "bg-rose-600 text-white shadow-rose-600/20"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-ink/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-sky-100 to-indigo-50 rounded-full blur-2xl opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1.5">
              <Megaphone size={14} className="text-red-600 mr-1" /> JACOS Announcement Center
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            Pengumuman & Surat Edaran HR
          </h1>
          <p className="text-ink-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Saluran komunikasi resmi internal untuk menyebarkan regulasi kerja, edaran libur, pengumuman darurat, dan agenda sekolah ke seluruh guru dan staf.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 sm:self-start">
          <Button
            onClick={openCreateModal}
            className="gap-2 h-11 px-5 rounded-2xl bg-ink hover:bg-ink/90 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Plus size={16} /> Buat Pengumuman
          </Button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg sm:text-lg font-bold text-ink-400">Pengumuman Aktif</span>
            <div className="w-13 h-13 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Megaphone size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {stats.activeCount}
          </div>
          <p className="text-xs text-ink-400 mt-3 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">● Aktif</span> di portal karyawan
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg sm:text-lg font-bold text-ink-400">Prioritas Penting</span>
            <div className="w-13 h-13 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Pin size={18} />
            </div> 
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
            {stats.importantCount}
          </div>
          <p className="text-xs text-ink-400 mt-3 flex items-center gap-1">
            <span className="text-rose-600 font-bold">● Urgent</span> dengan push alert
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg sm:text-lg font-bold text-ink-400">Rata-rata Keterbacaan</span>
            <div className="w-13 h-13 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
            {stats.avgReadRate}%
          </div>
          <p className="text-xs text-ink-400 mt-3">
            Dari {totalEmployeesCount} total guru & staf
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg sm:text-lg font-bold text-ink-400">Arsip Pengumuman</span>
            <div className="w-13 h-13 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Archive size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink-700 tracking-tight">
            {stats.archivedCount}
          </div>
          <p className="text-xs text-ink-400 mt-3">Dokumen tersimpan rapi</p>
        </div>
      </div>

      {/* Main Filter & Navigation Hub */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs space-y-4">
        {/* Top Row: Search + Status Tabs + View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex p-1 bg-cloud/70 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "active"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-400 hover:text-ink hover:bg-white/40"
              }`}
            >
              Aktif ({stats.activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("important")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "important"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-ink-400 hover:text-ink hover:bg-white/40"
              }`}
            >
              Penting ({stats.importantCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "archived"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-400 hover:text-ink hover:bg-white/40"
              }`}
            >
              Arsip ({stats.archivedCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Cari judul, kata kunci, isi surat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 sm:h-11 rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm font-medium focus-visible:ring-sky-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort & Layout Toggles */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-10 sm:h-11 px-3 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink-600 outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="readers">Paling Banyak Dibaca</option>
              <option value="priority">Prioritas Utama</option>
            </select>

            <div className="flex p-1 bg-cloud/70 rounded-2xl border border-ink/5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-ink shadow-xs" : "text-ink-400 hover:text-ink"
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-white text-ink shadow-xs" : "text-ink-400 hover:text-ink"
                }`}
                title="Tampilan Tabel"
              >
                <TableIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Category & Target Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/5">
          <span className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider mr-1">
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-ink text-white border-ink shadow-xs"
                : "bg-cloud/40 text-ink-500 border-ink/5 hover:bg-cloud"
            }`}
          >
            Semua
          </button>
          {(Object.keys(CATEGORY_CONFIG) as AnnouncementCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === cat
                  ? "bg-ink text-white border-ink shadow-xs"
                  : `${CATEGORY_CONFIG[cat].badge} hover:opacity-90`
              }`}
            >
              <span>{CATEGORY_CONFIG[cat].label}</span>
            </button>
          ))}

          <div className="h-4 w-px bg-ink/10 mx-1 hidden sm:block" />

          {/* Target Audience Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">
              Target:
            </span>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink-600 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Target</option>
              <option value="SEMUA">Semua Karyawan</option>
              <option value="GURU">Guru</option>
              <option value="STAF">Staf</option>
              <option value="HR_ADMIN">Internal HR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((item) => {
            const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.LAINNYA;
            const readPercentage =
              totalEmployeesCount > 0
                ? Math.round(((item.read_count || 0) / totalEmployeesCount) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  item.is_important
                    ? "border-rose-300/80 ring-1 ring-rose-200/50"
                    : "border-ink/5 hover:border-sky-300"
                }`}
              >
                {/* Priority Top Badge */}
                {item.is_important && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-2xl shadow-xs z-10 flex items-center gap-1.5 animate-pulse">
                    <Pin size={10} className="fill-white" /> PENTING & URGENT
                  </div>
                )}

                <div>
                  {/* Category & Date Header */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${config.badge}`}
                    >
                      <span>{config.label}</span>
                    </span>

                    <span className="text-[11px] text-ink-400 font-medium flex items-center gap-1 ml-auto">
                      <Clock size={11} /> {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => openDetailModal(item, "content")}
                    className="text-base sm:text-lg font-extrabold text-ink leading-snug mb-2 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {item.title}
                  </h3>

                  {/* Target Audience Pill */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.target.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-lg bg-cloud text-ink-500 text-[10px] font-bold tracking-tight"
                      >
                        {t === "SEMUA" && "Semua Karyawan"}
                        {t === "GURU" && "Guru"}
                        {t === "STAF" && "Staf"}
                        {t === "HR_ADMIN" && "Tim HR"}
                        {!["SEMUA", "GURU", "STAF", "HR_ADMIN"].includes(t) && t}
                      </span>
                    ))}
                    {item.attachment_url && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold flex items-center gap-1">
                        <Paperclip size={10} /> Dokumen
                      </span>
                    )}
                  </div>

                  {/* Body Preview */}
                  <p className="text-xs text-ink-500 line-clamp-3 leading-relaxed mb-4">
                    {item.content.replace(/[#*`_>]/g, "")}
                  </p>
                </div>

                {/* Card Bottom Area: Read Progress + Action Bar */}
                <div className="space-y-3 pt-3 border-t border-ink/5">
                  {/* Mini Read Tracker Bar */}
                  <div
                    onClick={() => openDetailModal(item, "readers")}
                    className="p-2.5 rounded-2xl bg-cloud/40 hover:bg-sky-50/60 transition-colors cursor-pointer border border-ink/5"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold">
                      <span className="text-ink-500 flex items-center gap-1">
                        <Eye size={12} className="text-sky-600" /> Status Pembaca
                      </span>
                      <span className="text-sky-700 font-extrabold">
                        {item.read_count || 0} / {totalEmployeesCount} ({readPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-cloud-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, readPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Button Strip */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailModal(item, "content")}
                      className="h-8 px-2.5 rounded-xl text-xs font-bold text-ink-600 hover:text-sky-600 hover:bg-sky-50 gap-1 cursor-pointer"
                    >
                      <Eye size={13} /> Baca Detail
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleImportant(item)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          item.is_important
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-cloud/50 text-ink-400 hover:text-ink hover:bg-cloud"
                        }`}
                        title={item.is_important ? "Hapus tanda penting" : "Tandai penting"}
                      >
                        <Pin size={13} className={item.is_important ? "fill-rose-600" : ""} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="w-8 h-8 rounded-xl bg-cloud/50 text-ink-500 hover:text-ink hover:bg-cloud flex items-center justify-center transition-all cursor-pointer"
                        title="Edit Pengumuman"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(item)}
                        className="w-8 h-8 rounded-xl bg-cloud/50 text-ink-500 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-all cursor-pointer"
                        title={item.is_archived ? "Pulihkan dari arsip" : "Arsipkan"}
                      >
                        {item.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingItem(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-cloud/50 text-ink-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === "table" && (
        <div className="bg-white rounded-3xl border border-ink/5 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cloud/50 text-ink-400 font-extrabold uppercase tracking-wider border-b border-ink/5">
                <tr>
                  <th className="py-4 px-5">Pengumuman</th>
                  <th className="py-4 px-4">Kategori</th>
                  <th className="py-4 px-4">Target</th>
                  <th className="py-4 px-4">Pembaca</th>
                  <th className="py-4 px-4">Tanggal</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredData.map((item) => {
                  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.LAINNYA;
                  const readPercentage =
                    totalEmployeesCount > 0
                      ? Math.round(((item.read_count || 0) / totalEmployeesCount) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-cloud/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          {item.is_important && (
                            <span className="p-1 rounded-lg bg-rose-50 text-rose-600" title="Penting">
                              <Pin size={12} className="fill-rose-600" />
                            </span>
                          )}
                          <div>
                            <div
                              onClick={() => openDetailModal(item, "content")}
                              className="font-extrabold text-ink hover:text-sky-600 cursor-pointer text-sm line-clamp-1"
                            >
                              {item.title}
                            </div>
                            <div className="text-[11px] text-ink-400 line-clamp-1 mt-0.5">
                              {item.content.substring(0, 70)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.badge}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-ink-600 font-medium text-[11px]">
                          {item.target.join(", ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetailModal(item, "readers")}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cloud/50 hover:bg-sky-50 text-ink-600 hover:text-sky-700 font-bold transition-colors cursor-pointer"
                        >
                          <Eye size={12} /> {item.read_count || 0}/{totalEmployeesCount} ({readPercentage}%)
                        </button>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-ink-500 font-medium">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDetailModal(item, "content")}
                            className="p-1.5 rounded-lg bg-cloud/50 text-ink-600 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
                            title="Detail"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-cloud/50 text-ink-600 hover:bg-cloud hover:text-ink cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(item)}
                            className="p-1.5 rounded-lg bg-cloud/50 text-ink-600 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                            title={item.is_archived ? "Pulihkan" : "Arsipkan"}
                          >
                            {item.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingItem(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-cloud/50 text-ink-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
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
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-ink/10 p-6">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
            <Megaphone size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-ink">Tidak Ada Pengumuman</h3>
          <p className="text-ink-400 text-xs sm:text-sm mt-1 max-w-sm">
            Tidak ditemukan pengumuman yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategoryFilter("ALL");
                setTargetFilter("ALL");
                setActiveTab("active");
              }}
              className="rounded-2xl text-xs font-bold"
            >
              Reset Filter
            </Button>
            <Button
              onClick={openCreateModal}
              className="rounded-2xl text-md font-bold bg-ink text-white"
            >
              <Plus size={14} className="mr-1.5" /> Buat Pengumuman Baru
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 1: FAST CREATE / EDIT PENGUMUMAN */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-ink/10 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-ink/5 flex items-center justify-between bg-cloud/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
                    {isEditModalOpen ? "Edit Pengumuman HR" : "Buat Pengumuman Baru"}
                  </h2>
                  <p className="text-sm text-ink-400">
                    {isEditModalOpen
                      ? "Perbarui isi atau konfigurasi pengumuman"
                      : "Publikasikan informasi resmi untuk seluruh karyawan"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="w-9 h-9 rounded-xl bg-white border border-ink/10 hover:bg-cloud flex items-center justify-center text-ink-400 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Form */}
            <form
              onSubmit={isEditModalOpen ? handleEditSubmit : handleCreateSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6"
            >
              {/* Judul Pengumuman */}
              <div className="space-y-1.5">
                <Label htmlFor="ann_title" className="text-sm font-bold text-ink-700">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="ann_title"
                  placeholder="Contoh: Surat Edaran Penyesuaian Jam Kerja Bulan Ramadhan 1447H"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                  className="h-12 rounded-2xl bg-cloud/40 border-ink/10 text-sm font-semibold text-ink focus-visible:ring-sky-500"
                />
              </div>

              {/* Kategori & Priority Toggle Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ann_category" className="text-sm font-bold text-ink-700">
                    Kategori <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="ann_category"
                    value={formState.category}
                    onChange={(e: any) =>
                      setFormState({ ...formState, category: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-2xl bg-cloud/40 border border-ink/10 text-sm font-bold text-ink-700 outline-none focus:border-sky-500 transition-colors cursor-pointer"
                  >
                    <option value="KEBIJAKAN_BARU">Kebijakan Baru</option>
                    <option value="INFO_CUTI">Info Cuti & Libur</option>
                    <option value="EVENT">Event & Agenda</option>
                    <option value="PENTING">Penting & Mendesak</option>
                    <option value="LAINNYA">Informasi Umum</option>
                  </select>
                </div>

                {/* Priority Toggle Card */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    formState.is_important
                      ? "bg-rose-50/80 border-rose-200"
                      : "bg-cloud/30 border-ink/5"
                  }`}
                >
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="modal_priority"
                      className="text-sm font-extrabold text-ink-800 cursor-pointer flex items-center gap-1.5"
                    >
                      <Pin size={13} className={formState.is_important ? "text-rose-600 fill-rose-600" : "text-ink-400"} />
                      Tandai Penting & Urgent
                    </Label>
                    <p className="text-xs text-ink-400">
                      Notifikasi push dan pin di beranda karyawan
                    </p>
                  </div>
                  <Switch
                    id="modal_priority"
                    checked={formState.is_important}
                    onCheckedChange={(checked) =>
                      setFormState({ ...formState, is_important: checked })
                    }
                    className="data-[state=checked]:bg-rose-500"
                  />
                </div>
              </div>

              {/* Target Audience Multi-Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink-700">
                  Target Penerima Pengumuman
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TARGET_OPTIONS.map((t) => {
                    const isSelected = formState.target.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTarget(t.id)}
                        className={`p-3 rounded-2xl border text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-ink text-white border-ink shadow-xs"
                            : "bg-cloud/40 text-ink-600 border-ink/10 hover:bg-cloud"
                        }`}
                      >
                        <span>{t.label}</span>
                        {isSelected && <Check size={14} className="ml-auto text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Konten Pengumuman with Format Helper Toolbar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ann_content" className="text-sm font-bold text-ink-700">
                    Isi Konten Pengumuman <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <span className="font-bold">Format Cepat:</span>
                    <button
                      type="button"
                      onClick={() => insertContentFormat("bold")}
                      className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentFormat("bullet")}
                      className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentFormat("number")}
                      className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition"
                    >
                      1. Angka
                    </button>
                    <button
                      type="button"
                      onClick={() => insertContentFormat("quote")}
                      className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition"
                    >
                      &quot; Kutip
                    </button>
                  </div>
                </div>

                <Textarea
                  id="ann_content"
                  placeholder="Tuliskan detail surat edaran, regulasi, petunjuk teknis, atau pengumuman di sini secara lengkap..."
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  required
                  rows={8}
                  className="rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm font-medium leading-relaxed p-4 focus-visible:ring-sky-500 resize-y min-h-[160px]"
                />
              </div>

              {/* Attachment Section */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink-700">
                  Lampiran Dokumen (PDF, JPG, PNG maks 10MB)
                </Label>
                {formState.attachment_url ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-14 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-sky-950">
                          {uploadFileName || "Dokumen Terlampir"}
                        </div>
                        <a
                          href={formState.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          Lihat lampiran <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormState({ ...formState, attachment_url: "" });
                        setUploadFileName(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-ink/10 hover:border-sky-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-sky-50/40 transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingFile}
                    />
                    <div className="w-18 h-18 rounded-full bg-cloud text-ink-400 flex items-center justify-center">
                      {isUploadingFile ? (
                        <RefreshCw size={20} className="animate-spin text-sky-600" />
                      ) : (
                        <UploadCloud size={32} />
                      )}
                    </div>
                    <div>
                      <span className="text-md font-bold text-ink">
                        {isUploadingFile ? "Mengunggah file..." : "Klik untuk upload lampiran"}
                      </span>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        PDF, Dokumen Edaran Resmi, atau Foto (Maks 10MB)
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-ink/5 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-2xl h-11 px-5 text-xs font-bold text-ink-500 hover:bg-cloud"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isUploadingFile}
                  className="rounded-2xl h-11 px-7 text-xs font-bold bg-ink hover:bg-ink/90 text-white shadow-md cursor-pointer gap-2"
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> {isEditModalOpen ? "Perbarui Pengumuman" : "Terbitkan Pengumuman"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL DETAIL & LIVE READER TRACKING */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-ink/10 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-ink/5 bg-cloud/30 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      CATEGORY_CONFIG[selectedItem.category]?.badge || ""
                    }`}
                  >
                    {CATEGORY_CONFIG[selectedItem.category]?.label}
                  </span>
                  {selectedItem.is_important && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                      <Pin size={10} /> PENTING
                    </span>
                  )}
                  <span className="text-[11px] text-ink-400 font-medium">
                    Diterbitkan: {formatDate(selectedItem.created_at)}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-ink tracking-tight">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white border border-ink/10 hover:bg-cloud flex items-center justify-center text-ink-400 hover:text-ink transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs (Konten vs Pembaca) */}
            <div className="flex border-b border-ink/5 px-6 bg-white">
              <button
                type="button"
                onClick={() => setDetailTab("content")}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  detailTab === "content"
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-400 hover:text-ink"
                }`}
              >
                <FileText size={14} /> Isi Pengumuman
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("readers")}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  detailTab === "readers"
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-400 hover:text-ink"
                }`}
              >
                <Users size={14} /> Tracking Pembaca ({readerStats?.readCount || selectedItem.read_count || 0}/
                {totalEmployeesCount})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              {detailTab === "content" ? (
                <div className="space-y-6">
                  {/* Meta Details Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-cloud/40 border border-ink/5 text-xs">
                    <div>
                      <span className="text-ink-400 font-medium">Target Penerima:</span>
                      <div className="font-bold text-ink mt-0.5">
                        {selectedItem.target.join(", ")}
                      </div>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Pengirim:</span>
                      <div className="font-bold text-ink mt-0.5">
                        {selectedItem.author_name || "HR Management"}
                      </div>
                    </div>
                    <div>
                      <span className="text-ink-400 font-medium">Status Dokumen:</span>
                      <div className="font-bold text-ink mt-0.5">
                        {selectedItem.is_archived ? "📦 Diarsipkan" : "📢 Aktif"}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="prose prose-sm max-w-none text-ink-800 leading-relaxed whitespace-pre-line bg-white font-normal text-xs sm:text-sm">
                    {selectedItem.content}
                  </div>

                  {/* Attachment Box if available */}
                  {selectedItem.attachment_url && (
                    <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-sky-950">Lampiran Resmi</div>
                          <div className="text-[11px] text-sky-700">
                            Unduh atau pratinjau dokumen lampiran
                          </div>
                        </div>
                      </div>
                      <a
                        href={selectedItem.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Download size={13} /> Unduh File
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: LIVE READERS TRACKING */
                <div className="space-y-4">
                  {/* Analytics Stats Pill */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-cloud/50 border border-ink/5 text-center">
                    <div>
                      <div className="text-lg font-extrabold text-ink">
                        {readerStats?.total || totalEmployeesCount}
                      </div>
                      <div className="text-[10px] text-ink-400 font-bold uppercase">Total Karyawan</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-emerald-600">
                        {readerStats?.readCount || 0}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold uppercase">Sudah Baca</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-rose-600">
                        {readerStats?.unreadCount || 0}
                      </div>
                      <div className="text-[10px] text-rose-700 font-bold uppercase">Belum Baca</div>
                    </div>
                  </div>

                  {/* Search & Filter within Reader List */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <Input
                        placeholder="Cari nama karyawan..."
                        value={readerSearch}
                        onChange={(e) => setReaderSearch(e.target.value)}
                        className="pl-9 h-9 rounded-xl text-xs bg-cloud/30"
                      />
                    </div>
                    <div className="flex p-0.5 bg-cloud rounded-xl self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setReaderFilter("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          readerFilter === "ALL" ? "bg-white text-ink shadow-xs" : "text-ink-400"
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaderFilter("READ")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          readerFilter === "READ" ? "bg-white text-emerald-600 shadow-xs" : "text-ink-400"
                        }`}
                      >
                        Sudah
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaderFilter("UNREAD")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          readerFilter === "UNREAD" ? "bg-white text-rose-600 shadow-xs" : "text-ink-400"
                        }`}
                      >
                        Belum
                      </button>
                    </div>
                  </div>

                  {/* Readers List */}
                  {isLoadingReaders ? (
                    <div className="py-12 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Memuat data pembaca...
                    </div>
                  ) : (
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-ink/5 border border-ink/5 rounded-2xl">
                      {(readerStats?.readers || [])
                        .filter((r) => {
                          if (readerFilter === "READ" && !r.has_read) return false;
                          if (readerFilter === "UNREAD" && r.has_read) return false;
                          if (
                            readerSearch &&
                            !r.full_name.toLowerCase().includes(readerSearch.toLowerCase())
                          )
                            return false;
                          return true;
                        })
                        .map((reader) => (
                          <div
                            key={reader.employee_id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-cloud/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cloud-200 text-ink-600 font-bold text-xs flex items-center justify-center overflow-hidden">
                                {reader.photo_url ? (
                                  <img
                                    src={reader.photo_url}
                                    alt={reader.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  reader.full_name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-ink">{reader.full_name}</div>
                                <div className="text-[10px] text-ink-400">
                                  {reader.position} • {reader.employee_type}
                                </div>
                              </div>
                            </div>
                            <div>
                              {reader.has_read ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                  <Check size={10} /> Dibaca {formatRelativeTime(reader.read_at!)}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                                  <X size={10} /> Belum Membaca
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detail Footer */}
            <div className="p-4 sm:p-5 border-t border-ink/5 bg-cloud/20 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAnnouncementLink(selectedItem.id)}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                {copiedLink ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedLink ? "Tautan Disalin" : "Salin Tautan"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openEditModal(selectedItem);
                  }}
                  className="rounded-xl text-xs font-bold"
                >
                  <Edit2 size={13} className="mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl text-xs font-bold bg-ink text-white"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-ink/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-ink">Hapus Pengumuman Ini?</h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Pengumuman <span className="font-bold text-ink">&ldquo;{deletingItem.title}&rdquo;</span> akan
                dihapus dari sistem. Karyawan tidak akan dapat melihat pengumuman ini lagi.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingItem(null);
                }}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
