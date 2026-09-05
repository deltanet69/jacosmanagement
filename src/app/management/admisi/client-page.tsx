"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Layers,
  Globe,
  GraduationCap,
  Sparkles,
  School,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Check,
  ChevronDown,
  Phone,
  ExternalLink,
  Eye,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getApplicants,
  getBatchApprovedStudents,
  getClasses,
  assignStudentToClass,
  getPublicAdmissionApplicants,
  getPaymentProofSignedUrl,
  approvePublicPayment,
  rejectPublicPayment,
} from "./actions";
import {
  BATCH_CONFIG,
  BATCH_LIST,
  AdmissionBatchKey,
  getCurrentActiveBatch,
  getBatchInfo,
} from "@/lib/admission-config";

type TabMode = "private" | "public" | "batch";

export default function AdmisiClient({
  initialApplicants = [],
  initialBatchStudents = [],
  initialClasses = [],
}: {
  initialApplicants?: any[];
  initialBatchStudents?: any[];
  initialClasses?: any[];
}) {
  const [activeTab, setActiveTab] = useState<TabMode>("private");
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);

  // Helper to derive public applicants without duplicate DB queries
  const derivePublicApplicants = (list: any[]) => {
    return list
      .filter(
        (item: any) =>
          item.status === "WAITING_REVIEW" ||
          (item.payment_note && item.payment_note.includes("[PUBLIC_ADMISSION]"))
      )
      .map((item: any) => {
        let proofPath = item.doc_payment_proof;
        if (!proofPath && item.payment_note?.includes("Bukti: ")) {
          proofPath = item.payment_note.split("Bukti: ")[1]?.trim();
        }

        return {
          ...item,
          has_payment_proof: !!proofPath,
          payment_proof_path: proofPath || null,
          doc_payment_proof_signed: null,
        };
      });
  };

  // Data States (Pre-populated from Server - 0ms Initial Delay)
  const [applicants, setApplicants] = useState<any[]>(initialApplicants);
  const [batchStudents, setBatchStudents] = useState<any[]>(initialBatchStudents);
  const [classes, setClasses] = useState<any[]>(initialClasses);
  const [publicApplicants, setPublicApplicants] = useState<any[]>(() =>
    derivePublicApplicants(initialApplicants)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Refresh helper for mutations
  const loadAllData = async () => {
    try {
      const [appsData, batchData, classData] = await Promise.all([
        getApplicants(),
        getBatchApprovedStudents(),
        getClasses(),
      ]);
      setApplicants(appsData || []);
      setBatchStudents(batchData || []);
      setClasses(classData || []);
      setPublicApplicants(derivePublicApplicants(appsData || []));
    } catch (err) {
      console.error("Error refreshing admisi data:", err);
    }
  };

  // Private Admission Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [privateCurrentPage, setPrivateCurrentPage] = useState(1);
  const [privatePageSize, setPrivatePageSize] = useState(10);

  // Public Admission Filters, Modals & Pagination
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [publicStatusFilter, setPublicStatusFilter] = useState<string>("ALL");
  const [publicCurrentPage, setPublicCurrentPage] = useState(1);
  const [publicPageSize, setPublicPageSize] = useState(10);
  const [proofModalApplicant, setProofModalApplicant] = useState<any | null>(null);
  const [isLoadingProofUrl, setIsLoadingProofUrl] = useState(false);
  const [rejectPaymentApplicant, setRejectPaymentApplicant] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [approvedSuccessData, setApprovedSuccessData] = useState<{
    applicant: any;
    uniqueLink: string;
    waPhone: string;
    waMessage: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Batch Approval Filters & Pagination
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("ALL");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED">("ALL");
  const [batchCurrentPage, setBatchCurrentPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(10);

  // Class Assignment Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Reset pagination on filter change
  useEffect(() => {
    setPrivateCurrentPage(1);
  }, [searchQuery, statusFilter, privatePageSize]);

  useEffect(() => {
    setPublicCurrentPage(1);
  }, [publicSearchQuery, publicStatusFilter, publicPageSize]);

  useEffect(() => {
    setBatchCurrentPage(1);
  }, [selectedBatchFilter, batchSearchQuery, classFilter, batchPageSize]);

  // Status Styling Helper
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return {
          color: "text-sky-600",
          bg: "bg-sky-50",
          border: "border-sky-200",
          icon: <CheckCircle2 size={14} className="text-sky-500" />,
          label: "Diverifikasi",
          gradient: "from-sky-500 to-sky-400",
        };
      case "ENROLLED":
      case "ACCEPTED":
        return {
          color: "text-leaf-600",
          bg: "bg-leaf-50",
          border: "border-leaf-200",
          icon: <CheckCircle2 size={14} className="text-leaf-500" />,
          label: "Diterima / Terdaftar",
          gradient: "from-leaf-500 to-leaf-400",
        };
      case "REJECTED":
        return {
          color: "text-coral-600",
          bg: "bg-coral-50",
          border: "border-coral-200",
          icon: <XCircle size={14} className="text-coral-500" />,
          label: "Ditolak",
          gradient: "from-coral-500 to-coral-400",
        };
      case "PAID":
        return {
          color: "text-sky-600",
          bg: "bg-sky-50",
          border: "border-sky-200",
          icon: <CheckCircle2 size={14} className="text-sky-500" />,
          label: "Sudah Bayar Form",
          gradient: "from-sky-500 to-sky-400",
        };
      case "WAITING_REVIEW":
      case "SUBMITTED":
      case "PENDING":
      default:
        return {
          color: "text-gold-600",
          bg: "bg-gold-50",
          border: "border-gold-200",
          icon: <Clock size={14} className="text-gold-500" />,
          label: "Menunggu Review",
          gradient: "from-gold to-gold-400",
        };
    }
  };

  const getProgramLabel = (prog: string) => {
    if (prog === "PRESCHOOL") return "Preschool (PG/TK A)";
    if (prog === "KINDERGARTEN") return "Kindergarten (TK B)";
    if (prog === "PRIMARY_SCHOOL") return "Primary School (SD)";
    return prog || "Primary School";
  };

  // Filtered Private Applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.registration_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.guardians?.some?.((g: any) =>
          g.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      let matchStatus = true;
      if (statusFilter === "WAITING") {
        matchStatus =
          app.status === "PENDING" ||
          app.status === "SUBMITTED" ||
          app.status === "WAITING_REVIEW";
      } else if (statusFilter === "ACCEPTED") {
        matchStatus =
          app.status === "ENROLLED" ||
          app.status === "ACCEPTED" ||
          app.status === "VERIFIED";
      } else if (statusFilter === "REJECTED") {
        matchStatus = app.status === "REJECTED";
      }

      return matchSearch && matchStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  // Paginated Private Applicants
  const paginatedApplicants = useMemo(() => {
    const from = (privateCurrentPage - 1) * privatePageSize;
    return filteredApplicants.slice(from, from + privatePageSize);
  }, [filteredApplicants, privateCurrentPage, privatePageSize]);

  const privateTotalPages = Math.max(1, Math.ceil(filteredApplicants.length / privatePageSize));

  // Filtered Batch Students
  const filteredBatchStudents = useMemo(() => {
    return batchStudents.filter((student) => {
      const matchBatch =
        selectedBatchFilter === "ALL" || student.batch === selectedBatchFilter;

      const matchSearch =
        batchSearchQuery.trim() === "" ||
        student.full_name?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
        student.registration_no?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
        student.guardian_name?.toLowerCase().includes(batchSearchQuery.toLowerCase());

      let matchClass = true;
      if (classFilter === "UNASSIGNED") {
        matchClass = !student.class_id;
      } else if (classFilter === "ASSIGNED") {
        matchClass = !!student.class_id;
      }

      return matchBatch && matchSearch && matchClass;
    });
  }, [batchStudents, selectedBatchFilter, batchSearchQuery, classFilter]);

  // Paginated Batch Students
  const paginatedBatchStudents = useMemo(() => {
    const from = (batchCurrentPage - 1) * batchPageSize;
    return filteredBatchStudents.slice(from, from + batchPageSize);
  }, [filteredBatchStudents, batchCurrentPage, batchPageSize]);

  const batchTotalPages = Math.max(1, Math.ceil(filteredBatchStudents.length / batchPageSize));

  // Batch stats summary
  const batchStats = useMemo(() => {
    const currentList =
      selectedBatchFilter === "ALL"
        ? batchStudents
        : batchStudents.filter((s) => s.batch === selectedBatchFilter);

    const total = currentList.length;
    const assigned = currentList.filter((s) => s.class_id).length;
    const unassigned = total - assigned;

    return { total, assigned, unassigned };
  }, [batchStudents, selectedBatchFilter]);

  // Filtered Public Applicants
  const filteredPublicApplicants = useMemo(() => {
    return publicApplicants.filter((app) => {
      const matchSearch =
        publicSearchQuery.trim() === "" ||
        app.student_name?.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
        app.registration_no?.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
        app.guardians?.some?.((g: any) =>
          g.full_name?.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
          g.phone?.includes(publicSearchQuery) ||
          g.email?.toLowerCase().includes(publicSearchQuery.toLowerCase())
        );

      let matchStatus = true;
      if (publicStatusFilter === "WAITING_PAYMENT") {
        matchStatus =
          app.payment_status === "PENDING_VERIFICATION" ||
          app.status === "WAITING_REVIEW";
      } else if (publicStatusFilter === "PAID") {
        matchStatus = app.payment_status === "PAID";
      } else if (publicStatusFilter === "REJECTED") {
        matchStatus = app.payment_status === "REJECTED" || app.status === "REJECTED";
      }

      return matchSearch && matchStatus;
    });
  }, [publicApplicants, publicSearchQuery, publicStatusFilter]);

  const paginatedPublicApplicants = useMemo(() => {
    const from = (publicCurrentPage - 1) * publicPageSize;
    return filteredPublicApplicants.slice(from, from + publicPageSize);
  }, [filteredPublicApplicants, publicCurrentPage, publicPageSize]);

  const publicTotalPages = Math.max(1, Math.ceil(filteredPublicApplicants.length / publicPageSize));

  const publicStats = useMemo(() => {
    const total = publicApplicants.length;
    const waitingPayment = publicApplicants.filter(
      (a) => a.payment_status === "PENDING_VERIFICATION" || a.status === "WAITING_REVIEW"
    ).length;
    const paid = publicApplicants.filter((a) => a.payment_status === "PAID").length;
    const rejected = publicApplicants.filter(
      (a) => a.payment_status === "REJECTED" || a.status === "REJECTED"
    ).length;
    return { total, waitingPayment, paid, rejected };
  }, [publicApplicants]);

  const handleApprovePayment = async (applicant: any) => {
    setIsProcessingPayment(true);
    const res = await approvePublicPayment(applicant.id);
    setIsProcessingPayment(false);

    if (res.success) {
      setPublicApplicants((prev) =>
        prev.map((a) =>
          a.id === applicant.id
            ? {
                ...a,
                payment_status: "PAID",
                status: a.form_submitted ? "WAITING_REVIEW" : "PENDING",
                registration_token: res.uniqueLink?.split("/reg/")[1] || a.registration_token,
              }
            : a
        )
      );
      if (proofModalApplicant?.id === applicant.id) {
        setProofModalApplicant(null);
      }
      setApprovedSuccessData({
        applicant,
        uniqueLink: res.uniqueLink || "",
        waPhone: res.waPhone || "",
        waMessage: res.waMessage || "",
      });
    } else {
      alert(res.message || "Gagal menyetujui pembayaran.");
    }
  };

  const handleOpenProofModal = async (applicant: any) => {
    setProofModalApplicant(applicant);
    if (!applicant.doc_payment_proof_signed) {
      setIsLoadingProofUrl(true);
      const proofPath = applicant.payment_proof_path || applicant.doc_payment_proof || applicant.id;
      const signedUrl = await getPaymentProofSignedUrl(proofPath);
      setIsLoadingProofUrl(false);
      setProofModalApplicant((prev: any) => prev ? { ...prev, doc_payment_proof_signed: signedUrl } : null);
    }
  };

  const handleOpenRejectPayment = (applicant: any) => {
    setRejectPaymentApplicant(applicant);
    setRejectReasonInput("");
    if (proofModalApplicant) setProofModalApplicant(null);
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectPaymentApplicant) return;
    if (!rejectReasonInput.trim()) {
      alert("Harap masukkan catatan alasan penolakan pembayaran.");
      return;
    }
    setIsProcessingPayment(true);
    const res = await rejectPublicPayment(rejectPaymentApplicant.id, rejectReasonInput);
    setIsProcessingPayment(false);

    if (res.success) {
      setPublicApplicants((prev) =>
        prev.map((a) =>
          a.id === rejectPaymentApplicant.id
            ? {
                ...a,
                payment_status: "REJECTED",
                status: "REJECTED",
                rejection_reason: rejectReasonInput,
              }
            : a
        )
      );
      setRejectPaymentApplicant(null);
      setRejectReasonInput("");
    } else {
      alert(res.message || "Gagal menolak pembayaran.");
    }
  };

  const handleOpenAssignModal = (student: any) => {
    setStudentToAssign(student);
    setSelectedClassId(student.class_id || "");
    setAssignModalOpen(true);
  };

  const handleSaveClassAssignment = async () => {
    if (!studentToAssign) return;
    setIsAssigning(true);
    const res = await assignStudentToClass(studentToAssign.id, selectedClassId || null);
    setIsAssigning(false);

    if (res.success) {
      setBatchStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentToAssign.id) {
            const foundClass = classes.find((c) => c.id === selectedClassId);
            return {
              ...s,
              class_id: selectedClassId || null,
              school_class: foundClass || null,
            };
          }
          return s;
        })
      );
      setAssignModalOpen(false);
      setStudentToAssign(null);
    } else {
      alert(res.message || "Gagal meng-assign kelas.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full">
      {/* Assign Classroom Modal */}
      {assignModalOpen && studentToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-ink/5 space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mb-3">
                <School size={22} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Penempatan Kelas Siswa
              </h3>
              <p className="text-ink-400 text-xs sm:text-sm mt-1">
                Pilih classroom untuk ananda{" "}
                <strong className="text-ink">{studentToAssign.full_name}</strong>{" "}
                sebelum tahun ajaran baru dimulai.
              </p>
            </div>

            <div className="bg-cloud/60 rounded-2xl p-3.5 border border-ink/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">No. Registrasi:</span>
                <span className="font-mono font-bold text-ink">{studentToAssign.registration_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Batch Penerimaan:</span>
                <span className="font-bold text-sky-600">{getBatchInfo(studentToAssign.batch).label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Jenjang:</span>
                <span className="font-bold text-ink">{studentToAssign.program}</span>
              </div>
            </div>

            <div>
              <Label className="block text-xs font-bold mb-1.5 text-ink">
                Pilih Kelas (Classroom)
              </Label>
              <select
                className="w-full h-11 px-3.5 rounded-xl border border-ink/15 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky/30 focus:border-sky outline-none"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Belum Ditentukan (Unassigned) --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Tingkat {c.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignModalOpen(false);
                  setStudentToAssign(null);
                }}
                className="flex-1 h-11 rounded-xl border-ink/15 font-bold text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveClassAssignment}
                disabled={isAssigning}
                className="flex-1 h-11 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                {isAssigning ? "Menyimpan..." : "Simpan Kelas"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal Viewer */}
      {proofModalApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-ink/10 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">Bukti Transfer Pendaftaran</h3>
                <p className="text-xs text-ink-400 mt-0.5 font-mono">
                  {proofModalApplicant.registration_no} • {proofModalApplicant.student_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProofModalApplicant(null)}
                className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-ink-400 hover:text-ink transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="bg-cloud/50 rounded-2xl p-4 border border-ink/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">Orang Tua / Kontak:</span>
                <span className="font-bold text-ink">
                  {proofModalApplicant.guardians?.[0]?.full_name || "-"} ({proofModalApplicant.guardians?.[0]?.phone || "-"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Nominal Transfer:</span>
                <span className="font-bold text-ink">Rp 1.000.000 ({proofModalApplicant.payment_method || "Transfer BNI"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Status Saat Ini:</span>
                <span className="font-bold text-gold-600 uppercase">
                  {proofModalApplicant.payment_status || "PENDING_VERIFICATION"}
                </span>
              </div>
            </div>

            {/* Proof Image / File Preview */}
            <div className="rounded-2xl border border-ink/10 overflow-hidden bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[420px] p-2">
              {isLoadingProofUrl ? (
                <div className="text-center p-8 space-y-3">
                  <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Memuat berkas bukti transfer...</p>
                </div>
              ) : proofModalApplicant.doc_payment_proof_signed ? (
                proofModalApplicant.doc_payment_proof_signed.includes(".pdf") ? (
                  <div className="text-center p-8 space-y-3">
                    <FileText className="w-12 h-12 text-sky mx-auto" />
                    <p className="text-sm font-bold text-white">Dokumen Bukti Transfer (PDF)</p>
                    <a
                      href={proofModalApplicant.doc_payment_proof_signed}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky text-white text-xs font-bold hover:bg-sky-600 transition"
                    >
                      Buka Dokumen PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={proofModalApplicant.doc_payment_proof_signed}
                    alt="Bukti Transfer"
                    className="max-h-[380px] w-auto object-contain rounded-xl"
                  />
                )
              ) : (
                <p className="text-xs text-slate-400">Berkas bukti transfer tidak dapat ditampilkan.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setProofModalApplicant(null)}
                className="h-11 px-4 rounded-xl border-ink/15 font-bold text-xs"
              >
                Tutup
              </Button>
              {proofModalApplicant.payment_status !== "PAID" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenRejectPayment(proofModalApplicant)}
                    disabled={isProcessingPayment}
                    className="h-11 px-4 rounded-xl border-coral-200 text-coral hover:bg-coral-50 font-bold text-xs"
                  >
                    Tolak Pembayaran
                  </Button>
                  <Button
                    onClick={() => handleApprovePayment(proofModalApplicant)}
                    disabled={isProcessingPayment}
                    className="h-11 px-5 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs shadow-md"
                  >
                    {isProcessingPayment ? "Memproses..." : "Approve Pembayaran & Kirim Link"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectPaymentApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-ink/10 space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-coral-50 text-coral flex items-center justify-center mb-3">
                <XCircle size={22} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Tolak Pembayaran Pendaftaran</h3>
              <p className="text-xs text-ink-400 mt-1">
                Berikan catatan alasan penolakan untuk pendaftar ananda{" "}
                <strong className="text-ink">{rejectPaymentApplicant.student_name}</strong>. Catatan ini akan dikirimkan langsung ke email orang tua.
              </p>
            </div>

            <div>
              <Label className="block text-xs font-bold mb-1.5 text-ink">
                Catatan / Alasan Penolakan <span className="text-coral">*</span>
              </Label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Contoh: Bukti transfer tidak jelas / nominal transfer tidak sesuai (Rp 1.000.000). Harap transfer ulang atau hubungi admin."
                className="w-full h-28 p-3.5 rounded-2xl border border-ink/15 bg-cloud/50 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none resize-none"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => setRejectPaymentApplicant(null)}
                className="flex-1 h-11 rounded-xl border-ink/15 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmRejectPayment}
                disabled={isProcessingPayment || !rejectReasonInput.trim()}
                className="flex-1 h-11 rounded-xl bg-coral hover:bg-coral-600 text-white font-bold text-xs shadow-md"
              >
                {isProcessingPayment ? "Memproses..." : "Kirim Penolakan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approved Success & WhatsApp Reminder Modal */}
      {approvedSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-ink/10 space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-leaf-50 text-leaf-600 mx-auto flex items-center justify-center border border-leaf-200 shadow-xs">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-ink">Pembayaran Berhasil Disetujui!</h3>
              <p className="text-xs text-ink-400">
                Email berisi link unik telah otomatis dikirim ke{" "}
                <strong className="text-ink">{approvedSuccessData.applicant.guardians?.[0]?.email || "email orang tua"}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cloud/60 border border-ink/5 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-400 font-bold uppercase tracking-wider">Link Unik Formulir</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(approvedSuccessData.uniqueLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky hover:underline"
                >
                  {copiedLink ? <Check size={12} className="text-leaf-600" /> : <Copy size={12} />}
                  {copiedLink ? "Tersalin!" : "Salin Link"}
                </button>
              </div>
              <p className="font-mono text-xs text-sky font-bold truncate bg-white p-2.5 rounded-xl border border-ink/10">
                {approvedSuccessData.uniqueLink}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {approvedSuccessData.waPhone && (
                <a
                  href={`https://wa.me/${approvedSuccessData.waPhone}?text=${encodeURIComponent(approvedSuccessData.waMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98]"
                >
                  <Phone size={15} />
                  Kirim Pengingat Link via WhatsApp
                </a>
              )}
              <Button
                variant="outline"
                onClick={() => setApprovedSuccessData(null)}
                className="w-full h-11 rounded-xl border-ink/15 font-bold text-xs"
              >
                Selesai / Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-cloud border border-sky-100 p-5 sm:p-7 lg:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-sky-200/40 to-sky-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-leaf-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/60 text-sky-700 text-[11px] font-bold tracking-wide uppercase mb-2.5 border border-sky-200/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Portal Admisi Siswa Baru
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
              Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky to-sky-600">Admission</span>
            </h1>
            <p className="text-ink-400 mt-1.5 text-xs sm:text-sm leading-relaxed">
              Kelola pendaftaran via link private, approval gelombang batch penerimaan, dan penempatan kelas siswa baru.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white shadow-md shadow-ink/5">
            <div className="flex items-center justify-between sm:justify-start gap-3 px-3 py-2 bg-cloud/60 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">Status Admisi</span>
                <Label htmlFor="admission-status-switch" className="font-bold cursor-pointer text-xs sm:text-sm">
                  {isAdmissionOpen ? (
                    <span className="text-leaf flex items-center gap-1"><CheckCircle2 size={13} /> Dibuka</span>
                  ) : (
                    <span className="text-coral flex items-center gap-1"><XCircle size={13} /> Ditutup</span>
                  )}
                </Label>
              </div>
              <div className="h-6 w-px bg-ink/10 mx-1" />
              <Switch
                id="admission-status-switch"
                checked={isAdmissionOpen}
                onCheckedChange={setIsAdmissionOpen}
                className="data-[state=checked]:bg-leaf scale-100"
              />
            </div>

            <Link href="/management/admisi/tambah" className="shrink-0">
              <Button className="w-full sm:w-auto h-11 px-5 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all text-xs sm:text-sm">
                <Plus size={16} className="mr-1.5" /> Pendaftaran Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RESPONSIVE SUB-SECTION TAB CONTROLS (NO OVERFLOW ON MOBILE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-white rounded-2xl border border-ink/10 shadow-2xs">
        <button
          onClick={() => setActiveTab("private")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "private"
              ? "bg-sky text-white shadow-md shadow-sky/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={15} />
            <span>1. Direct Admin</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "private" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
            }`}
          >
            {applicants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("public")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "public"
              ? "bg-sky-800 text-white shadow-md shadow-sky-900/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={15} />
            <span>2. Public Admission</span>
          </div>
          <div className="flex items-center gap-1.5">
            {publicStats.waitingPayment > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                {publicStats.waitingPayment} Perlu Cek
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "public" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
              }`}
            >
              {publicApplicants.length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("batch")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "batch"
              ? "bg-leaf-600 text-white shadow-md shadow-leaf/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} />
            <span>3. Batch Approval</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "batch" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
            }`}
          >
            {batchStudents.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECTION 1: PRIVATE ADMISSION (Halaman Utama Pendaftar) */}
      {/* ========================================================================= */}
      {activeTab === "private" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-ink-300 group-focus-within:text-sky transition-colors" />
              </div>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, no registrasi, atau orang tua..."
                className="pl-10 h-11 rounded-2xl bg-white border border-ink/10 shadow-2xs focus-visible:ring-2 focus-visible:ring-sky/30 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {[
                { id: "ALL", label: "Semua Status" },
                { id: "WAITING", label: "Menunggu Review" },
                { id: "ACCEPTED", label: "Diterima / Enrolled" },
                { id: "REJECTED", label: "Ditolak" },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`h-10 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap shadow-2xs transition-all ${
                    statusFilter === filter.id
                      ? "bg-ink text-white hover:bg-ink/90"
                      : "bg-white text-ink-400 hover:bg-sky-50 hover:text-sky border border-ink/5"
                  }`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="py-20 text-center text-ink-300 font-medium bg-white rounded-3xl border border-ink/5">
              <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat data pendaftar Online Admission...
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-ink/5 p-6 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-cloud text-ink-300 flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-ink">Tidak Ada Data Pendaftar</h3>
              <p className="text-ink-400 text-xs mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Tidak ada pendaftar yang sesuai dengan kriteria pencarian Anda."
                  : "Belum ada calon siswa yang didaftarkan. Klik tombol Pendaftaran Baru untuk membuat slot pendaftaran."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-3.5 rounded-xl text-xs font-bold"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* ========================================================= */}
              {/* 2A. MOBILE VIEW: COMPACT, CLEAN & INFORMATIVE CARDS */}
              {/* ========================================================= */}
              <div className="space-y-3 md:hidden">
                {paginatedApplicants.map((app) => {
                  const style = getStatusStyle(app.status);
                  const guardian = app.guardians
                    ? Array.isArray(app.guardians)
                      ? app.guardians[0]
                      : app.guardians
                    : null;
                  const parentName = guardian ? guardian.full_name : "-";
                  const avatar = app.student_name ? app.student_name.substring(0, 2).toUpperCase() : "CS";
                  const formattedDate = new Date(app.submitted_at || app.created_at || new Date()).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const paymentStatus = app.payment_status || "PAID";

                  return (
                    <Link
                      key={app.id}
                      href={`/management/admisi/${app.id}`}
                      className="block p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs hover:border-sky/40 transition-all space-y-3"
                    >
                      {/* Top Row: Avatar + Name + Reg No + Arrow */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center font-display font-black text-white text-xs shadow-sm`}
                          >
                            {avatar}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-ink truncate leading-tight">
                              {app.student_name}
                            </h4>
                            <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                              {app.registration_no || app.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>

                        <span className="w-7 h-7 rounded-xl bg-cloud flex items-center justify-center text-ink-300 text-xs shrink-0">
                          →
                        </span>
                      </div>

                      {/* Middle Row: Program & Category & Parent */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          {getProgramLabel(app.program)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cloud text-ink-400 font-medium">
                          Wali: {parentName}
                        </span>
                        <span className="text-ink-300 ml-auto font-mono text-[10px]">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Bottom Row: Status Badge & Payment Badge */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.color}`}>
                          {style.icon}
                          <span>{style.label}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            paymentStatus === "PAID"
                              ? "bg-leaf-50 text-leaf-600 border-leaf-200"
                              : "bg-coral-50 text-coral-600 border-coral-200"
                          }`}
                        >
                          {paymentStatus === "PAID" ? "Form Lunas" : "Belum Bayar"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* 2B. DESKTOP VIEW: FULL RICH DATA TABLE */}
              {/* ========================================================= */}
              <div className="hidden md:block bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cloud/50">
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">No. Registrasi</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Calon Siswa &amp; Orang Tua</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Jenjang Pendidikan</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Biaya &amp; Pembayaran</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Status Admisi</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {paginatedApplicants.map((app) => {
                        const style = getStatusStyle(app.status);
                        const guardian = app.guardians
                          ? Array.isArray(app.guardians)
                            ? app.guardians[0]
                            : app.guardians
                          : null;
                        const parentName = guardian ? guardian.full_name : "-";
                        const avatar = app.student_name ? app.student_name.substring(0, 2).toUpperCase() : "CS";
                        const formattedDate = new Date(app.submitted_at || app.created_at || new Date()).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                        const paymentStatus = app.payment_status || "PAID";
                        const paymentStyle =
                          paymentStatus === "PAID"
                            ? "bg-leaf-50 text-leaf-600 border-leaf-200"
                            : "bg-coral-50 text-coral-600 border-coral-200";

                        return (
                          <tr key={app.id} className="hover:bg-sky-50/40 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold font-mono text-ink mb-0.5">{app.registration_no || app.id.substring(0, 8)}</p>
                              <p className="text-xs font-medium text-ink-400">{formattedDate}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center font-display font-bold text-white text-sm shadow-sm`}>
                                  {avatar}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-ink group-hover:text-sky transition-colors">{app.student_name}</p>
                                  <p className="text-xs text-ink-400">Wali: {parentName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[11px] border border-sky-100">
                                  {getProgramLabel(app.program)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-cloud text-ink-400 font-semibold text-[11px] border border-ink/10">
                                  {app.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${paymentStyle}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${paymentStatus === "PAID" ? "bg-leaf-500" : "bg-coral-500"}`} />
                                {paymentStatus === "PAID" ? "Rp 1.000.000 (Lunas)" : "Belum Bayar"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.color} border`}>
                                {style.icon}
                                {style.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Link href={`/management/admisi/${app.id}`}>
                                <Button variant="ghost" size="sm" className="h-9 px-4 text-sky hover:bg-sky-50 hover:text-sky-700 font-bold rounded-full">
                                  Detail →
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3. PAGINATION & SHORT VIEW (10/20/50/100) */}
              {/* ========================================================= */}
              <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-400 font-medium">Tampilkan:</span>
                    <select
                      value={privatePageSize}
                      onChange={(e) => setPrivatePageSize(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-sky text-xs"
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
                      {filteredApplicants.length === 0
                        ? 0
                        : (privateCurrentPage - 1) * privatePageSize + 1}
                      -
                      {Math.min(
                        privateCurrentPage * privatePageSize,
                        filteredApplicants.length
                      )}
                    </strong>{" "}
                    dari <strong className="text-ink">{filteredApplicants.length}</strong> data
                  </span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={privateCurrentPage <= 1}
                    onClick={() => setPrivateCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, privateTotalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (privateTotalPages > 5 && privateCurrentPage > 3) {
                        pageNum = privateCurrentPage - 2 + i;
                        if (pageNum > privateTotalPages) {
                          pageNum = privateTotalPages - (4 - i);
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPrivateCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                            privateCurrentPage === pageNum
                              ? "bg-sky text-white shadow-2xs"
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
                    disabled={privateCurrentPage >= privateTotalPages}
                    onClick={() => setPrivateCurrentPage((p) => Math.min(privateTotalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 2: BATCH APPROVAL & CLASSROOM ASSIGNMENT */}
      {/* ========================================================================= */}
      {activeTab === "batch" && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
          {/* Batch Selector & Period Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {BATCH_LIST.map((batch) => {
              const isSelected = selectedBatchFilter === batch.key;
              const count = batchStudents.filter((s) => s.batch === batch.key).length;
              return (
                <div
                  key={batch.key}
                  onClick={() => setSelectedBatchFilter(isSelected ? "ALL" : batch.key)}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? `${batch.theme.bg} ${batch.theme.border} ring-2 ring-sky-500/20 shadow-md`
                      : "bg-white border-ink/5 hover:border-ink/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${batch.theme.badge}`}>
                      {batch.label}
                    </span>
                    <span className="font-display text-2xl font-black text-ink">{count} Siswa</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-ink mb-1">{batch.subLabel}</h3>
                  <p className="text-xs text-ink-400 mb-3">{batch.description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 bg-white/70 px-3 py-1.5 rounded-xl border border-ink/5 w-fit">
                    <Calendar size={13} className="text-sky-600" />
                    <span>Periode: <strong>{batch.periodLabel}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metric Summary Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-11 h-11 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">Filter Batch Aktif</p>
                <h4 className="font-display text-base sm:text-lg font-bold text-ink">
                  {selectedBatchFilter === "ALL"
                    ? "Semua Gelombang (All Batches)"
                    : getBatchInfo(selectedBatchFilter).label + " (" + getBatchInfo(selectedBatchFilter).periodLabel + ")"}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 divide-x divide-ink/10 w-full md:w-auto justify-between sm:justify-start">
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-ink-400 font-medium">Total Diterima</span>
                <p className="font-display text-xl sm:text-2xl font-black text-ink">{batchStats.total}</p>
              </div>
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-leaf-600 font-bold">Sudah Ada Kelas</span>
                <p className="font-display text-xl sm:text-2xl font-black text-leaf-600">{batchStats.assigned}</p>
              </div>
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-coral-600 font-bold">Belum Ada Kelas</span>
                <p className="font-display text-xl sm:text-2xl font-black text-coral-600">{batchStats.unassigned}</p>
              </div>
            </div>
          </div>

          {/* Batch Students Table & Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-ink-300" />
              </div>
              <Input
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
                placeholder="Cari siswa di listing batch..."
                className="pl-10 h-11 rounded-2xl bg-white border border-ink/10 text-xs sm:text-sm font-medium shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <Button
                variant={classFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("ALL")}
                className="rounded-xl text-xs font-bold h-9 px-3 whitespace-nowrap"
              >
                Semua Siswa ({batchStats.total})
              </Button>
              <Button
                variant={classFilter === "UNASSIGNED" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("UNASSIGNED")}
                className="rounded-xl text-xs font-bold text-coral-600 border-coral-200 h-9 px-3 whitespace-nowrap"
              >
                Belum Ada Kelas ({batchStats.unassigned})
              </Button>
              <Button
                variant={classFilter === "ASSIGNED" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("ASSIGNED")}
                className="rounded-xl text-xs font-bold text-leaf-600 border-leaf-200 h-9 px-3 whitespace-nowrap"
              >
                Sudah Ada Kelas ({batchStats.assigned})
              </Button>
            </div>
          </div>

          {filteredBatchStudents.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-ink/5 p-6 sm:p-8">
              <School size={28} className="text-ink-300 mx-auto mb-2.5" />
              <h3 className="font-bold text-base sm:text-lg text-ink">Tidak Ada Siswa di Batch Ini</h3>
              <p className="text-ink-400 text-xs mt-1">
                Siswa yang di-approve pada menu Private Admission akan otomatis muncul di sini untuk penempatan kelas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ========================================================= */}
              {/* 2C. MOBILE VIEW: BATCH STUDENTS CARDS */}
              {/* ========================================================= */}
              <div className="space-y-3 md:hidden">
                {paginatedBatchStudents.map((student) => {
                  const batchInfo = getBatchInfo(student.batch);

                  return (
                    <div
                      key={student.id}
                      className="p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-ink leading-tight">{student.full_name}</h4>
                          <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                            Reg: {student.registration_no}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${batchInfo.theme.badge}`}>
                          {batchInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          {student.program}
                        </span>
                        <span className="text-ink-400">
                          Wali: {student.guardian_name || "-"} ({student.guardian_phone || "-"})
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/5">
                        {student.school_class ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 text-xs font-bold">
                            <Check size={12} /> {student.school_class.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-coral-50 text-coral-600 border border-coral-200 text-xs font-bold">
                            <AlertCircle size={12} /> Belum Ada Kelas
                          </span>
                        )}

                        <Button
                          onClick={() => handleOpenAssignModal(student)}
                          size="sm"
                          className="h-8 px-3 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-2xs"
                        >
                          <School size={13} className="mr-1" />
                          {student.class_id ? "Ubah" : "Assign"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* 2D. DESKTOP VIEW: BATCH STUDENTS TABLE */}
              {/* ========================================================= */}
              <div className="hidden md:block bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cloud/50">
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Siswa</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Jenjang</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Gelombang (Batch)</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Orang Tua &amp; Kontak</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Penempatan Kelas</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {paginatedBatchStudents.map((student) => {
                        const batchInfo = getBatchInfo(student.batch);
                        return (
                          <tr key={student.id} className="hover:bg-sky-50/40 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-bold text-sm text-ink">{student.full_name}</p>
                              <p className="text-xs text-ink-400 font-mono">Reg: {student.registration_no}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                                {student.program}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${batchInfo.theme.badge}`}>
                                {batchInfo.label} ({batchInfo.periodLabel})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-xs font-bold text-ink">{student.guardian_name}</p>
                              <p className="text-xs text-ink-400">{student.guardian_phone}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {student.school_class ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 text-xs font-bold">
                                  <Check size={13} /> {student.school_class.name} (Tingkat {student.school_class.grade})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-200 text-xs font-bold">
                                  <AlertCircle size={13} /> Belum Ada Kelas
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button
                                onClick={() => handleOpenAssignModal(student)}
                                size="sm"
                                className="h-9 px-4 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-sm"
                              >
                                <School size={14} className="mr-1.5" />
                                {student.class_id ? "Ubah Kelas" : "Assign Kelas"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3B. PAGINATION & SHORT VIEW FOR BATCH STUDENTS */}
              {/* ========================================================= */}
              <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-400 font-medium">Tampilkan:</span>
                    <select
                      value={batchPageSize}
                      onChange={(e) => setBatchPageSize(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-sky text-xs"
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
                      {filteredBatchStudents.length === 0
                        ? 0
                        : (batchCurrentPage - 1) * batchPageSize + 1}
                      -
                      {Math.min(
                        batchCurrentPage * batchPageSize,
                        filteredBatchStudents.length
                      )}
                    </strong>{" "}
                    dari <strong className="text-ink">{filteredBatchStudents.length}</strong> data
                  </span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchCurrentPage <= 1}
                    onClick={() => setBatchCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, batchTotalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (batchTotalPages > 5 && batchCurrentPage > 3) {
                        pageNum = batchCurrentPage - 2 + i;
                        if (pageNum > batchTotalPages) {
                          pageNum = batchTotalPages - (4 - i);
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setBatchCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                            batchCurrentPage === pageNum
                              ? "bg-sky text-white shadow-2xs"
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
                    disabled={batchCurrentPage >= batchTotalPages}
                    onClick={() => setBatchCurrentPage((p) => Math.min(batchTotalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 2: PUBLIC ADMISSION (Manajemen Pendaftaran Online Terbuka) */}
      {/* ========================================================================= */}
      {activeTab === "public" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-ink/10 shadow-2xs">
              <span className="text-[11px] font-bold text-ink-300 uppercase tracking-wider block">
                Total Pendaftar Publik
              </span>
              <p className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
                {publicStats.total}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Perlu Verifikasi Transfer
                </span>
                {publicStats.waitingPayment > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-amber-900 mt-1">
                {publicStats.waitingPayment}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-leaf-50/70 border border-leaf-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-leaf-700 uppercase tracking-wider block">
                Lunas &amp; Link Terkirim
              </span>
              <p className="font-display text-2xl sm:text-3xl font-bold text-leaf-900 mt-1">
                {publicStats.paid}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-coral-50/60 border border-coral-200/70 shadow-2xs">
              <span className="text-[11px] font-bold text-coral-700 uppercase tracking-wider block">
                Pembayaran Ditolak
              </span>
              <p className="font-display text-2xl sm:text-3xl font-bold text-coral-900 mt-1">
                {publicStats.rejected}
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-ink/10 shadow-2xs">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300"
              />
              <Input
                type="text"
                placeholder="Cari siswa, no. registrasi, nama ortu, nomor WA..."
                value={publicSearchQuery}
                onChange={(e) => setPublicSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-cloud/60 border-ink/10 text-xs sm:text-sm font-medium w-full"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setPublicStatusFilter("ALL")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  publicStatusFilter === "ALL"
                    ? "bg-ink text-white"
                    : "bg-cloud/60 text-ink-400 hover:text-ink"
                }`}
              >
                Semua ({publicApplicants.length})
              </button>
              <button
                onClick={() => setPublicStatusFilter("WAITING_PAYMENT")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  publicStatusFilter === "WAITING_PAYMENT"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                Perlu Cek ({publicStats.waitingPayment})
              </button>
              <button
                onClick={() => setPublicStatusFilter("PAID")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  publicStatusFilter === "PAID"
                    ? "bg-leaf-600 text-white shadow-xs"
                    : "bg-leaf-50 text-leaf-800 hover:bg-leaf-100"
                }`}
              >
                Lunas ({publicStats.paid})
              </button>
              <button
                onClick={() => setPublicStatusFilter("REJECTED")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  publicStatusFilter === "REJECTED"
                    ? "bg-coral text-white shadow-xs"
                    : "bg-coral-50 text-coral hover:bg-coral-100"
                }`}
              >
                Ditolak ({publicStats.rejected})
              </button>
            </div>
          </div>

          {/* Public Applicants Table */}
          <div className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-cloud/40 text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">No. Registrasi &amp; Tanggal</th>
                    <th className="py-3.5 px-4">Calon Siswa</th>
                    <th className="py-3.5 px-4">Orang Tua / Kontak</th>
                    <th className="py-3.5 px-4">Bukti Transfer (Rp 1jt)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 text-xs sm:text-sm">
                  {paginatedPublicApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-300">
                        Tidak ada data pendaftaran publik yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPublicApplicants.map((app) => {
                      const guardian = app.guardians?.[0];
                      const rawPhone = (guardian?.phone || "").replace(/[^0-9]/g, "");
                      const waPhone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone;
                      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jacosmanagement.vercel.app";
                      const uniqueLink = `${baseUrl}/reg/${app.registration_token}`;
                      const waReminderMessage = `Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak/Ibu ${guardian?.full_name || ""},\n\nBerikut tautan formulir pendaftaran eksklusif calon siswa ananda *${app.student_name}* di JACOS:\n👉 ${uniqueLink}\n\nSilakan isi formulir dengan lengkap dan lampirkan dokumen pendukung.\n\nSalam hangat,\n*Tim Admisi JACOS*`;

                      const isPending =
                        app.payment_status === "PENDING_VERIFICATION" ||
                        app.status === "WAITING_REVIEW";
                      const isPaid = app.payment_status === "PAID";
                      const isRejected =
                        app.payment_status === "REJECTED" || app.status === "REJECTED";

                      return (
                        <tr key={app.id} className="hover:bg-cloud/25 transition">
                          {/* 1. Reg No & Date */}
                          <td className="py-4 px-4 sm:px-6">
                            <span className="font-mono font-bold text-sky text-xs block">
                              {app.registration_no}
                            </span>
                            <span className="text-[11px] text-ink-300">
                              {app.submitted_at
                                ? new Date(app.submitted_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </span>
                          </td>

                          {/* 2. Student Info */}
                          <td className="py-4 px-4">
                            <p className="font-bold text-ink">{app.student_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-ink-400">
                                {getProgramLabel(app.program)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cloud text-ink-400">
                                {app.gender === "MALE" ? "L" : "P"}
                              </span>
                            </div>
                          </td>

                          {/* 3. Guardian & Contacts */}
                          <td className="py-4 px-4">
                            <p className="font-semibold text-ink">{guardian?.full_name || "-"}</p>
                            <div className="flex flex-col gap-0.5 text-[11px] text-ink-400 mt-0.5">
                              {guardian?.phone && (
                                <a
                                  href={`https://wa.me/${waPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-green-600 hover:underline inline-flex items-center gap-1 font-mono"
                                >
                                  <Phone size={11} /> {guardian.phone}
                                </a>
                              )}
                              <span className="text-slate-400 truncate max-w-[150px]">
                                {guardian?.email || "-"}
                              </span>
                            </div>
                          </td>

                          {/* 4. Payment Proof */}
                          <td className="py-4 px-4">
                            {app.has_payment_proof || app.doc_payment_proof || app.doc_payment_proof_signed || app.payment_note?.includes("Bukti: ") ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenProofModal(app)}
                                className="h-8 px-2.5 rounded-xl border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-sky-700 font-bold text-xs inline-flex items-center gap-1.5"
                              >
                                <Eye size={13} />
                                <span>Lihat Bukti</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Belum ada file</span>
                            )}
                          </td>

                          {/* 5. Status Badges */}
                          <td className="py-4 px-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                <Clock size={12} /> Cek Transfer
                              </span>
                            )}
                            {isPaid && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 text-xs font-bold">
                                  <CheckCircle2 size={12} /> Lunas
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {app.form_submitted ? "Form Lengkap" : "Menunggu Form"}
                                </p>
                              </div>
                            )}
                            {isRejected && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral-50 text-coral border border-coral-200 text-xs font-bold">
                                  <XCircle size={12} /> Ditolak
                                </span>
                                {app.rejection_reason && (
                                  <p className="text-[10px] text-coral-600 truncate max-w-[140px]" title={app.rejection_reason}>
                                    {app.rejection_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 6. Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprovePayment(app)}
                                    disabled={isProcessingPayment}
                                    className="h-8 px-3 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs shadow-xs"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenRejectPayment(app)}
                                    disabled={isProcessingPayment}
                                    className="h-8 px-2.5 rounded-xl border-coral-200 text-coral hover:bg-coral-50 font-bold text-xs"
                                  >
                                    Tolak
                                  </Button>
                                </>
                              )}

                              {isPaid && (
                                <>
                                  {waPhone && (
                                    <a
                                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waReminderMessage)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold text-xs transition"
                                      title="Kirim tautan pendaftaran via WhatsApp"
                                    >
                                      <Phone size={12} />
                                      <span className="hidden sm:inline">WA Link</span>
                                    </a>
                                  )}
                                  <Link href={`/management/admisi/${app.id}`}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2.5 rounded-xl border-ink/15 font-bold text-xs hover:bg-cloud"
                                    >
                                      Detail
                                    </Button>
                                  </Link>
                                </>
                              )}

                              {isRejected && (
                                <Link href={`/management/admisi/${app.id}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 rounded-xl border-ink/15 font-bold text-xs hover:bg-cloud"
                                  >
                                    Detail
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-cloud/20 text-xs">
              <span className="text-ink-300">
                Menampilkan {paginatedPublicApplicants.length} dari {filteredPublicApplicants.length} pendaftar publik
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={publicCurrentPage === 1}
                  onClick={() => setPublicCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 rounded-xl border-ink/15 font-bold"
                >
                  <ChevronLeft size={14} className="mr-1" /> Prev
                </Button>
                <span className="font-bold text-ink px-2">
                  {publicCurrentPage} / {publicTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={publicCurrentPage >= publicTotalPages}
                  onClick={() => setPublicCurrentPage((p) => p + 1)}
                  className="h-8 px-2.5 rounded-xl border-ink/15 font-bold"
                >
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
