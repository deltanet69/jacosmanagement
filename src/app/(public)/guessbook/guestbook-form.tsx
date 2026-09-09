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
  FileText,
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
  ChevronDown,
  Loader2,
  Share2,
  Printer,
  RefreshCw,
} from "lucide-react";
import {
  type WilayahItem,
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  DEFAULT_PROVINCES,
} from "@/lib/utils/wilayah";
import { submitGuestbookEntry, type GuestbookFormData, type GuestbookSubmissionResult } from "./actions";

const TARGET_GRADES = [
  { id: "toddler", label: "Toddler / Pre-School", sub: "Usia 1.5 - 3 Tahun", color: "from-amber-400 to-amber-500", badge: "Toddler" },
  { id: "tk-a", label: "Kindergarten A (TK A)", sub: "Usia 4 - 5 Tahun", color: "from-sky-400 to-sky-500", badge: "TK A" },
  { id: "tk-b", label: "Kindergarten B (TK B)", sub: "Usia 5 - 6 Tahun", color: "from-coral to-coral-600", badge: "TK B" },
  { id: "sd-1", label: "Primary Grade 1 (SD Kelas 1)", sub: "Usia 6 - 7 Tahun", color: "from-leaf to-leaf-600", badge: "SD 1" },
  { id: "sd-transfer", label: "Primary Grade 2-6 (Pindahan/Transfer)", sub: "Usia 7 - 12 Tahun", color: "from-indigo-500 to-indigo-600", badge: "Pindahan SD" },
  { id: "middle-school", label: "Middle School / SMP", sub: "Program Lanjutan", color: "from-purple-500 to-purple-600", badge: "SMP" },
];

const VISIT_PURPOSES = [
  "School Tour & Observasi Fasilitas",
  "Konsultasi Program Trilingual & Kurikulum",
  "Informasi Biaya Pendaftaran & Beasiswa",
  "Pendaftaran Siswa Baru (On Spot)",
  "Trial Class / Observasi Kelas",
  "Lainnya",
];

const SOURCE_INFOS = [
  "Instagram JACOS (@jacos.school)",
  "Rekomendasi Teman / Keluarga",
  "Pencarian Google / Website",
  "Spanduk / Banner di Sekitar Lokasi",
  "Pameran Pendidikan / Mall Event",
  "Alumni / Orang Tua Siswa JACOS",
  "Lainnya",
];

