"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  X,
  Check,
  AlertCircle,
  Save,
  Globe,
  Users,
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import {
  createAnnouncement,
  updateAnnouncement,
  uploadAnnouncementThumbnail,
  AnnouncementItem
} from "./actions";

interface FormInformasiProps {
  initialData?: AnnouncementItem;
  classes: { id: string; name: string; grade?: string }[];
  isEdit?: boolean;
}

const CATEGORIES = [
  "Informasi Akademik",
  "Informasi Non Akademik",
  "Informasi Kegiatan Sekolah",
  "Informasi Ekstrakurikuler"
];

export function FormInformasi({ initialData, classes, isEdit = false }: FormInformasiProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(initialData?.category || "Informasi Akademik");
  const [targetType, setTargetType] = useState<"GENERAL" | "SPECIFIC_CLASSES">(
    initialData?.target_type || "GENERAL"
  );
  const [targetClasses, setTargetClasses] = useState<string[]>(
    initialData?.target_classes || []
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialData?.thumbnail_url || null
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [isPublished, setIsPublished] = useState<boolean>(
    initialData ? initialData.is_published : true
  );

  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Handle Thumbnail Upload with Compression
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setIsUploadingThumb(true);

    try {
      // Compress options: max 1MB, maxWidthOrHeight 1280
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("file", compressedFile, file.name);

      const res = await uploadAnnouncementThumbnail(formData);
      if (res.success && res.url) {
        setThumbnailUrl(res.url);
      } else {
        setErrorMsg(res.message || "Gagal mengunggah thumbnail");
      }
    } catch (err: any) {
      console.error("Compression / upload error:", err);
      setErrorMsg("Gagal memproses gambar thumbnail");
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleToggleClass = (classId: string) => {
    if (targetClasses.includes(classId)) {
      setTargetClasses(targetClasses.filter((id) => id !== classId));
    } else {
      setTargetClasses([...targetClasses, classId]);
    }
  };

  const handleSelectAllClasses = () => {
    if (targetClasses.length === classes.length) {
      setTargetClasses([]);
    } else {
      setTargetClasses(classes.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Judul informasi wajib diisi");
      return;
    }
    if (!content.trim() || content === "<p></p>" || content === "<br>") {
      setErrorMsg("Konten isi informasi wajib diisi");
      return;
    }
    if (targetType === "SPECIFIC_CLASSES" && targetClasses.length === 0) {
      setErrorMsg("Pilih minimal satu kelas target informasi");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        category,
        target_type: targetType,
        target_classes: targetClasses,
        thumbnail_url: thumbnailUrl,
        content,
        is_published: isPublished
      };

      let res;
      if (isEdit && initialData?.id) {
        res = await updateAnnouncement(initialData.id, payload);
      } else {
        res = await createAnnouncement(payload);
      }

      if (res.success) {
        router.push("/management/informasi");
        router.refresh();
      } else {
        setErrorMsg(res.message || "Gagal menyimpan informasi");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/management/informasi"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink-400 hover:text-ink transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-ink/10 flex items-center justify-center shadow-xs">
            <ArrowLeft size={18} />
          </div>
          <span>Kembali ke Daftar Informasi</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/management/informasi")}
            disabled={isSubmitting}
            className="h-12 px-5 rounded-xl border-ink/10 font-bold text-ink-400 hover:text-ink"
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-6 rounded-xl bg-ink hover:bg-ink-600 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{isEdit ? "Perbarui Informasi" : "Publikasikan Informasi"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-coral-50 border border-coral-200 text-coral-700 text-sm font-semibold animate-shake">
          <AlertCircle size={20} className="shrink-0 text-coral" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Cards (Full Width 12-col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Column (Main Content: 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Judul & Konten */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/10 shadow-xs space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                Judul Informasi <span className="text-coral">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Jadwal Pelaksanaan Ujian Tengah Semester Ganjil 2026/2027"
                className="h-14 px-4 rounded-2xl border-ink/10 font-bold text-lg text-ink focus-visible:ring-2 focus-visible:ring-sky/30"
                maxLength={200}
                required
              />
              <p className="text-right text-xs text-ink-300 mt-1.5">{title.length}/200 karakter</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                Isi & Detail Informasi <span className="text-coral">*</span>
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Tuliskan isi pengumuman, agenda kegiatan, jadwal, atau ketentuan lengkap di sini..."
                minHeight="320px"
              />
            </div>
          </div>

          {/* Target Penerima Informasi */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/10 shadow-xs space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Users size={20} className="text-sky" /> Target Penerima Informasi
              </h3>
              <p className="text-xs text-ink-400 mt-1">
                Tentukan apakah informasi ini ditujukan untuk seluruh orang tua atau kelas tertentu.
              </p>
            </div>

            {/* Segmented Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType("GENERAL")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  targetType === "GENERAL"
                    ? "bg-sky-50/70 border-sky ring-2 ring-sky/20"
                    : "bg-white border-ink/10 hover:border-ink/20"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    targetType === "GENERAL" ? "bg-sky text-white" : "bg-cloud text-ink-400"
                  }`}
                >
                  <Globe size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-ink text-sm">Umum (Semua Orang Tua)</h4>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Ditampilkan ke seluruh orang tua murid tanpa batas kelas.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("SPECIFIC_CLASSES")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  targetType === "SPECIFIC_CLASSES"
                    ? "bg-coral-50/70 border-coral ring-2 ring-coral/20"
                    : "bg-white border-ink/10 hover:border-ink/20"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    targetType === "SPECIFIC_CLASSES"
                      ? "bg-coral text-white"
                      : "bg-cloud text-ink-400"
                  }`}
                >
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-ink text-sm">Kelas Tertentu</h4>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Hanya dapat dilihat oleh orang tua dari kelas yang dipilih.
                  </p>
                </div>
              </button>
            </div>

            {/* Class Multi-Select Grid if SPECIFIC_CLASSES */}
            {targetType === "SPECIFIC_CLASSES" && (
              <div className="pt-4 border-t border-ink/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Pilih Kelas ({targetClasses.length} dipilih)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-xs font-bold text-sky hover:underline"
                  >
                    {targetClasses.length === classes.length ? "Batal Pilih Semua" : "Pilih Semua Kelas"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {classes.map((cls) => {
                    const isSelected = targetClasses.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleToggleClass(cls.id)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-sky text-white border-sky shadow-xs"
                            : "bg-cloud/50 border-ink/10 text-ink-500 hover:bg-white hover:text-ink"
                        }`}
                      >
                        <span>Kelas {cls.name}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar Settings: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Thumbnail Box */}
          <div className="bg-white rounded-3xl p-6 border border-ink/10 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <Sparkles size={18} className="text-gold" /> Thumbnail / Poster
            </h3>
            <p className="text-xs text-ink-400">
              Format JPG/PNG. Otomatis dikompresi agar ringan saat dibuka di mobile.
            </p>

            {thumbnailUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-ink/10 aspect-video bg-cloud">
                <Image
                  src={thumbnailUrl}
                  alt="Thumbnail Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ink/70 text-white hover:bg-coral transition-colors flex items-center justify-center shadow-md"
                  title="Hapus gambar"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-ink/15 hover:border-sky rounded-2xl cursor-pointer bg-cloud/30 hover:bg-sky-50/40 transition-all text-center group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-ink/5 flex items-center justify-center text-ink-400 group-hover:text-sky group-hover:scale-105 transition-all mb-3">
                  {isUploadingThumb ? (
                    <Loader2 size={22} className="animate-spin text-sky" />
                  ) : (
                    <Upload size={22} />
                  )}
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-sky transition-colors">
                  {isUploadingThumb ? "Mengompres & Mengunggah..." : "Pilih Gambar Thumbnail"}
                </span>
                <span className="text-[11px] text-ink-300 mt-1">Maksimal 5MB (Auto-compress)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isUploadingThumb}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Kategori Informasi */}
          <div className="bg-white rounded-3xl p-6 border border-ink/10 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-ink">Kategori Informasi</h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    category === cat
                      ? "bg-coral-50 text-coral border-coral ring-1 ring-coral/30"
                      : "bg-white border-ink/10 text-ink-500 hover:bg-cloud hover:text-ink"
                  }`}
                >
                  <span>{cat}</span>
                  {category === cat && <CheckCircle2 size={16} className="text-coral" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status Publikasi */}
          <div className="bg-white rounded-3xl p-6 border border-ink/10 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-ink">Status Publikasi</h3>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cloud/50 border border-ink/5">
              <div>
                <p className="text-xs font-bold text-ink">Langsung Terbit</p>
                <p className="text-[11px] text-ink-400 mt-0.5">
                  {isPublished ? "Tampil di Parent Portal" : "Disimpan sebagai Draf"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 accent-leaf rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
