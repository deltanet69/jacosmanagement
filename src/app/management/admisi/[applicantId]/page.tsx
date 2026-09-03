"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Share2,
  FileText,
  KeyRound,
  ShieldCheck,
  Check,
  Send,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Calendar,
  AlertCircle,
  User,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getApplicantDetail,
  approveApplicantWithBatch,
  rejectApplicant,
  verifyDocumentAgreement,
  resetParentAccountPassword,
} from "../actions";
import {
  BATCH_CONFIG,
  BATCH_LIST,
  AdmissionBatchKey,
  getCurrentActiveBatch,
  getBatchInfo,
} from "@/lib/admission-config";

export default function ApplicantDetail({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = use(params);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approval Modal States (Batch Selection)
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<AdmissionBatchKey>("BATCH_1");
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [copied, setCopied] = useState(false);

  // States for Document Verification
  const [showDocRejectModal, setShowDocRejectModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docRejectNote, setDocRejectNote] = useState("");
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  // States for Parent Account Password Reset
  const [showResetModal, setShowResetModal] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{
    email: string;
    newPassword: string;
    guardianName: string;
    guardianPhone: string | null;
    studentName: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  useEffect(() => {
    async function loadData() {
      const applicant = await getApplicantDetail(applicantId);
      setData(applicant);

      // Pre-select batch berdasarkan tanggal saat ini
      const defaultActiveBatch = getCurrentActiveBatch();
      setSelectedBatch(defaultActiveBatch);

      setIsLoading(false);
    }
    loadData();
  }, [applicantId]);

  if (isLoading) {
    return (
      <div className="text-center py-24 text-ink-300 font-medium">
        <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat detail pendaftar...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-coral font-medium">
        Data pendaftar tidak ditemukan.
      </div>
    );
  }

  const guardians = Array.isArray(data.guardians) ? data.guardians : [];
  const primaryGuardian =
    guardians.find((g: any) => g?.email && g.email.includes("@")) || guardians[0];
  const targetParentEmail = primaryGuardian?.email || null;
  const targetParentPhone = primaryGuardian?.phone || null;
  const targetParentName = primaryGuardian?.full_name || "Orang Tua Siswa";

  const relationLabel = (rel: string) => {
    if (rel === "FATHER") return "Ayah";
    if (rel === "MOTHER") return "Ibu";
    return "Wali";
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Handle Approve with Batch Assignment
  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveApplicantWithBatch(applicantId, selectedBatch);
    setIsApproving(false);

    if (res.success) {
      setShowApprovalModal(false);
      setData({
        ...data,
        status: "ENROLLED",
        batch: selectedBatch,
        payment_note: data.payment_note
          ? `${data.payment_note} [${selectedBatch}]`
          : `[${selectedBatch}]`,
      });
      alert(`Pendaftaran berhasil disetujui dan dimasukkan ke ${res.batchInfo?.label || "Batch"}! Email notifikasi telah dikirim ke orang tua.`);
    } else {
      alert(res.message || "Gagal melakukan approval pendaftaran.");
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Harap isi keterangan alasan penolakan.");
      return;
    }
    setIsRejecting(true);
    const res = await rejectApplicant(applicantId, rejectReason);
    setIsRejecting(false);

    if (res.success) {
      setData({ ...data, status: "REJECTED", rejection_reason: rejectReason });
      setShowRejectModal(false);
      alert("Pendaftaran telah ditolak. Email notifikasi penjelasan telah dikirim ke orang tua.");
    } else {
      alert(res.message || "Gagal memproses penolakan.");
    }
  };

  // Handle Document Verification
  const handleVerifyDoc = async (_docId: string | null, status: string, note?: string) => {
    setIsVerifyingDoc(true);
    const res = await verifyDocumentAgreement("", applicantId, status, note);
    setIsVerifyingDoc(false);

    if (res.success) {
      const dbStatus = status === "APPROVED" ? "VERIFIED" : status;
      setData({
        ...data,
        doc_jacos_agreement_status: dbStatus,
        doc_jacos_agreement_note: note || null,
      });
      setShowDocRejectModal(false);
      setDocRejectNote("");
    } else {
      alert(res.message || "Gagal verifikasi dokumen.");
    }
  };

  // Copy & Share Unique Link
  const handleCopyLink = () => {
    if (!data.registration_token) return;
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://jacosmanagement.vercel.app";
    const link = `${baseUrl}/reg/${data.registration_token}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWA = () => {
    if (!data.registration_token) return;
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://jacosmanagement.vercel.app";
    const link = `${baseUrl}/reg/${data.registration_token}`;
    const guardian = Array.isArray(data.guardians) ? data.guardians[0] : data.guardians;
    const parentName = guardian?.full_name || "Bapak/Ibu";
    const msg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh ${parentName},\n\nTerima kasih telah melakukan pembayaran biaya pendaftaran untuk ananda *${data.student_name}* di JACOS (Jakarta Cosmopolite Islamic School).\n\nBerikut link formulir pendaftaran online eksklusif Anda:\n👉 ${link}\n\nSilakan isi formulir dengan lengkap dan lampirkan dokumen yang diperlukan. Link ini hanya dapat diakses oleh Anda hingga proses verifikasi selesai.\n\nSalam hangat,\n*Tim Admisi JACOS*`
    );
    const phone = (guardian?.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  // Reset Password
  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    setResetError(null);
    try {
      const res = await resetParentAccountPassword(applicantId, customPassword || undefined);
      if (res.success && res.email && res.newPassword) {
        setResetResult({
          email: res.email,
          newPassword: res.newPassword,
          guardianName: res.guardianName || "Orang Tua",
          guardianPhone: res.guardianPhone || null,
          studentName: res.studentName || data.student_name || "Siswa",
        });
      } else {
        setResetError(res.message || "Gagal mereset password akun orang tua.");
      }
    } catch (err: any) {
      setResetError(err.message || "Terjadi kesalahan saat mereset password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyCreds = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleSendWA = (result: any) => {
    if (!result?.guardianPhone) {
      alert("Nomor WhatsApp orang tua tidak ditemukan.");
      return;
    }
    let phone = result.guardianPhone.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    }

    const message = `Halo Bapak/Ibu ${result.guardianName},\n\nBerikut informasi akses akun Portal Orang Tua JACOS untuk ananda *${result.studentName}*:\n\n🌐 *Portal Orang Tua:* https://parent.jacos.id (atau http://localhost:3000/parent-portal)\n📧 *Email:* ${result.email}\n🔑 *Password Baru:* ${result.newPassword}\n\nSilakan masuk ke portal untuk mengakses status pendaftaran, kegiatan sekolah, dan informasi lainnya.\n\nTerima kasih,\n*Admin JACOS (Jakarta Cosmopolite Islamic School)*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const statusConfig = () => {
    switch (data.status) {
      case "ENROLLED":
      case "ACCEPTED":
        return {
          bg: "bg-leaf-50",
          text: "text-leaf-600",
          border: "border-leaf-200",
          icon: <CheckCircle2 size={18} className="shrink-0 mt-0.5" />,
          title: "Diterima / Terdaftar",
          desc: "Siswa telah dinyatakan lolos dan masuk ke batch penerimaan.",
        };
      case "REJECTED":
        return {
          bg: "bg-coral-50",
          text: "text-coral-600",
          border: "border-coral-200",
          icon: <XCircle size={18} className="shrink-0 mt-0.5" />,
          title: "Ditolak",
          desc: data.rejection_reason || "Aplikasi pendaftaran ditolak oleh Admin.",
        };
      default:
        return {
          bg: "bg-gold-50",
          text: "text-gold-600",
          border: "border-gold-200",
          icon: <Clock size={18} className="shrink-0 mt-0.5" />,
          title: "Menunggu Review Admin",
          desc: "Mohon periksa isian data dan dokumen sebelum memberikan keputusan approval.",
        };
    }
  };

  const currentStatus = statusConfig();

  return (
    <div className="space-y-6 max-w-full mx-auto relative pb-16">
      {/* ========================================================================= */}
      {/* APPROVAL & BATCH SELECTION MODAL */}
      {/* ========================================================================= */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-ink/5 space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mb-4">
                <Layers size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold text-ink">
                Approval Pendaftaran Siswa
              </h3>
              <p className="text-ink-400 text-sm mt-1">
                Tentukan gelombang (Batch) penerimaan untuk ananda{" "}
                <strong className="text-ink">{data.student_name}</strong>.
              </p>
            </div>

            {/* Batch Options */}
            <div className="space-y-3">
              <Label className="block text-xs font-bold text-ink-300 uppercase tracking-wider">
                Pilih Gelombang (Batch Penerimaan)
              </Label>
              <div className="space-y-2.5">
                {BATCH_LIST.map((batch) => {
                  const isSelected = selectedBatch === batch.key;
                  return (
                    <div
                      key={batch.key}
                      onClick={() => setSelectedBatch(batch.key)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? `${batch.theme.bg} ${batch.theme.border} ring-2 ring-sky-500/20`
                          : "bg-white border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-ink">{batch.label} — {batch.subLabel}</p>
                          {getCurrentActiveBatch() === batch.key && (
                            <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">
                              Rekomendasi (Bulan Ini)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-400">
                          Periode: <strong>{batch.periodLabel}</strong> ({batch.description})
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "border-sky bg-sky text-white" : "border-ink/20"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notice Info */}
            <div className="bg-cloud/60 rounded-2xl p-4 border border-ink/5 flex items-start gap-3">
              <AlertCircle size={18} className="text-sky shrink-0 mt-0.5" />
              <p className="text-xs text-ink-400 leading-relaxed">
                Penempatan kelas (Classroom 1A/1B/1C) dilakukan sebelum tahun ajaran baru dimulai pada menu <strong>Batch Approval</strong>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 h-12 rounded-xl border-ink/15 font-bold text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 h-12 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-sm shadow-md"
              >
                {isApproving ? "Memproses..." : `Setujui ke ${getBatchInfo(selectedBatch).label}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION MODAL */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-ink/5 space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral flex items-center justify-center mb-4">
                <XCircle size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold text-ink">
                Tolak Pendaftaran
              </h3>
              <p className="text-ink-400 text-sm mt-1">
                Keterangan alasan ini akan dikirimkan ke email orang tua bersama dengan kontak bantuan admin.
              </p>
            </div>

            <div>
              <Label className="block text-sm font-bold mb-2">
                Alasan Penolakan / Catatan untuk Orang Tua <span className="text-coral">*</span>
              </Label>
              <textarea
                className="w-full h-32 px-4 py-3 rounded-2xl border border-ink/15 bg-white text-sm font-medium resize-none focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                placeholder="Contoh: Dokumen akta kelahiran buram/tidak terbaca. Silakan hubungi admin via WhatsApp untuk mengunggah ulang dokumen."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 h-12 rounded-xl border-ink/15 font-bold text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleReject}
                disabled={isRejecting}
                className="flex-1 h-12 rounded-xl bg-coral hover:bg-coral-600 text-white font-bold text-sm shadow-md"
              >
                {isRejecting ? "Memproses..." : "Konfirmasi Tolak"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/management/admisi">
          <Button
            variant="outline"
            className="w-11 h-11 p-0 rounded-2xl bg-white border-ink/10 text-ink-400 hover:text-sky transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Detail Pendaftaran Calon Siswa
          </h1>
          <p className="text-ink-400 text-sm font-mono mt-0.5">
            No. Registrasi: <strong className="text-ink">{data.registration_no}</strong>
          </p>
        </div>
      </div>

      {/* Link Formulir Pendaftaran Unik (Private Token) */}
      {data.registration_token && (
        <div className="bg-white rounded-3xl border border-sky/20 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Share2 size={16} className="text-sky shrink-0" />
                <p className="text-xs font-bold text-sky uppercase tracking-wider">
                  Link Formulir Pendaftaran Private
                </p>
                {data.form_submitted ? (
                  <span className="ml-2 inline-flex items-center gap-1 bg-leaf-50 text-leaf-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-leaf-200">
                    <CheckCircle2 size={11} /> Sudah Diisi oleh Orang Tua
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center gap-1 bg-gold-50 text-gold-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-gold-200">
                    <Clock size={11} /> Menunggu Pengisian Form
                  </span>
                )}
              </div>
              <p className="font-mono text-sm text-ink truncate bg-cloud rounded-2xl px-4 py-2.5 mt-2 border border-ink/5">
                {typeof window !== "undefined" ? window.location.origin : "https://jacosmanagement.vercel.app"}
                /reg/{data.registration_token}
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0 pt-2 sm:pt-0">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="h-11 px-5 rounded-xl border-ink/15 font-bold text-sm shadow-sm"
              >
                <Copy size={15} className="mr-2" />
                {copied ? "Tersalin!" : "Salin Link"}
              </Button>
              <Button
                onClick={handleShareWA}
                className="h-11 px-5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-sm"
              >
                <Share2 size={15} className="mr-2" /> Share ke WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ===== MAIN INFO (3 Columns) ===== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-ink/5 space-y-8">
            <div className="flex items-center gap-5 pb-6 border-b border-ink/5">
              <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-sky-50 to-cloud flex items-center justify-center font-display font-black text-2xl text-sky border border-sky/15 shadow-sm">
                {data.student_name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                  {data.student_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-bold bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-100">
                    {data.program}
                  </span>
                  <span className="text-xs font-semibold bg-cloud text-ink-400 px-3 py-1 rounded-full">
                    {data.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru"}
                  </span>
                  {data.gender && (
                    <span className="text-xs font-semibold bg-cloud text-ink-400 px-3 py-1 rounded-full">
                      {data.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 text-sm">
              {/* Left Column: Data Siswa */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-sky uppercase tracking-wider pb-2 border-b border-ink/5">
                  Informasi Pribadi Calon Siswa
                </h3>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Nama Panggilan</p>
                  <p className="font-bold text-ink">{data.preferred_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Tempat, Tanggal Lahir</p>
                  <p className="font-bold text-ink">
                    {data.birth_place || "-"}, {formatDate(data.birth_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">NIK &amp; NISN</p>
                  <p className="font-bold font-mono text-ink">
                    NIK: {data.nik || "-"} • NISN: {data.nisn || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Agama &amp; Kewarganegaraan</p>
                  <p className="font-bold text-ink">
                    {data.religion || "-"} ({data.nationality || "WNI"})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Bahasa Utama di Rumah &amp; Gol. Darah</p>
                  <p className="font-bold text-ink">
                    {data.primary_language || "-"} • Gol. {data.blood_type || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Tinggi Badan &amp; Berat Badan</p>
                  <p className="font-bold text-ink">
                    TB: {data.height ? `${data.height} cm` : "-"} • BB: {data.weight ? `${data.weight} kg` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Anak Ke / Asal Sekolah</p>
                  <p className="font-bold text-ink">
                    Anak ke-{data.child_order || "-"} • {data.previous_school || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-400 mb-0.5 font-medium">Alamat Tempat Tinggal</p>
                  <p className="font-bold text-ink leading-relaxed">{data.address || "-"}</p>
                </div>
              </div>

              {/* Right Column: Kesehatan & Kontak Darurat */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-coral uppercase tracking-wider pb-2 border-b border-ink/5">
                  Kesehatan, Darurat &amp; Penjemputan
                </h3>
                <div className="bg-coral-50/50 p-5 rounded-2xl border border-coral-100 space-y-3.5">
                  <div>
                    <p className="text-xs font-bold text-coral-600 mb-0.5">Alergi / Kebutuhan Khusus</p>
                    <p className="font-semibold text-ink text-sm">
                      {data.allergies_special_needs || "Tidak ada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-coral-600 mb-0.5">Riwayat Medis / Penyakit</p>
                    <p className="font-semibold text-ink text-sm">
                      {data.medical_history || "Tidak ada"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-coral-100">
                    <p className="text-xs font-bold text-coral-600 mb-0.5">Kontak Darurat</p>
                    <p className="font-bold text-ink text-sm">{data.emergency_contact_name || "-"}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Hubungan: {data.emergency_contact_relation || "-"} • HP: {data.emergency_contact_phone || "-"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-coral-100">
                    <p className="text-xs font-bold text-coral-600 mb-0.5">Transportasi &amp; Pihak Penjemput</p>
                    <p className="font-bold text-ink text-sm">{data.daily_transportation || "-"}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Penjemput Berwenang: {data.authorized_pickup_name || "Tidak ada / Hanya Orang Tua"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parents Info Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-ink/5 space-y-6">
            <h3 className="text-xs font-black text-sky uppercase tracking-wider pb-2 border-b border-ink/5">
              Data Orang Tua / Wali Siswa
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {guardians.length > 0 ? (
                guardians.map((g: any) => (
                  <div key={g.id} className="p-5 rounded-2xl bg-cloud/40 border border-ink/5 space-y-3 text-sm">
                    <span className="inline-block text-xs font-black text-sky bg-sky-50 px-3 py-1 rounded-full uppercase tracking-wider border border-sky-100">
                      {relationLabel(g.relation)}
                    </span>
                    <div>
                      <p className="text-xs text-ink-400 font-medium mb-0.5">Nama Lengkap</p>
                      <p className="font-bold text-ink">{g.full_name || "-"}</p>
                    </div>
                    {g.nik && g.nik !== "-" && (
                      <div>
                        <p className="text-xs text-ink-400 font-medium mb-0.5">NIK</p>
                        <p className="font-mono font-bold text-ink text-xs">{g.nik}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-ink-400 font-medium mb-0.5">No. HP / WA</p>
                      <p className="font-bold text-ink">{g.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400 font-medium mb-0.5">Email</p>
                      <p className="font-bold text-ink break-all text-xs">{g.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400 font-medium mb-0.5">Pekerjaan</p>
                      <p className="font-bold text-ink">{g.occupation || "-"}</p>
                    </div>
                    {g.monthly_income && (
                      <div>
                        <p className="text-xs text-ink-400 font-medium mb-0.5">Penghasilan Bulanan</p>
                        <p className="font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg text-xs border border-sky-100/60 inline-block">
                          {g.monthly_income}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-300 col-span-3">Data orang tua belum tersedia.</p>
              )}
            </div>
          </div>

          {/* Uploaded Documents Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-ink/5 space-y-6">
            <h3 className="text-xs font-black text-sky uppercase tracking-wider pb-2 border-b border-ink/5">
              Dokumen &amp; Berkas Pendaftaran
            </h3>

            {/* General Documents Grid */}
            {(() => {
              const generalDocs = [
                { key: "doc_payment_proof", label: "Bukti Transfer Biaya Pendaftaran (Rp 1.000.000)" },
                { key: "doc_photo_4x3", label: "Pas Foto 3x4 / 4x3" },
                { key: "doc_birth_certificate", label: "Akta Kelahiran" },
                { key: "doc_family_card", label: "Kartu Keluarga (KK)" },
                { key: "doc_parent_id", label: "KTP Orang Tua" },
                { key: "doc_immunization_card", label: "Kartu Imunisasi" },
                { key: "doc_previous_report", label: "Rapor Sekolah Asal" },
              ];

              return (
                <div className="grid sm:grid-cols-2 gap-4">
                  {generalDocs.map(({ key, label }) => {
                    const filePath = (data as any)[key];
                    const signedUrl = (data as any)[`${key}_signed`];

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-2xl bg-cloud/40 border border-ink/5 hover:border-sky/20 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-ink-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-ink truncate">{label}</p>
                            {filePath ? (
                              <p className="text-xs text-leaf-600 font-semibold mt-0.5">✓ Terunggah</p>
                            ) : (
                              <p className="text-xs text-ink-300 mt-0.5">Belum diunggah</p>
                            )}
                          </div>
                        </div>

                        {signedUrl && (
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2 rounded-xl transition"
                          >
                            <ExternalLink size={13} /> Buka Berkas
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* JACOS Agreement Verification */}
            {data.doc_jacos_agreement && (
              <div className="pt-4 border-t border-ink/5 space-y-3">
                <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">Dokumen Agreement Orang Tua</p>
                <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-ink">Dokumen JACOS Agreement</p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        data.doc_jacos_agreement_status === "VERIFIED"
                          ? "bg-leaf-100 text-leaf-700"
                          : "bg-gold-100 text-gold-700"
                      }`}
                    >
                      {data.doc_jacos_agreement_status === "VERIFIED" ? "✓ Disetujui (Verified)" : "Menunggu Verifikasi"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {data.doc_jacos_agreement_status !== "VERIFIED" && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyDoc(null, "APPROVED")}
                        disabled={isVerifyingDoc}
                        className="h-9 px-4 bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs rounded-xl"
                      >
                        Approve Dokumen
                      </Button>
                    )}
                    {data.doc_jacos_agreement_signed && (
                      <a
                        href={data.doc_jacos_agreement_signed}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-4 inline-flex items-center text-xs font-bold text-sky bg-white border border-sky-200 hover:bg-sky-50 rounded-xl"
                      >
                        Lihat Agreement
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== SIDEBAR STATUS & ACTIONS (1 Column) ===== */}
        <div className="space-y-6">
          {/* Status Decision Card */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ink/5 space-y-5 sticky top-6">
            <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider">
              Status &amp; Keputusan Admisi
            </h3>

            <div className={`${currentStatus.bg} ${currentStatus.text} p-4 rounded-2xl border ${currentStatus.border} flex items-start gap-3`}>
              {currentStatus.icon}
              <div>
                <p className="font-bold text-sm">{currentStatus.title}</p>
                <p className="text-xs mt-0.5 opacity-85 leading-relaxed">{currentStatus.desc}</p>
              </div>
            </div>

            {/* Batch Info (if enrolled) */}
            {data.status === "ENROLLED" && (
              <div className="bg-leaf-50/60 rounded-2xl p-4 border border-leaf-200 space-y-1">
                <span className="text-[11px] font-bold text-leaf-700 uppercase tracking-wider">Gelombang Penerimaan</span>
                <p className="font-bold text-sm text-ink">
                  {getBatchInfo(data.batch).label} ({getBatchInfo(data.batch).periodLabel})
                </p>
              </div>
            )}

            {/* Approval & Rejection Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-ink/5">
              <Button
                onClick={() => setShowApprovalModal(true)}
                className="w-full bg-leaf-600 hover:bg-leaf-700 text-white font-bold h-12 rounded-2xl shadow-sm text-sm"
                disabled={data.status === "ENROLLED" || data.status === "ACCEPTED"}
              >
                <CheckCircle2 size={16} className="mr-2" />
                {data.status === "ENROLLED" ? "Sudah Diterima" : "Approve Pendaftaran"}
              </Button>

              <Button
                onClick={() => setShowRejectModal(true)}
                variant="outline"
                className="w-full border-coral text-coral hover:bg-coral-50 font-bold h-12 rounded-2xl text-sm"
                disabled={data.status === "REJECTED" || data.status === "ENROLLED"}
              >
                <XCircle size={16} className="mr-2" />
                Tolak Pendaftaran
              </Button>
            </div>

            {/* Quick Details */}
            <div className="pt-4 border-t border-ink/5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">Biaya Pendaftaran:</span>
                <span className="font-bold text-leaf-600">Rp 1.000.000 (Lunas)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Persetujuan Media:</span>
                <span className={`font-bold ${data.media_consent ? "text-leaf-600" : "text-coral-600"}`}>
                  {data.media_consent ? "Ya (Setuju)" : "Tidak"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Tanggal Registrasi:</span>
                <span className="font-bold text-ink">{formatDate(data.submitted_at || data.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Parent Account Access Card */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ink/5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <h4 className="font-bold text-sm text-ink">Akun Portal Orang Tua</h4>
            </div>

            <p className="text-xs text-ink-400 leading-relaxed">
              Email login: <strong className="text-ink">{targetParentEmail || "Belum ada email"}</strong>
            </p>

            <Button
              onClick={() => {
                setResetError(null);
                setResetResult(null);
                setShowResetModal(true);
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs font-bold border-ink/15 text-sky hover:bg-sky-50"
            >
              <KeyRound size={13} className="mr-1.5" /> Reset Password Orang Tua
            </Button>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-ink/5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-ink">Reset Password Akun</h3>
                <p className="text-xs text-ink-400">Portal Orang Tua JACOS</p>
              </div>
            </div>

            {!resetResult ? (
              <div className="space-y-4">
                <p className="text-xs text-ink-400">
                  Target Email: <strong className="text-ink">{targetParentEmail}</strong>
                </p>
                <div>
                  <Label className="block text-xs font-bold mb-1.5">Password Baru (Opsional)</Label>
                  <Input
                    value={customPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPassword(e.target.value)}
                    placeholder="Kosongkan untuk password otomatis"
                    className="h-11 rounded-xl text-xs"
                  />
                </div>
                {resetError && <p className="text-coral text-xs font-bold">{resetError}</p>}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowResetModal(false)} className="flex-1 rounded-xl text-xs font-bold">
                    Batal
                  </Button>
                  <Button onClick={handleResetPassword} disabled={isResettingPassword} className="flex-1 bg-sky hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                    {isResettingPassword ? "Memproses..." : "Generate Password"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-leaf-50 border border-leaf-200 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-leaf-700">✓ Password Berhasil Direset</p>
                  <p className="text-xs font-mono text-ink">Password Baru: <strong>{resetResult.newPassword}</strong></p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopyCreds(`Email: ${resetResult.email}\nPassword: ${resetResult.newPassword}`)}
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold"
                  >
                    {copiedCreds ? "Tersalin!" : "Salin Kredensial"}
                  </Button>
                  <Button
                    onClick={() => handleSendWA(resetResult)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold"
                  >
                    Kirim via WA
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setShowResetModal(false)} className="w-full text-xs font-bold">
                  Tutup
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