export default function GuestbookForm() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<GuestbookSubmissionResult["ticket"] | null>(null);

  // Form State
  const [formData, setFormData] = useState<GuestbookFormData>({
    parent_name: "",
    whatsapp: "",
    email: "",
    province_id: "",
    province_name: "",
    regency_id: "",
    regency_name: "",
    district_id: "",
    district_name: "",
    village_id: "",
    village_name: "",
    postal_code: "",
    address_detail: "",
    child_name: "",
    child_age: undefined,
    target_grade: "Kindergarten A (TK A)",
    visit_date: new Date().toISOString().split("T")[0],
    visit_time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    visit_purpose: "School Tour & Observasi Fasilitas",
    source_info: "Instagram JACOS (@jacos.school)",
    notes: "",
  });

  // Region Lists
  const [provinces, setProvinces] = useState<WilayahItem[]>(DEFAULT_PROVINCES);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [loadingWilayah, setLoadingWilayah] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProvinces() {
      const data = await fetchProvinces();
      if (isMounted && data.length > 0) {
        setProvinces(data);
      }
    }
    loadProvinces();
    return () => { isMounted = false; };
  }, []);

  // Cascading: Province -> Regencies
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const selectedProv = provinces.find((p) => p.id === provId);
    
    setFormData((prev) => ({
      ...prev,
      province_id: provId,
      province_name: selectedProv ? selectedProv.name : "",
      regency_id: "",
      regency_name: "",
      district_id: "",
      district_name: "",
      village_id: "",
      village_name: "",
    }));

    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    if (provId) {
      setLoadingWilayah(true);
      const data = await fetchRegencies(provId);
      setRegencies(data);
      setLoadingWilayah(false);
    }
  };

  // Cascading: Regency -> Districts
  const handleRegencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    const selectedReg = regencies.find((r) => r.id === regId);

    setFormData((prev) => ({
      ...prev,
      regency_id: regId,
      regency_name: selectedReg ? selectedReg.name : "",
      district_id: "",
      district_name: "",
      village_id: "",
      village_name: "",
    }));

    setDistricts([]);
    setVillages([]);

    if (regId) {
      setLoadingWilayah(true);
      const data = await fetchDistricts(regId);
      setDistricts(data);
      setLoadingWilayah(false);
    }
  };

  // Cascading: District -> Villages
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    const selectedDist = districts.find((d) => d.id === distId);

    setFormData((prev) => ({
      ...prev,
      district_id: distId,
      district_name: selectedDist ? selectedDist.name : "",
      village_id: "",
      village_name: "",
    }));

    setVillages([]);

    if (distId) {
      setLoadingWilayah(true);
      const data = await fetchVillages(distId);
      setVillages(data);
      setLoadingWilayah(false);
    }
  };

  // Cascading: Village
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vilId = e.target.value;
    const selectedVil = villages.find((v) => v.id === vilId);
    setFormData((prev) => ({
      ...prev,
      village_id: vilId,
      village_name: selectedVil ? selectedVil.name : "",
    }));
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.parent_name.trim()) {
        setErrorMsg("Silakan isi nama lengkap Ayah/Bunda/Wali murid.");
        return false;
      }
      if (!formData.whatsapp.trim() || formData.whatsapp.length < 8) {
        setErrorMsg("Silakan isi nomor WhatsApp aktif minimal 8 digit.");
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        setErrorMsg("Silakan isi format alamat email yang valid.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.address_detail.trim() || formData.address_detail.length < 3) {
        setErrorMsg("Silakan isi detail alamat tempat tinggal (jalan / komplek / RT / RW).");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.child_name.trim()) {
        setErrorMsg("Silakan isi nama lengkap calon siswa (ananda).");
        return false;
      }
      if (!formData.target_grade) {
        setErrorMsg("Silakan pilih jenjang pendidikan yang diminati.");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await submitGuestbookEntry(formData);
      if (res.success && res.ticket) {
        setTicketResult(res.ticket);
      } else {
        setErrorMsg(res.message || "Gagal menyimpan data buku tamu. Silakan coba kembali.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi. Silakan periksa jaringan internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS PASS TICKET SCREEN
  if (ticketResult) {
    const waText = encodeURIComponent(
      `Assalamu'alaikum Admin Admisi JACOS, saya *${ticketResult.parentName}* (Orang Tua dari *${ticketResult.childName}*, Kode Kunjungan: *${ticketResult.visitCode}*). Kami baru saja mengisi Buku Tamu kunjungan kampus JACOS untuk jenjang *${ticketResult.targetGrade}*. Mohon informasi booklet dan pendaftaran lebih lanjut. Terima kasih!`
    );

    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          {/* Header Pass */}
          <div className="relative bg-gradient-to-br from-sky to-sky-700 text-white p-6 sm:p-8 text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-gold/20 rounded-full blur-xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-gold-100 text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles size={14} className="text-gold" />
              Buku Tamu Kunjungan JACOS
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Datang di JACOS!
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Alhamdulillah, data kunjungan Ayah & Bunda telah berhasil tersimpan dalam buku tamu digital kami.
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
                <strong className="text-ink font-bold">Terima kasih, Ayah/Bunda {ticketResult.parentName}!</strong>
                <br />
                Senang sekali dapat menyambut kehadiran keluarga tercinta di lingkungan Islamic Trilingual School JACOS.
              </div>
            </div>

            {/* Detail Grid */}
            <div className="bg-cloud rounded-2xl p-4 sm:p-5 border border-ink/5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Calon Siswa</span>
                <span className="font-bold text-ink">
                  {ticketResult.childName} {ticketResult.childAge ? `(${ticketResult.childAge} Thn)` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Minat Jenjang</span>
                <span className="font-bold text-sky">{ticketResult.targetGrade}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">Waktu Kunjungan</span>
                <span className="font-bold text-gold-600">
                  {ticketResult.visitDate} • {ticketResult.visitTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-ink/5">
                <span className="text-ink-300 font-semibold">No. WhatsApp</span>
                <span className="font-bold text-ink">{ticketResult.whatsapp}</span>
              </div>
              <div className="flex justify-between items-start py-1.5">
                <span className="text-ink-300 font-semibold">Alamat Domisili</span>
                <span className="font-semibold text-ink text-right max-w-[65%]">
                  {ticketResult.addressSimple}
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
                Hubungi Tim Admisi via WhatsApp
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-cloud hover:bg-slate-100 text-ink font-semibold text-xs transition-all border border-ink/10"
              >
                <Printer size={15} />
                Simpan / Cetak Bukti Kunjungan
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
                    province_id: "",
                    province_name: "",
                    regency_id: "",
                    regency_name: "",
                    district_id: "",
                    district_name: "",
                    village_id: "",
                    village_name: "",
                    postal_code: "",
                    address_detail: "",
                    child_name: "",
                    child_age: undefined,
                    target_grade: "Kindergarten A (TK A)",
                    visit_date: new Date().toISOString().split("T")[0],
                    visit_time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
                    visit_purpose: "School Tour & Observasi Fasilitas",
                    source_info: "Instagram JACOS (@jacos.school)",
                    notes: "",
                  });
                }}
                className="w-full text-center text-xs text-ink-300 hover:text-sky font-semibold py-2 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                Isi Buku Tamu untuk Calon Siswa Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Brand & Welcome Header */}
      <div className="text-center space-y-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky px-4 py-1.5 rounded-full text-xs font-bold border border-sky-100 shadow-xs">
          <Sparkles size={14} className="text-gold" />
          Buku Tamu Kunjungan Sekolah
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
          Buku Tamu Calon Siswa JACOS
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 max-w-md mx-auto leading-relaxed">
          Ahlan wa Sahlan di Jakarta Cosmopolite Islamic School. Silakan lengkapi data kunjungan Ayah & Bunda untuk kemudahan informasi dan tindak lanjut.
        </p>
      </div>

      {/* Modern Stepper Header */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-ink/5 shadow-xs mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: "Orang Tua", icon: User },
            { step: 2, label: "Alamat", icon: MapPin },
            { step: 3, label: "Ananda", icon: Baby },
            { step: 4, label: "Kunjungan", icon: Compass },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;
            const Icon = item.icon;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep || validateStep(currentStep)) {
                    setCurrentStep(item.step);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-sky text-white font-bold shadow-sm"
                    : isDone
                    ? "bg-leaf-50 text-leaf font-bold"
                    : "bg-cloud text-ink-300 font-semibold"
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isDone
                      ? "bg-leaf text-white"
                      : "bg-white text-ink-300 border border-ink/10"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <span className="text-[11px] sm:text-xs tracking-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden">
        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="m-5 p-3.5 bg-coral-50 border border-coral-200 rounded-2xl text-xs sm:text-sm text-coral-600 font-semibold flex items-start gap-2.5 animate-in fade-in">
            <HelpCircle size={18} className="shrink-0 mt-0.5 text-coral" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-5 sm:p-8 space-y-6">
          {/* STEP 1: DATA ORANG TUA */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <User className="text-sky" size={20} />
                  1. Data Orang Tua / Wali Murid
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Informasi kontak untuk komunikasi jadwal visit, booklet biaya, dan pendaftaran.
                </p>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Nama Lengkap Ayah / Bunda / Wali <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bunda Rina Sasmita, S.Pd"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* No WhatsApp */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Nomor WhatsApp Aktif <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 0812-3456-7890"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-ink-300">
                  Digunakan staf admisi untuk mengirim informasi tindak lanjut via WhatsApp.
                </p>
              </div>

              {/* Alamat Email */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Alamat Email Aktif <span className="text-coral">*</span>
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
                  Ringkasan kunjungan dan e-brochure JACOS akan otomatis dikirim ke email ini.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: ALAMAT LENGKAP */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <MapPin className="text-coral" size={20} />
                  2. Alamat Lengkap Domisili
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Pilih wilayah tempat tinggal untuk pemetaan zonasi dan jemputan siswa.
                </p>
              </div>

              {/* Provinsi & Kabupaten / Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provinsi */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Provinsi</label>
                  <div className="relative">
                    <select
                      value={formData.province_id || ""}
                      onChange={handleProvinceChange}
                      className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all pr-8"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Kabupaten / Kota */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Kabupaten / Kota</label>
                  <div className="relative">
                    <select
                      disabled={!formData.province_id || loadingWilayah}
                      value={formData.regency_id || ""}
                      onChange={handleRegencyChange}
                      className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all disabled:opacity-50 pr-8"
                    >
                      <option value="">-- Pilih Kab / Kota --</option>
                      {regencies.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          {reg.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Kecamatan & Kelurahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kecamatan */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Kecamatan</label>
                  <div className="relative">
                    <select
                      disabled={!formData.regency_id || loadingWilayah}
                      value={formData.district_id || ""}
                      onChange={handleDistrictChange}
                      className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all disabled:opacity-50 pr-8"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Kelurahan / Desa */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Kelurahan / Desa</label>
                  <div className="relative">
                    <select
                      disabled={!formData.district_id || loadingWilayah}
                      value={formData.village_id || ""}
                      onChange={handleVillageChange}
                      className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all disabled:opacity-50 pr-8"
                    >
                      <option value="">-- Pilih Kelurahan --</option>
                      {villages.map((vil) => (
                        <option key={vil.id} value={vil.id}>
                          {vil.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Kode Pos */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">Kode Pos</label>
                <input
                  type="text"
                  placeholder="Contoh: 13450"
                  value={formData.postal_code || ""}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                />
              </div>

              {/* Detail Alamat Jalan */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Detail Alamat Lengkap (Jalan / No. Rumah / Komplek / RT & RW) <span className="text-coral">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Jl. Pahlawan Revolusi No. 45, Komplek Perumahan Indah Blok B2 No. 8, RT 04 / RW 08"
                  value={formData.address_detail}
                  onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: DATA CALON SISWA */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <Baby className="text-leaf" size={20} />
                  3. Data Calon Siswa (Ananda)
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Informasi ananda dan jenjang pendidikan yang diminati di JACOS.
                </p>
              </div>

              {/* Nama Lengkap Anak */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Nama Lengkap Ananda <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <Baby className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Arkan Malik"
                    value={formData.child_name}
                    onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Usia Anak */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Usia Ananda Saat Ini (Tahun)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="18"
                    placeholder="Contoh: 5"
                    value={formData.child_age !== undefined && formData.child_age !== null ? formData.child_age : ""}
                    onChange={(e) => setFormData({ ...formData, child_age: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Pilihan Jenjang */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Tujuan Jenjang Pendidikan <span className="text-coral">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TARGET_GRADES.map((item) => {
                    const isSelected = formData.target_grade === item.label;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setFormData({ ...formData, target_grade: item.label })}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-left flex items-start justify-between ${
                          isSelected
                            ? "border-sky bg-sky-50 shadow-xs ring-2 ring-sky-200"
                            : "border-ink/10 bg-cloud hover:bg-white hover:border-ink/20"
                        }`}
                      >
                        <div>
                          <p className={`text-xs sm:text-sm font-bold ${isSelected ? "text-sky-700" : "text-ink"}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-ink-300 mt-0.5">{item.sub}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-sky bg-sky text-white" : "border-ink/20 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DETAIL KUNJUNGAN & CATATAN */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-ink/5 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <Compass className="text-gold-600" size={20} />
                  4. Detail Kunjungan & Info Tambahan
                </h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Lengkapi preferensi dan tujuan kunjungan Ayah & Bunda hari ini.
                </p>
              </div>

              {/* Hari & Waktu Kunjungan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Tanggal Kunjungan</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                    <input
                      type="date"
                      value={formData.visit_date || ""}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-ink">Waktu Kunjungan</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
                    <input
                      type="text"
                      placeholder="Contoh: 10:00 WIB"
                      value={formData.visit_time || ""}
                      onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Tujuan Kunjungan */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">Tujuan Utama Kunjungan</label>
                <div className="relative">
                  <select
                    value={formData.visit_purpose || ""}
                    onChange={(e) => setFormData({ ...formData, visit_purpose: e.target.value })}
                    className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all pr-8"
                  >
                    {VISIT_PURPOSES.map((purpose, idx) => (
                      <option key={idx} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Sumber Info */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">Mengetahui JACOS Dari</label>
                <div className="relative">
                  <select
                    value={formData.source_info || ""}
                    onChange={(e) => setFormData({ ...formData, source_info: e.target.value })}
                    className="w-full appearance-none px-3.5 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all pr-8"
                  >
                    {SOURCE_INFOS.map((src, idx) => (
                      <option key={idx} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Catatan / Pertanyaan Tambahan */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-ink">
                  Catatan Khusus / Pertanyaan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Ingin berkonsultasi mengenai program hafalan Al-Qur'an dan program ekstrakurikuler robotics..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition-all"
                />
              </div>

              {/* Review Ringkas Box */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 text-xs space-y-1.5 text-ink-400">
                <div className="font-bold text-sky flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  Konfirmasi Data Kunjungan
                </div>
                <p>
                  Tamu: <strong className="text-ink">{formData.parent_name}</strong> • Calon Siswa: <strong className="text-ink">{formData.child_name}</strong> ({formData.target_grade})
                </p>
                <p>
                  Kontak: {formData.whatsapp} • {formData.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-cloud/60 border-t border-ink/5 p-4 sm:p-6 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
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

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 rounded-2xl bg-sky text-white font-bold text-xs sm:text-sm hover:bg-sky-600 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              Lanjutkan
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
