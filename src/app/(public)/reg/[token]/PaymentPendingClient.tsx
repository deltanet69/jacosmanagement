"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Phone,
  ArrowLeft,
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { uploadPaymentProofByToken } from "./actions";

interface PaymentPendingClientProps {
  token: string;
  applicant: {
    id: string;
    registration_no: string;
    student_name: string;
    program: string;
    gender: string;
    payment_status: string;
    payment_amount?: number;
    payment_method?: string;
    rejection_reason?: string | null;
    doc_payment_proof?: string | null;
    guardians?: any[];
    proofSignedUrl?: string | null;
  };
}

export default function PaymentPendingClient({
  token,
  applicant,
}: PaymentPendingClientProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guardians = applicant.guardians || [];
  const primaryGuardian = guardians[0];
  const parentName = primaryGuardian?.full_name || "Bapak/Ibu Orang Tua";

  const programLabel: Record<string, string> = {
    PRESCHOOL: "Preschool (PG / TK A)",
    KINDERGARTEN: "Kindergarten (TK B)",
    PRIMARY_SCHOOL: "Primary School (SD)",
    Primary: "Primary School (SD)",
    Preschool: "Preschool (PG / TK A)",
    Kindergarten: "Kindergarten (TK B)",
  };

  const formattedProgram = programLabel[applicant.program] || applicant.program;
  const amountToPay = applicant.payment_amount || 1000000;
  const formattedAmount = amountToPay.toLocaleString("id-ID");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran file maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran file maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText("1928374650");
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(amountToPay.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Harap pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("paymentProof", selectedFile);

    const res = await uploadPaymentProofByToken(token, formData);
    setIsUploading(false);

    if (res.success) {
      setUploadSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrorMessage(res.message || "Gagal mengunggah bukti pembayaran.");
    }
  };

  const hasExistingProof = !!(applicant.doc_payment_proof || applicant.proofSignedUrl);
  const isRejected = applicant.payment_status === "REJECTED";

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-slate-900 py-10 px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-700 tracking-wide uppercase">
              JACOS Online Admission Portal
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Konfirmasi Pembayaran Pendaftaran
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
            Selesaikan pembayaran formulir untuk membuka akses formulir pendaftaran lengkap ananda di Jakarta Cosmopolite Islamic School.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* APPLICANT CARD SUMMARY */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-7 shadow-xl shadow-slate-900/5 border border-slate-200/80 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-display font-black text-xl shadow-md shadow-sky-500/20 shrink-0">
                {applicant.student_name ? applicant.student_name.substring(0, 2).toUpperCase() : "CS"}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Calon Peserta Didik
                </span>
                <h2 className="font-display text-lg sm:text-xl font-black text-slate-900">
                  {applicant.student_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                    {formattedProgram}
                  </span>
                  <span className="text-xs text-slate-500">
                    Wali: <strong className="text-slate-700">{parentName}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                No. Registrasi
              </span>
              <p className="font-mono text-sm sm:text-base font-black text-sky-600">
                {applicant.registration_no}
              </p>
            </div>
          </div>

          {/* Status Alert Area */}
          <div className="pt-5">
            {uploadSuccess ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 animate-in fade-in duration-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-900">
                    Bukti Pembayaran Berhasil Diunggah!
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                    Terima kasih. Berkas bukti transfer Anda telah diterima oleh sistem dan sedang diverifikasi oleh Tim Admisi JACOS (1x24 jam). Setelah disetujui, Anda akan mendapatkan notifikasi WhatsApp/Email dan formulir pendaftaran lengkap akan otomatis dapat diisi.
                  </p>
                </div>
              </div>
            ) : isRejected ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3.5">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-rose-900">
                    Bukti Pembayaran Perlu Diperbaiki
                  </p>
                  <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                    {applicant.rejection_reason || "Bukti transfer belum dapat diverifikasi atau gambar kurang jelas. Silakan unggah kembali bukti transfer yang valid di bawah ini."}
                  </p>
                </div>
              </div>
            ) : hasExistingProof ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3.5">
                <div className="flex items-start gap-3.5">
                  <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-amber-900">
                      Bukti Transfer Sedang Diverifikasi
                    </p>
                    <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                      Bukti pembayaran Anda sudah tersimpan dan sedang dalam antrean verifikasi Admin Admission. Anda dapat mengunggah ulang jika terdapat kekeliruan berkas.
                    </p>
                  </div>
                </div>
                {applicant.proofSignedUrl && (
                  <a
                    href={applicant.proofSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    <span>Lihat Bukti</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-200 text-sky-950 flex items-start gap-3.5">
                <AlertCircle className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-sky-950">
                    Menunggu Pembayaran &amp; Unggah Bukti
                  </p>
                  <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
                    Silakan lakukan transfer biaya formulir pendaftaran sebesar <strong>Rp {formattedAmount}</strong> ke rekening resmi JACOS di bawah, lalu unggah foto/dokumen bukti transfer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAYMENT ACCOUNT CARD */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CreditCard size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Rekening Pembayaran Resmi
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Transfer Bank BNI (Online)
                  </h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-bold w-fit">
                <ShieldCheck size={14} /> Terverifikasi Yayasan
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Nomor Rekening */}
              <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Nomor Rekening Bank BNI
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-wider">
                    1928374650
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedBank ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedBank ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  a.n. <strong className="text-slate-200">Yayasan Jakarta Cosmopolite</strong>
                </p>
              </div>

              {/* Nominal Pembayaran */}
              <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Biaya Formulir
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl sm:text-2xl font-black text-white">
                    Rp {formattedAmount}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedAmount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedAmount ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sekali bayar untuk proses pendaftaran &amp; seleksi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* UPLOAD PROOF FORM */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-900/5 border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="text-sky-600" size={22} />
              {hasExistingProof ? "Unggah Ulang Bukti Transfer" : "Unggah Bukti Transfer"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Format yang didukung: JPG, PNG, WEBP, atau PDF (maksimal 10MB). Pastikan tanggal, nama pengirim, dan nominal terlihat jelas.
            </p>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-5">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-emerald-400 bg-emerald-50/40"
                  : "border-slate-300 hover:border-sky-500 hover:bg-sky-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-950 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview Bukti Transfer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-xs mx-auto">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti berkas
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti berkas
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 shadow-2xs">
                    <UploadCloud size={30} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800">
                      Pilih foto atau dokumen bukti transfer
                    </p>
                    <p className="text-xs text-slate-400">
                      Seret &amp; lepas file ke sini, atau <span className="text-sky-600 font-bold underline">klik untuk mencari file</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className={`w-full h-13 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                isUploading || !selectedFile
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/25 cursor-pointer"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengunggah Bukti Pembayaran...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Kirim Bukti Pembayaran Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER & HELP */}
        {/* ========================================================================= */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Phone size={16} className="text-emerald-600 shrink-0" />
            <span>
              Ada pertanyaan atau kendala transfer? Hubungi <strong>Admin Admisi JACOS</strong>
            </span>
          </div>

          <a
            href={`https://wa.me/6282140000477?text=${encodeURIComponent(
              `Halo Admin JACOS, saya orang tua dari ananda ${applicant.student_name} (${applicant.registration_no}) ingin menanyakan perihal pembayaran pendaftaran.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <span>Chat WhatsApp Admission</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
