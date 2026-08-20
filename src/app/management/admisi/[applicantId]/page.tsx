"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
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

  const guardian =
    data.guardians ? (Array.isArray(data.guardians) ? data.guardians[0] : data.guardians) : null;

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
    if (confirm("Apakah Anda yakin menolak pendaftar ini?")) {
      const res = await rejectApplicant(applicantId);
      if (res.success) {
        setData({ ...data, status: "REJECTED" });
      }
    }
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
          desc: "Aplikasi pendaftaran ditolak oleh Admin.",
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
    <div className="space-y-6 max-w-5xl mx-auto relative">
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
              {classes
                .filter((c) =>
                  data.program === "KINDERGARTEN"
                    ? c.level === "KINDERGARTEN"
                    : c.level === "PRIMARY_SCHOOL"
                )
                .map((c) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== MAIN INFO ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-cloud flex items-center justify-center font-display font-bold text-2xl text-sky border border-sky/10 shadow-sm">
                {data.student_name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {data.student_name}
                </h2>
                <span className="text-sm font-semibold bg-cloud px-3 py-1 rounded-full mt-1 inline-block text-ink-400">
                  {data.category === "TRANSFER_STUDENT"
                    ? "Pindahan"
                    : "Siswa Baru"}{" "}
                  •{" "}
                  {data.program === "KINDERGARTEN"
                    ? "Kindergarten"
                    : "Primary School"}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {/* Left: Calon Siswa */}
              <div>
                <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4 pb-2 border-b border-ink/5">
                  Data Calon Siswa
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">
                      Tempat, Tgl Lahir
                    </p>
                    <p className="font-bold">
                      {data.birth_place || "-"},{" "}
                      {formatDate(data.birth_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Jenis Kelamin</p>
                    <p className="font-bold">
                      {data.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  {data.nisn && (
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">NISN</p>
                      <p className="font-bold font-mono">{data.nisn}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">Alamat</p>
                    <p className="font-bold leading-relaxed">
                      {data.address || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-400 text-xs mb-0.5">
                      Tanggal Daftar
                    </p>
                    <p className="font-bold">{formatDate(data.submitted_at || data.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Right: Orang Tua / Wali */}
              <div>
                <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4 pb-2 border-b border-ink/5">
                  Data Orang Tua / Wali
                </h3>
                {guardian ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">
                        Nama ({relationLabel(guardian.relation)})
                      </p>
                      <p className="font-bold">{guardian.full_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">
                        Tempat, Tgl Lahir
                      </p>
                      <p className="font-bold">
                        {guardian.birth_place || "-"},{" "}
                        {formatDate(guardian.birth_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">Pekerjaan</p>
                      <p className="font-bold">{guardian.occupation || "-"}</p>
                    </div>
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">
                        Pendidikan Terakhir
                      </p>
                      <p className="font-bold">
                        {guardian.education_level || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">Alamat</p>
                      <p className="font-bold leading-relaxed">
                        {guardian.address || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-400 text-xs mb-0.5">Kontak</p>
                      <p className="font-bold">{guardian.phone || "-"}</p>
                      <p className="text-ink-400 text-xs mt-0.5">
                        {guardian.email || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink-300">
                    Data orang tua tidak tersedia.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Card */}
          {data.documents && data.documents.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5">
              <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">
                Dokumen Terunggah
              </h3>
              <div className="space-y-3">
                {data.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-cloud/50 border border-ink/5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-sky" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {doc.document_type || doc.file_name || "Dokumen"}
                      </p>
                      <p className="text-xs text-ink-300">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-sky hover:text-sky-700 shrink-0"
                      >
                        Lihat
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== SIDEBAR STATUS & ACTIONS ===== */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5">
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

            <div className="space-y-3">
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
                onClick={handleReject}
                variant="outline"
                className="w-full border-coral text-coral hover:bg-coral-50 hover:text-coral-600 font-bold h-12 rounded-xl shadow-sm"
                disabled={
                  data.status === "REJECTED" || data.status === "ENROLLED"
                }
              >
                Tolak Pendaftaran
              </Button>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5">
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
                <span className="text-ink-400">Program</span>
                <span className="font-bold">
                  {data.program === "KINDERGARTEN"
                    ? "Kindergarten"
                    : "Primary School"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Kategori</span>
                <span className="font-bold">
                  {data.category === "TRANSFER_STUDENT"
                    ? "Pindahan"
                    : "Siswa Baru"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Terdaftar</span>
                <span className="font-bold">{formatDate(data.submitted_at || data.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
