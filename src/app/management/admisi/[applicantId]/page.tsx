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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getApplicantDetail,
  getClasses,
  approveAndAssignClass,
  rejectApplicant,
} from "../actions";

export default function ApplicantDetail({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = use(params);
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const applicant = await getApplicantDetail(applicantId);
      const classData = await getClasses();
      setData(applicant);
      setClasses(classData);
      setIsLoading(false);
    }
    loadData();
  }, [applicantId]);

  if (isLoading)
    return (
      <div className="text-center py-20 text-ink-300 font-medium">
        Memuat data pendaftar...
      </div>
    );
  if (!data)
    return (
      <div className="text-center py-20 text-coral font-medium">
        Data pendaftar tidak ditemukan.
      </div>
    );

  const guardians = Array.isArray(data.guardians) ? data.guardians : [];

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

  const docLabel = (type: string) => {
    switch(type) {
      case "BIRTH_CERTIFICATE": return "Akta Kelahiran";
      case "FAMILY_CARD": return "Kartu Keluarga (KK)";
      case "PARENT_ID": return "KTP Orang Tua";
      case "PHOTO_4X3": return "Pas Foto 4x3";
      case "PHOTO_2X3": return "Pas Foto 2x3";
      case "IMMUNIZATION_CARD": return "Kartu Imunisasi";
      case "PREVIOUS_REPORT": return "Rapor Sekolah Asal";
      default: return "Dokumen Pendukung";
    }
  };

  const handleApprove = async () => {
    if (!selectedClass) {
      alert("Pilih kelas terlebih dahulu.");
      return;
    }
    setIsApproving(true);
    const res = await approveAndAssignClass(applicantId, selectedClass);
    setIsApproving(false);
    if (res.success) {
      setShowClassModal(false);
      setData({ ...data, status: "ENROLLED" });
      alert("Siswa berhasil diterima dan dimasukkan ke kelas!");
    } else {
      alert(res.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Harap isi alasan penolakan.");
      return;
    }
    const res = await rejectApplicant(applicantId, rejectReason);
    if (res.success) {
      setData({ ...data, status: "REJECTED", rejection_reason: rejectReason });
      setShowRejectModal(false);
    }
  };

  const handleCopyLink = () => {
    if (!data.registration_token) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jacosmanagement.vercel.app';
    const link = `${baseUrl}/reg/${data.registration_token}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWA = () => {
    if (!data.registration_token) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jacosmanagement.vercel.app';
    const link = `${baseUrl}/reg/${data.registration_token}`;
    const guardian = Array.isArray(data.guardians) ? data.guardians[0] : data.guardians;
    const parentName = guardian?.full_name || "Bapak/Ibu";
    const msg = encodeURIComponent(
      `Assalamu'alaikum ${parentName},\n\nBerikut adalah link formulir pendaftaran online untuk ananda *${data.student_name}* di JACOS:\n\n${link}\n\nSilakan isi formulir tersebut dengan lengkap dan teliti. Link ini hanya bisa diakses oleh Anda.\n\nTerima kasih,\nTim Admisi JACOS`
    );
    window.open(`https://wa.me/${(guardian?.phone || "").replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const statusConfig = () => {
    switch (data.status) {
      case "ENROLLED":
      case "ACCEPTED":
        return {
          bg: "bg-leaf-50",
          text: "text-leaf-600",
          icon: <CheckCircle2 size={18} className="shrink-0 mt-0.5" />,
          title: "Diterima / Terdaftar",
          desc: "Siswa telah dinyatakan lolos dan diterima ke dalam kelas.",
        };
      case "REJECTED":
        return {
          bg: "bg-coral-50",
          text: "text-coral-600",
          icon: <XCircle size={18} className="shrink-0 mt-0.5" />,
          title: "Ditolak",
          desc: data.rejection_reason || "Aplikasi pendaftaran ditolak oleh Admin.",
        };
      default:
        return {
          bg: "bg-gold-50",
          text: "text-gold-600",
          icon: <Clock size={18} className="shrink-0 mt-0.5" />,
          title: "Menunggu Review Admin",
          desc: "Mohon periksa dokumen sebelum memberikan keputusan.",
        };
    }
  };

  const status = statusConfig();

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Class Assignment Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-display text-2xl font-bold mb-2">
              Pilih Kelas
            </h3>
            <p className="text-ink-400 mb-6 text-sm">
              Assign siswa ini ke kelas yang sesuai sebelum menerima
              pendaftaran.
            </p>
            <select
              className="w-full h-12 px-4 rounded-xl border border-ink/10 mb-6 text-sm font-medium"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Tingkat {c.grade})
                  </option>
                ))}
            </select>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowClassModal(false)}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 rounded-xl bg-leaf hover:bg-leaf-600 text-white font-bold"
              >
                {isApproving ? "Memproses..." : "Konfirmasi Terima"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-display text-2xl font-bold mb-2">Alasan Penolakan</h3>
            <p className="text-ink-400 mb-6 text-sm">
              Alasan ini akan dikirimkan ke orang tua melalui email. Jelaskan dengan baik apa yang perlu dilakukan.
            </p>
            <textarea
              className="w-full h-32 px-4 py-3 rounded-xl border border-ink/10 mb-6 text-sm font-medium resize-none focus:outline-none focus:border-sky"
              placeholder="Contoh: Dokumen yang diunggah kurang jelas atau tidak lengkap. Mohon hubungi admin untuk informasi lebih lanjut."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-4">
              <Button
                onClick={() => setShowRejectModal(false)}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1 rounded-xl bg-coral hover:bg-coral-600 text-white font-bold"
              >
                Konfirmasi Tolak
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
            className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-sky transition-colors"
          >
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">
            Detail Pendaftaran
          </h1>
          <p className="text-ink-400 text-sm font-mono">{data.registration_no}</p>
        </div>
      </div>

      {/* Link Pendaftaran Unik */}
      {data.registration_token && (
        <div className="bg-white rounded-3xl border border-sky/20 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Share2 size={16} className="text-sky shrink-0" />
                <p className="text-xs font-bold text-sky uppercase tracking-wide">Link Formulir Pendaftaran</p>
                {data.form_submitted ? (
                  <span className="ml-2 inline-flex items-center gap-1 bg-leaf-50 text-leaf-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-leaf-100">
                    <CheckCircle2 size={10} /> Sudah Diisi
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center gap-1 bg-gold-50 text-gold-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gold-100">
                    <Clock size={10} /> Belum Diisi
                  </span>
                )}
              </div>
              <p className="font-mono text-sm text-ink truncate bg-cloud rounded-xl px-3 py-2 mt-1">
                {typeof window !== 'undefined' ? window.location.origin : 'https://jacosmanagement.vercel.app'}/reg/{data.registration_token}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="h-10 px-4 rounded-xl border-ink/15 font-bold text-sm"
              >
                <Copy size={15} className="mr-2" />
                {copied ? "Tersalin!" : "Salin"}
              </Button>
              <Button
                onClick={handleShareWA}
                className="h-10 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm"
              >
                <Share2 size={15} className="mr-2" /> Kirim ke WA
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ===== MAIN INFO ===== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Student Info Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-ink/5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-cloud flex items-center justify-center font-display font-bold text-2xl text-sky border border-sky/10 shadow-sm">
                {data.student_name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {data.student_name}
                </h2>
                <span className="text-sm font-semibold bg-cloud px-3 py-1 rounded-full mt-1 inline-block text-ink-400 capitalize">
                  {data.category === "TRANSFER_STUDENT"
                    ? "Pindahan"
                    : "Siswa Baru"}{" "}
                  •{" "}
                  {data.program.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {/* Left: Calon Siswa */}
              <div>
                <h3 className="text-xs font-bold text-sky uppercase tracking-wider mb-4">
                  Data Calon Siswa
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Nama Panggilan</p>
                    <p className="font-bold">{data.preferred_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Tempat, Tgl Lahir</p>
                    <p className="font-bold">
                      {data.birth_place || "-"}, {formatDate(data.birth_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Jenis Kelamin</p>
                    <p className="font-bold">
                      {data.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Anak Ke</p>
                    <p className="font-bold">{data.child_order || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">NIK / NISN</p>
                    <p className="font-bold font-mono text-xs">NIK: {data.nik || "-"}<br/>NISN: {data.nisn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Agama & Kewarganegaraan</p>
                    <p className="font-bold">{data.religion || "-"} — {data.nationality || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Bahasa Utama & Gol Darah</p>
                    <p className="font-bold">{data.primary_language || "-"} — Gol. {data.blood_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Asal Sekolah</p>
                    <p className="font-bold">{data.previous_school || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Alamat</p>
                    <p className="font-bold leading-relaxed">{data.address || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Right: Kesehatan & Kontak Darurat */}
              <div>
                <h3 className="text-xs font-bold text-coral uppercase tracking-wider mb-4">
                  Kesehatan & Kontak Darurat
                </h3>
                <div className="space-y-4 text-sm bg-coral-50/50 p-5 rounded-2xl border border-coral-100">
                  <div>
                    <p className="text-coral-600 text-xs mb-0.5 font-bold">Alergi / Kebutuhan Khusus</p>
                    <p className="font-semibold text-ink">{data.allergies_special_needs || "Tidak ada"}</p>
                  </div>
                  <div>
                    <p className="text-coral-600 text-xs mb-0.5 font-bold">Riwayat Penyakit</p>
                    <p className="font-semibold text-ink">{data.medical_history || "Tidak ada"}</p>
                  </div>
                  <div className="pt-2 border-t border-coral-100">
                    <p className="text-coral-600 text-xs mb-0.5 font-bold">Kontak Darurat</p>
                    <p className="font-semibold text-ink">{data.emergency_contact_name || "-"}</p>
                    <p className="text-xs text-ink-400">
                      Hubungan: {data.emergency_contact_relation || "-"}<br/>
                      No. HP: {data.emergency_contact_phone || "-"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-coral-100">
                    <p className="text-coral-600 text-xs mb-0.5 font-bold">Informasi Penjemputan</p>
                    <p className="font-semibold text-ink">{data.daily_transportation || "-"}</p>
                    <p className="text-xs text-ink-400">Authorized: {data.authorized_pickup_name || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parents Info Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
             <h3 className="text-xs font-bold text-sky uppercase tracking-wider mb-6 pb-2 border-b border-ink/5">
                Data Orang Tua / Wali
             </h3>
             <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {guardians.length > 0 ? (
                  guardians.map((g: any) => (
                    <div key={g.id} className="space-y-4 text-sm bg-cloud/30 p-5 rounded-2xl border border-ink/5">
                      <div className="mb-2">
                        <span className="text-xs font-bold text-sky bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {relationLabel(g.relation)}
                        </span>
                      </div>
                      <div>
                        <p className="text-ink-400 text-xs mb-0.5">Nama Lengkap</p>
                        <p className="font-bold">{g.full_name || "-"}</p>
                      </div>
                      {g.nik && (
                        <div>
                          <p className="text-ink-400 text-xs mb-0.5">NIK</p>
                          <p className="font-bold font-mono text-xs">{g.nik}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-ink-400 text-xs mb-0.5">Kontak</p>
                        <p className="font-bold">{g.phone || "-"}</p>
                        <p className="text-ink-400 text-xs mt-0.5">{g.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-ink-400 text-xs mb-0.5">Pekerjaan</p>
                        <p className="font-bold">{g.occupation || "-"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink-300 col-span-3">
                    Data orang tua tidak tersedia.
                  </p>
                )}
             </div>
          </div>

          {/* Documents Card */}
          {data.documents && data.documents.length > 0 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
              <h3 className="text-xs font-bold text-sky uppercase tracking-wider mb-6 pb-2 border-b border-ink/5">
                Dokumen Terunggah
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-cloud/50 border border-ink/5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky/10">
                      <FileText size={20} className="text-sky" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {docLabel(doc.type || doc.document_type)}
                      </p>
                      <p className="text-xs text-ink-300">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    {doc.signed_url || doc.file_url ? (
                      <a
                        href={doc.signed_url || doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-white bg-sky hover:bg-sky-600 px-4 py-2 rounded-lg shrink-0 transition"
                      >
                        Buka Dokumen
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== SIDEBAR STATUS & ACTIONS ===== */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5 sticky top-6">
            <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">
              Status Pendaftaran
            </h3>

            <div
              className={`${status.bg} ${status.text} p-4 rounded-2xl flex items-start gap-3 mb-6`}
            >
              {status.icon}
              <div>
                <p className="font-bold text-sm">{status.title}</p>
                <p className="text-xs mt-1 opacity-80">{status.desc}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-ink/5">
              <Button
                onClick={() => setShowClassModal(true)}
                className="w-full bg-leaf hover:bg-leaf-600 text-white font-bold h-12 rounded-xl shadow-sm"
                disabled={
                  data.status === "ENROLLED" || data.status === "ACCEPTED"
                }
              >
                Terima & Pilih Kelas
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                variant="outline"
                className="w-full border-coral text-coral hover:bg-coral-50 hover:text-coral-600 font-bold h-12 rounded-xl shadow-sm"
                disabled={
                  data.status === "REJECTED" || data.status === "ENROLLED"
                }
              >
                Tolak Pendaftaran
              </Button>
            </div>
            
            <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">
              Info Cepat
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">No. Registrasi</span>
                <span className="font-bold font-mono text-xs">
                  {data.registration_no}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Media Consent</span>
                <span className={`font-bold ${data.media_consent ? 'text-leaf-600' : 'text-coral-600'}`}>
                  {data.media_consent ? "Ya (Setuju)" : "Tidak"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Terdaftar</span>
                <span className="font-bold text-right max-w-[120px] leading-tight">{formatDate(data.submitted_at || data.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
