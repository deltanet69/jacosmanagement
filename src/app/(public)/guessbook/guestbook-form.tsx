"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Baby,
  GraduationCap,
  Calendar,
  Clock,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Building2,
  Compass,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Heart,
  Loader2,
  Printer,
  RefreshCw,
  Briefcase,
  School,
  FileCheck,
  Users2,
  Layers,
} from "lucide-react";
import { submitGuestbookEntry, type GuestbookFormData, type GuestbookSubmissionResult } from "./actions";

// Tujuan Kunjungan Options
const PURPOSE_OPTIONS = [
  {
    id: "school-visit",
    value: "school visit / school tour",
    label: "School Visit / School Tour",
    description: "Kunjungan & observasi keliling lingkungan kampus JACOS",
    icon: School,
    color: "from-sky to-sky-600",
    borderActive: "border-sky bg-sky-50/80 ring-2 ring-sky-200",
    badgeColor: "bg-sky-100 text-sky-700",
  },
  {
    id: "admission",
    value: "admission / registration",
    label: "Admission / Registration",
    description: "Konsultasi pendaftaran siswa baru & program kurikulum",
    icon: FileCheck,
    color: "from-leaf to-leaf-600",
    borderActive: "border-leaf bg-leaf-50/80 ring-2 ring-leaf-200",
    badgeColor: "bg-leaf-100 text-leaf-700",
  },
  {
    id: "parent-student",
    value: "parent / student matters",
    label: "Parent / Student Matters",
    description: "Keperluan wali murid / konsultasi terkait ananda siswa JACOS",
    icon: Users2,
    color: "from-coral to-coral-600",
    borderActive: "border-coral bg-coral-50/80 ring-2 ring-coral-200",
    badgeColor: "bg-coral-100 text-coral-700",
    hasExtraStep: true,
  },
  {
    id: "meeting-business",
    value: "meeting / business",
    label: "Meeting / Business",
    description: "Pertemuan dinas, yayasan, vendor, atau urusan kedinasan",
    icon: Briefcase,
    color: "from-indigo-500 to-indigo-600",
    borderActive: "border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "others",
    value: "Others...",
    label: "Others...",
    description: "Keperluan kunjungan lainnya",
    icon: Layers,
    color: "from-amber-500 to-amber-600",
    borderActive: "border-amber-500 bg-amber-50/80 ring-2 ring-amber-200",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

// Pilihan Jenjang untuk Parent / Student Matters
const STUDENT_GRADES = [
  {
    id: "pre-school",
    value: "Pre-school",
    label: "Pre-school",
    sub: "Toddler / Playgroup (Usia 1.5 - 3 Tahun)",
    color: "text-amber-600",
    badge: "Pre-school",
  },
  {
    id: "kindergarten",
    value: "Kindergarten",
    label: "Kindergarten",
    sub: "TK A & TK B (Usia 4 - 6 Tahun)",
    color: "text-sky-600",
    badge: "Kindergarten",
  },
  {
    id: "primary-school",
    value: "Primary school",
    label: "Primary school",
    sub: "SD Kelas 1 - 6 (Usia 6 - 12 Tahun)",
    color: "text-leaf-600",
    badge: "Primary School",
  },
];

export default function GuestbookForm() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<GuestbookSubmissionResult["ticket"] | null>(null);

  // Realtime Clock State
  const [currentDateTime, setCurrentDateTime] = useState<{
    dateFormatted: string;
    timeFormatted: string;
    dayFormatted: string;
    isoDate: string;
  }>({
    dateFormatted: "",
    timeFormatted: "",
    dayFormatted: "",
    isoDate: "",
  });

  // Form State
  const [formData, setFormData] = useState<GuestbookFormData>({
    parent_name: "",
    whatsapp: "",
    email: "",
    address_detail: "",
    visit_purpose: "school visit / school tour",
    other_purpose: "",
    child_name: "",
    target_grade: "Kindergarten",
    visit_date: "",
    visit_time: "",
    notes: "",
  });

  // Live Realtime Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const formattedDate = now.toLocaleDateString("id-ID", optionsDate);
      const formattedTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";

      const dayName = now.toLocaleDateString("id-ID", { weekday: "long" });
      const isoDate = now.toISOString().split("T")[0];

      setCurrentDateTime({
        dateFormatted: formattedDate,
        timeFormatted: formattedTime,
        dayFormatted: dayName,
        isoDate: isoDate,
      });

      setFormData((prev) => ({
        ...prev,
        visit_date: prev.visit_date || isoDate,
        visit_time: prev.visit_time || formattedTime,
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isParentStudentMatter = formData.visit_purpose === "parent / student matters";

  // Form Validation
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.parent_name.trim() || formData.parent_name.trim().length < 2) {
        setErrorMsg("Silakan isi nama lengkap Anda (minimal 2 karakter).");
        return false;
      }
      if (!formData.whatsapp.trim() || formData.whatsapp.replace(/[^0-9]/g, "").length < 8) {
        setErrorMsg("Silakan isi nomor Telepon / WhatsApp aktif minimal 8 digit.");
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        setErrorMsg("Silakan isi format alamat email yang valid.");
        return false;
      }
      if (!formData.address_detail.trim() || formData.address_detail.trim().length < 3) {
        setErrorMsg("Silakan isi alamat tempat tinggal / instansi Anda.");
        return false;
      }
      if (!formData.visit_purpose) {
        setErrorMsg("Silakan pilih salah satu tujuan kunjungan.");
        return false;
      }
      if (formData.visit_purpose === "Others..." && !formData.other_purpose?.trim()) {
        setErrorMsg("Silakan jelaskan tujuan kunjungan Anda pada kolom keterangan Others.");
        return false;
      }
      return true;
    }

    if (step === 2 && isParentStudentMatter) {
      if (!formData.child_name?.trim() || formData.child_name.trim().length < 2) {
        setErrorMsg("Silakan isi nama lengkap siswa (ananda).");
        return false;
      }
      if (!formData.target_grade) {
        setErrorMsg("Silakan pilih jenjang pendidikan siswa (Pre-school / Kindergarten / Primary school).");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextOrSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateStep(currentStep)) return;

    if (currentStep === 1 && isParentStudentMatter) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Submit Direct
    executeSubmit();
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: GuestbookFormData = {
        ...formData,
        visit_date: currentDateTime.isoDate || new Date().toISOString().split("T")[0],
        visit_time: currentDateTime.timeFormatted || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      };

      const res = await submitGuestbookEntry(payload);
      if (res.success && res.ticket) {
        setTicketResult(res.ticket);
      } else {
        setErrorMsg(res.message || "Gagal menyimpan data buku tamu. Silakan coba kembali.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan jaringan internet. Silakan coba kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN / VISIT PASS TICKET
  if (ticketResult) {
    const waText = encodeURIComponent(
      `Assalamu'alaikum Tim Admisi JACOS, saya *${ticketResult.parentName}* (Kode Kunjungan: *${ticketResult.visitCode}*). Saya baru saja mengisi Buku Tamu digital JACOS untuk keperluan: *${ticketResult.visitPurpose}*${
        ticketResult.childName ? ` (Siswa: *${ticketResult.childName}* - *${ticketResult.targetGrade}*)` : ""
      }. Terima kasih!`
    );

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl overflow-hidden">
          {/* Header Pass */}
          <div className="relative bg-gradient-to-br from-sky to-sky-700 text-white p-6 sm:p-8 text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-gold/20 rounded-full blur-xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-gold-100 text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles size={14} className="text-gold" />
              Digital Guestbook Pass
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Datang di JACOS!
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Data kunjungan Anda telah berhasil tersimpan dalam sistem buku tamu sekolah.
            </p>

            {/* Visit Code Badge */}
            <div className="mt-5 inline-block bg-white text-ink px-5 py-2.5 rounded-2xl shadow-lg border border-sky-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-ink-300 block">
                Kode Kunjungan Tamu
              </span>
              <span className="text-lg sm:text-xl font-black text-sky tracking-wider">
                {ticketResult.visitCode}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Greeting Note */}
            <div className="bg-leaf-50 border border-leaf-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf text-white flex items-center justify-center shrink-0 mt-0.5">
                <Heart size={18} />
              </div>
              <div className="text-xs sm:text-sm text-ink-400 leading-relaxed">
                <strong className="text-ink font-bold">Terima kasih, Bapak/Ibu {ticketResult.parentName}!</strong>
                <br />
                Senang sekali dapat menyambut kehadiran Anda di lingkungan Jakarta Cosmopolite Islamic School (JACOS).
              </div>
            </div>

            {/* Detail Grid */}
            <div className="bg-cloud rounded-2xl p-4 sm:p-5 border border-ink/5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Nama Tamu</span>
                <span className="font-bold text-ink">{ticketResult.parentName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Tujuan Kunjungan</span>
                <span className="font-bold text-sky capitalize">{ticketResult.visitPurpose}</span>
              </div>

              {ticketResult.childName && (
                <>
                  <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                    <span className="text-ink-300 font-semibold">Nama Siswa</span>
                    <span className="font-bold text-ink">{ticketResult.childName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                    <span className="text-ink-300 font-semibold">Jenjang Siswa</span>
                    <span className="font-bold text-coral-600">{ticketResult.targetGrade}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Waktu Kunjungan</span>
                <span className="font-bold text-gold-600">
                  {ticketResult.visitDate} • {ticketResult.visitTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">No. Telepon / WA</span>
                <span className="font-bold text-ink">{ticketResult.whatsapp}</span>
              </div>
              <div className="flex justify-between items-start py-1.5">
                <span className="text-ink-300 font-semibold">Alamat</span>
                <span className="font-semibold text-ink text-right max-w-[65%]">
                  {ticketResult.address}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/6282140000477?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <MessageSquare size={18} />
                Hubungi Tim Admisi JACOS
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-cloud hover:bg-slate-100 text-ink font-semibold text-xs transition-all border border-ink/10"
              >
                <Printer size={15} />
                Cetak / Simpan Bukti Kunjungan
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketResult(null);
                  setCurrentStep(1);
                  setFormData({
                    parent_name: "",
                    whatsapp: "",
                    email: "",
                    address_detail: "",
                    visit_purpose: "school visit / school tour",
                    other_purpose: "",
                    child_name: "",
                    target_grade: "Kindergarten",
                    visit_date: currentDateTime.isoDate,
                    visit_time: currentDateTime.timeFormatted,
                    notes: "",
                  });
                }}
                className="w-full text-center text-xs text-ink-300 hover:text-sky font-semibold py-2 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                Isi Buku Tamu Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Brand & Welcome Header */}
      <div className="text-center space-y-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky px-4 py-1.5 rounded-full text-xs font-bold border border-sky-100 shadow-xs">
          <Sparkles size={14} className="text-gold" />
          Buku Tamu Digital JACOS
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
          Buku Tamu Kunjungan Sekolah
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 max-w-md mx-auto leading-relaxed">
          Ahlan wa Sahlan di Jakarta Cosmopolite Islamic School. Silakan lengkapi data kunjungan Anda di bawah ini.
        </p>

        {/* 0. Realtime Date & Time Indicator Bar */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-100 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-sky-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Realtime System</span>
          </div>
          <span className="text-ink/20">|</span>
          <div className="flex items-center gap-1 text-ink-400 font-medium">
            <Calendar size={13} className="text-sky" />
            <span className="font-semibold text-ink">{currentDateTime.dateFormatted || "Memuat tanggal..."}</span>
          </div>
          <span className="text-ink/20">|</span>
          <div className="flex items-center gap-1 text-ink-400 font-medium">
            <Clock size={13} className="text-gold-600" />
            <span className="font-mono font-bold text-ink">{currentDateTime.timeFormatted || "..."}</span>
          </div>
        </div>
      </div>

      {/* Stepper Header (Active if parent/student matters selected) */}
      {isParentStudentMatter && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-ink/5 shadow-xs mb-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all ${
                currentStep === 1
                  ? "bg-sky text-white font-bold shadow-sm"
                  : "bg-leaf-50 text-leaf font-bold"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  currentStep === 1 ? "bg-white/20 text-white" : "bg-leaf text-white"
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 size={14} /> : "1"}
              </div>
              <span className="text-xs tracking-tight truncate">Data Tamu & Keperluan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep(1)) setCurrentStep(2);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all ${
                currentStep === 2
                  ? "bg-sky text-white font-bold shadow-sm"
                  : "bg-cloud text-ink-300 font-semibold"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  currentStep === 2 ? "bg-white/20 text-white" : "bg-white text-ink-300 border border-ink/10"
                }`}
              >
                2
              </div>
              <span className="text-xs tracking-tight truncate">Data Siswa (Ananda)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleNextOrSubmit} className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden">
        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="m-5 p-3.5 bg-coral-50 border border-coral-200 rounded-2xl text-xs sm:text-sm text-coral-600 font-semibold flex items-start gap-2.5 animate-in fade-in">
            <HelpCircle size={18} className="shrink-0 mt-0.5 text-coral" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-5 sm:p-8 space-y-6">
          {/* STEP 1: DATA TAMU & TUJUAN KUNJUNGAN */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <User className="text-sky" size={20} />
                  1. Informasi Tamu Pengunjung
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Lengkapi identitas tamu untuk keperluan pencatatan resepsionis dan tindak lanjut.
                </p>
              </div>

              {/* 1. Fullname */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  1. Fullname (Nama Lengkap) <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rina Sasmita, S.Pd / Hendra Pratama"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 2. Phone Number / WA */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  2. Phone Number / WhatsApp <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 3. Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  3. Email Address <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: rina.sasmita@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-ink-300">
                  Bukti tiket kunjungan digital akan otomatis dikirimkan ke alamat email ini.
                </p>
              </div>

              {/* 5. Address */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  4. Address (Alamat Tempat Tinggal / Instansi) <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-ink-300" size={17} />
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Jl. Kelapa Sawit Raya No. 12, Duren Sawit, Jakarta Timur"
                    value={formData.address_detail}
                    onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 6. Purpose of Visit */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  5. Purpose of Visit (Tujuan Kunjungan) <span className="text-coral">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PURPOSE_OPTIONS.map((opt) => {
                    const isSelected = formData.visit_purpose === opt.value;
                    const Icon = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, visit_purpose: opt.value })}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-left flex items-start justify-between gap-3 ${
                          isSelected
                            ? opt.borderActive
                            : "border-ink/10 bg-cloud hover:bg-white hover:border-ink/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? "bg-white text-sky shadow-xs" : "bg-white text-ink-300 border border-ink/10"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className={`text-xs sm:text-sm font-bold ${isSelected ? "text-ink font-black" : "text-ink"}`}>
                              {opt.label}
                            </p>
                            <p className="text-[11px] text-ink-300 mt-0.5 leading-tight">
                              {opt.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                            isSelected ? "border-sky bg-sky text-white" : "border-ink/20 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Khusus jika memilih Others... */}
                {formData.visit_purpose === "Others..." && (
                  <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-amber-900">
                      Sebutkan Keperluan Kunjungan Anda <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pengiriman dokumen akreditasi / audiensi yayasan..."
                      value={formData.other_purpose || ""}
                      onChange={(e) => setFormData({ ...formData, other_purpose: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-xs sm:text-sm text-ink outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: DATA SISWA (Conditional for parent/student matters) */}
          {currentStep === 2 && isParentStudentMatter && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-50 border border-coral-100 text-coral-600 text-xs font-bold mb-2">
                  <Baby size={14} />
                  Parent / Student Matters Details
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  2. Informasi Siswa (Ananda)
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Silakan masukkan nama siswa dan jenjang pendidikan ananda yang bersangkutan.
                </p>
              </div>

              {/* 1. Student Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  1. Student Full Name (Nama Lengkap Siswa) <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <Baby className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Arkan Malik"
                    value={formData.child_name || ""}
                    onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 2. Student Grade Selection */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  2. Student Grade (Jenjang Pendidikan Siswa) <span className="text-coral">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STUDENT_GRADES.map((grade) => {
                    const isSelected = formData.target_grade === grade.value;

                    return (
                      <div
                        key={grade.id}
                        onClick={() => setFormData({ ...formData, target_grade: grade.value })}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? "border-sky bg-sky-50/80 shadow-xs ring-2 ring-sky-200"
                            : "border-ink/10 bg-cloud hover:bg-white hover:border-ink/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isSelected ? "bg-sky text-white" : "bg-white border border-ink/10 text-ink-300"
                            }`}
                          >
                            {grade.badge}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-sky bg-sky text-white" : "border-ink/20 bg-white"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div>
                          <p className={`text-sm font-bold ${isSelected ? "text-sky-700 font-black" : "text-ink"}`}>
                            {grade.label}
                          </p>
                          <p className="text-[11px] text-ink-300 mt-1">{grade.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Pill Preview */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 text-xs space-y-1.5 text-ink-400">
                <div className="font-bold text-sky flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  Ringkasan Kunjungan
                </div>
                <p>
                  Tamu: <strong className="text-ink">{formData.parent_name}</strong> ({formData.whatsapp})
                </p>
                <p>
                  Keperluan: <strong className="text-ink">{formData.visit_purpose}</strong> • Siswa: <strong className="text-ink">{formData.child_name || "-"}</strong> ({formData.target_grade})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-cloud/60 border-t border-ink/5 p-4 sm:p-6 flex items-center justify-between gap-3">
          {currentStep === 2 && isParentStudentMatter ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-3 rounded-2xl bg-white border border-ink/10 text-ink font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {currentStep === 1 && isParentStudentMatter ? (
            <button
              type="button"
              onClick={() => handleNextOrSubmit()}
              className="px-6 py-3 rounded-2xl bg-sky text-white font-bold text-xs sm:text-sm hover:bg-sky-600 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              Lanjut ke Data Siswa
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky to-sky-600 text-white font-bold text-xs sm:text-sm hover:from-sky-600 hover:to-sky-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim Buku Tamu
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-ink-300 space-y-1">
        <p>Jakarta Cosmopolite Islamic School (JACOS)</p>
        <p>Islamic • International • Trilingual Excellence</p>
      </div>
    </div>
  );
}
