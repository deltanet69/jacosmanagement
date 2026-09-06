"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Save,
  UploadCloud,
  Pin,
  Megaphone,
  Check,
  FileText,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Eye,
  Clock,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createHrAnnouncement,
  uploadHrAnnouncementAttachment,
  AnnouncementCategory,
} from "@/app/management/hr/pengumuman/actions";

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { label: string; badge: string }
> = {
  KEBIJAKAN_BARU: {
    label: "Kebijakan Baru",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  INFO_CUTI: {
    label: "Info Cuti & Libur",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  EVENT: {
    label: "Event & Agenda",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  PENTING: {
    label: "Penting & Mendesak",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  LAINNYA: {
    label: "Informasi Umum",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const TARGET_OPTIONS = [
  { id: "SEMUA", label: "Semua Karyawan" },
  { id: "GURU", label: "Seluruh Guru" },
  { id: "STAF", label: "Seluruh Staf" },
  { id: "HR_ADMIN", label: "Khusus Tim HR" },
];

export default function CreatePengumumanPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "KEBIJAKAN_BARU" as AnnouncementCategory,
    content: "",
    is_important: false,
    target: ["SEMUA"] as string[],
    attachment_url: "",
  });

  const toggleTarget = (targetId: string) => {
    setFormData((prev) => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const data = new FormData();
      data.append("file", file);
      const res = await uploadHrAnnouncementAttachment(data);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, attachment_url: res.url }));
        setFileName(res.fileName || file.name);
      } else {
        setErrorMessage(res.message || "Gagal mengunggah lampiran");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
    }
  };

  const insertFormat = (syntax: "bold" | "bullet" | "number" | "quote") => {
    const current = formData.content;
    let appended = "";
    if (syntax === "bold") appended = "\n**Teks Tebal**";
    if (syntax === "bullet") appended = "\n- Poin pengumuman 1\n- Poin pengumuman 2";
    if (syntax === "number") appended = "\n1. Langkah pertama\n2. Langkah kedua";
    if (syntax === "quote") appended = "\n> Catatan penting dari manajemen:";
    setFormData((prev) => ({ ...prev, content: current + appended }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setErrorMessage("Judul pengumuman wajib diisi minimal 3 karakter");
      return;
    }
    if (!formData.content.trim() || formData.content.trim().length < 10) {
      setErrorMessage("Isi pengumuman wajib diisi minimal 10 karakter");
      return;
    }

    startTransition(async () => {
      const res = await createHrAnnouncement({
        title: formData.title,
        category: formData.category,
        content: formData.content,
        is_important: formData.is_important,
        target: formData.target,
        attachment_url: formData.attachment_url,
      });

      if (res.success) {
        router.push("/management/hr/pengumuman");
      } else {
        setErrorMessage(res.message || "Gagal menerbitkan pengumuman");
      }
    });
  };

  const currentCategoryConfig =
    CATEGORY_CONFIG[formData.category] || CATEGORY_CONFIG.LAINNYA;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/management/hr/pengumuman">
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-11 w-11 border-ink/10 bg-white hover:bg-cloud cursor-pointer"
            >
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Buat Pengumuman Baru
            </h1>
            <p className="text-ink-400 text-xs sm:text-sm mt-0.5">
              Siarkan informasi kebijakan, jadwal libur, dan edaran penting ke seluruh karyawan JACOS.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout: Editor Form + Real-time Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-ink/5 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-ink-700">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Surat Edaran Penyesuaian Jadwal Mengajar Semester Genap"
                required
                className="h-12 bg-cloud/40 border-ink/10 text-sm font-semibold text-ink rounded-2xl focus-visible:ring-sky-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold text-ink-700">
                  Kategori Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="category"
                  className="w-full h-12 px-4 rounded-2xl bg-cloud/40 border border-ink/10 text-xs sm:text-sm font-bold text-ink-700 outline-none focus:border-sky-500 transition-colors cursor-pointer"
                  value={formData.category}
                  onChange={(e: any) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
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
                  formData.is_important
                    ? "bg-rose-50/80 border-rose-200"
                    : "bg-cloud/30 border-ink/5"
                }`}
              >
                <div className="space-y-0.5">
                  <Label
                    className="text-xs font-extrabold text-ink-800 cursor-pointer flex items-center gap-1.5"
                    htmlFor="priority"
                  >
                    <Pin
                      size={13}
                      className={
                        formData.is_important ? "text-rose-600 fill-rose-600" : "text-ink-400"
                      }
                    />
                    Tandai Penting & Urgent
                  </Label>
                  <p className="text-[10px] text-ink-400">Kirim push alert ke seluruh target</p>
                </div>
                <Switch
                  id="priority"
                  checked={formData.is_important}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_important: checked })
                  }
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-ink-700">
                Target Penerima Pengumuman
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TARGET_OPTIONS.map((t) => {
                  const isSelected = formData.target.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTarget(t.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-ink text-white border-ink shadow-xs"
                          : "bg-cloud/40 text-ink-600 border-ink/10 hover:bg-cloud"
                      }`}
                    >
                      <span className="truncate">{t.label}</span>
                      {isSelected && <Check size={12} className="ml-auto text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Textarea with Formatting toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs font-bold text-ink-700">
                  Isi Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <div className="flex items-center gap-1 text-[11px] text-ink-400">
                  <span className="font-bold">Format:</span>
                  <button
                    type="button"
                    onClick={() => insertFormat("bold")}
                    className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition cursor-pointer"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("bullet")}
                    className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition cursor-pointer"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("number")}
                    className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition cursor-pointer"
                  >
                    1. Angka
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("quote")}
                    className="px-2 py-0.5 rounded-lg bg-cloud hover:bg-ink hover:text-white font-bold transition cursor-pointer"
                  >
                    &quot; Kutip
                  </button>
                </div>
              </div>

              <Textarea
                id="content"
                placeholder="Tuliskan isi pengumuman, petunjuk teknis, detail surat edaran, atau keputusan resmi manajemen..."
                required
                rows={9}
                className="rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm font-medium leading-relaxed p-4 focus-visible:ring-sky-500 resize-y"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-ink-700">
                Lampiran Dokumen Resmi (Opsional)
              </Label>
              {formData.attachment_url ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-950">
                        {fileName || "Dokumen Lampiran Terunggah"}
                      </div>
                      <a
                        href={formData.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        Pratinjau File <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, attachment_url: "" });
                      setFileName(null);
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
                    disabled={isUploading}
                  />
                  <div className="w-10 h-10 rounded-2xl bg-cloud text-ink-400 flex items-center justify-center">
                    {isUploading ? (
                      <RefreshCw size={18} className="animate-spin text-sky-600" />
                    ) : (
                      <UploadCloud size={20} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink">
                      {isUploading ? "Mengunggah lampiran..." : "Upload file surat / edaran"}
                    </span>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      PDF, JPG, PNG, atau DOCX (Maksimal 10MB)
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Actions Button */}
            <div className="pt-4 border-t border-ink/5 flex items-center justify-end gap-3">
              <Link href="/management/hr/pengumuman">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl h-11 px-5 text-xs font-bold text-ink-500 hover:bg-cloud"
                >
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending || isUploading}
                className="rounded-2xl h-11 px-7 text-xs font-bold bg-ink hover:bg-ink/90 text-white shadow-md cursor-pointer gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Menerbitkan...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Terbitkan Pengumuman
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-ink-400 text-xs font-bold px-1">
            <Eye size={14} /> Pratinjau Tampilan Live di Portal Guru & Staf
          </div>

          <div
            className={`bg-white rounded-[2rem] p-6 border shadow-sm relative overflow-hidden transition-all ${
              formData.is_important
                ? "border-rose-300 ring-1 ring-rose-200/50"
                : "border-ink/5"
            }`}
          >
            {formData.is_important && (
              <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-2xl z-10 flex items-center gap-1">
                <Pin size={10} className="fill-white" /> PENTING & URGENT
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${currentCategoryConfig.badge}`}
                >
                  <span>{currentCategoryConfig.label}</span>
                </span>
                <span className="text-[11px] text-ink-400 font-medium flex items-center gap-1 ml-auto">
                  <Clock size={11} /> Baru saja
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-ink leading-snug">
                  {formData.title || "Judul Pengumuman Akan Ditampilkan di Sini"}
                </h3>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.target.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-lg bg-cloud text-ink-500 text-[10px] font-bold"
                    >
                      {t === "SEMUA" && "👥 Semua Karyawan"}
                      {t === "GURU" && "🎓 Guru"}
                      {t === "STAF" && "💼 Staf"}
                      {t === "HR_ADMIN" && "🔒 Tim HR"}
                      {!["SEMUA", "GURU", "STAF", "HR_ADMIN"].includes(t) && t}
                    </span>
                  ))}
                  {formData.attachment_url && (
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold flex items-center gap-1">
                      <FileText size={10} /> Dokumen
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cloud/30 border border-ink/5 text-xs text-ink-700 leading-relaxed whitespace-pre-line min-h-[100px]">
                {formData.content || "Detail isi pengumuman akan ditampilkan di area ini."}
              </div>

              {formData.attachment_url && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-sky-600" />
                    <span className="font-bold text-sky-900 truncate max-w-[180px]">
                      {fileName || "Dokumen Terlampir"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600">Terlampir</span>
                </div>
              )}

              <div className="pt-3 border-t border-ink/5 flex items-center justify-between text-[11px] text-ink-400 font-medium">
                <span>Pengirim: HR Management</span>
                <span>Status: Pratinjau</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/60 text-xs text-sky-900 leading-relaxed">
            <span className="font-extrabold block mb-1">💡 Tips Penyebaran Informasi:</span>
            Gunakan kategori yang sesuai agar guru dan staf dapat menyaring pengumuman dengan cepat. Tandai sebagai <span className="font-bold text-rose-700">Penting</span> hanya untuk edaran darurat atau instruksi wajib.
          </div>
        </div>
      </div>
    </div>
  );
}
