"use client";

import { useEffect, useState } from "react";
import { createParentClient } from "@/lib/supabase/client";
import { getCompletePickupData } from "../../server-actions";
import { QRCodeSVG } from "qrcode.react";
import {
  Car,
  UserCircle,
  Users,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ShieldCheck,
  Baby,
  AlertTriangle,
} from "lucide-react";
import { PickupQRModal } from "@/components/parent-portal/PickupQRModal";

// ─── Types ──────────────────────────────────────────
interface StudentData {
  id: string;
  full_name: string;
  nis: string | null;
  program: string | null;
  school_classes?: { name: string; grade: string } | Array<{ name: string; grade: string }> | null | any;
  authorized_pickup_name?: string | null;
  authorized_pickup_relation?: string | null;
}

interface PickupHistoryItem {
  id: string;
  pickup_date: string;
  status: string;
  picked_by_name: string | null;
  picked_by_relation: string | null;
  picked_up_at: string | null;
}

// ─── Helpers ────────────────────────────────────────
const programLabel: Record<string, string> = {
  PRESCHOOL: "Preschool",
  KINDERGARTEN: "Kindergarten (TK)",
  PRIMARY_SCHOOL: "Primary School (SD)",
  SD: "Primary School (SD)",
  TK: "Kindergarten (TK)",
};

function getClassName(cls: StudentData["school_classes"]): string | null {
  if (!cls) return null;
  if (Array.isArray(cls)) return cls[0]?.name || null;
  return (cls as any).name || null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Page ──────────────────────────────────────
export default function PenjemputanPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [applicantData, setApplicantData] = useState<any>(null);
  const [parentName, setParentName] = useState<string>("Orang Tua");
  const [history, setHistory] = useState<PickupHistoryItem[]>([]);

  // QR state
  const [showQR, setShowQR] = useState(false);
  const [qrKey, setQrKey] = useState(Date.now());
  const [pickerType, setPickerType] = useState<"parent" | "other">("parent");
  const [pickerName, setPickerName] = useState("");
  const [pickerRole, setPickerRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createParentClient();

  // ── Fetch student data ──
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const user = session.user;
        const studentIdMeta = user.user_metadata?.student_id;
        const userEmail = user.email;
        const fullName = user.user_metadata?.full_name || "Orang Tua";
        setParentName(fullName);

        const res = await getCompletePickupData(userEmail, studentIdMeta);
        
        if (res.success) {
          let loadedStudent = res.student;
          let loadedApplicant = res.applicant;
          
          if (!loadedStudent && loadedApplicant?.student_name) {
            loadedStudent = {
              id: `applicant_${loadedApplicant.id || ''}`,
              full_name: loadedApplicant.student_name,
              nis: null,
              program: null,
              school_classes: null as any,
            };
          }

          if (loadedStudent && loadedApplicant) {
            loadedStudent = {
              ...loadedStudent,
              authorized_pickup_name: loadedApplicant.authorized_pickup_name,
              authorized_pickup_relation: loadedApplicant.authorized_pickup_relation,
            } as any;
          }

          setStudent(loadedStudent as any);
          setApplicantData(loadedApplicant);
          setHistory(res.pickups || []);
        }
      } catch (err) {
        console.error("Error loading penjemputan:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickerType === "other" && (!pickerName.trim() || !pickerRole.trim())) {
      alert("Harap lengkapi nama dan relasi penjemput.");
      return;
    }
    setIsSubmitting(true);
    setQrKey(Date.now());
    setShowQR(true);
    setIsSubmitting(false);
  };

  const className = getClassName(student?.school_classes ?? null);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
        <div className="h-7 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="h-72 bg-white rounded-3xl border border-gray-100" />
          <div className="h-72 bg-white rounded-3xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <p className="font-bold text-gray-700">Data siswa tidak ditemukan</p>
        <p className="text-sm text-gray-400 max-w-xs">
          Data siswa akan tersedia setelah proses penerimaan selesai.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistem Penjemputan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate QR Code aman untuk menjemput{" "}
          <span className="font-semibold text-gray-700">{student.full_name}</span> di sekolah.
        </p>
      </div>

      {/* Student Info Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-[2rem] p-5 sm:p-6 text-white flex items-center gap-4 shadow-xl shadow-purple-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
          <Baby size={28} className="text-white" />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <p className="font-bold text-lg truncate tracking-tight">{student.full_name}</p>
          <p className="text-purple-100 text-xs sm:text-sm font-medium">
            {className ? `${className} · ` : ""}{programLabel[student.program || ""] || student.program || "Primary School (SD)"}
          </p>
          {student.nis && (
            <p className="text-purple-200 text-xs font-mono mt-0.5">NIS: {student.nis}</p>
          )}
        </div>
        <div className="shrink-0 text-right hidden sm:block relative z-10">
          <p className="text-xs text-purple-200 font-medium">Penjemput Terdaftar</p>
          <p className="text-sm font-bold text-white">
            {student.authorized_pickup_name || parentName}
          </p>
          {student.authorized_pickup_relation && (
            <p className="text-xs text-purple-200">{student.authorized_pickup_relation}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Generator Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
              <Car size={22} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Generate QR Jemput</h2>
              <p className="text-xs text-gray-400 font-medium">Pilih siapa yang akan menjemput</p>
            </div>
          </div>

          <form onSubmit={handleGenerateQR} className="space-y-5">
            {/* Picker Type */}
            <div className="grid grid-cols-2 gap-3">
              {/* Saya Sendiri */}
              <button
                type="button"
                onClick={() => setPickerType("parent")}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  pickerType === "parent"
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-100 bg-gray-50 hover:border-violet-200"
                }`}
              >
                <UserCircle
                  size={30}
                  className={pickerType === "parent" ? "text-violet-600" : "text-gray-300"}
                />
                <span className={`font-bold text-xs text-center ${pickerType === "parent" ? "text-violet-700" : "text-gray-400"}`}>
                  Saya Sendiri
                </span>
                {pickerType === "parent" && (
                  <CheckCircle2 size={15} className="absolute top-2.5 right-2.5 text-violet-500" />
                )}
              </button>

              {/* Orang Lain */}
              <button
                type="button"
                onClick={() => setPickerType("other")}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  pickerType === "other"
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-100 bg-gray-50 hover:border-violet-200"
                }`}
              >
                <Users
                  size={30}
                  className={pickerType === "other" ? "text-violet-600" : "text-gray-300"}
                />
                <span className={`font-bold text-xs text-center ${pickerType === "other" ? "text-violet-700" : "text-gray-400"}`}>
                  Utusan / Keluarga
                </span>
                {pickerType === "other" && (
                  <CheckCircle2 size={15} className="absolute top-2.5 right-2.5 text-violet-500" />
                )}
              </button>
            </div>

            {/* "Saya Sendiri" info */}
            {pickerType === "parent" && (
              <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl animate-in fade-in duration-200">
                <ShieldCheck size={20} className="text-violet-500 shrink-0" />
                <div>
                  <p className="font-bold text-violet-900 text-sm">{parentName}</p>
                  <p className="text-xs text-violet-500">Orang Tua / Wali Utama</p>
                </div>
              </div>
            )}

            {/* Other picker fields */}
            {pickerType === "other" && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    Nama Lengkap Penjemput <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pickerName}
                    onChange={(e) => setPickerName(e.target.value)}
                    placeholder="Cth: Budi Santoso"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-gray-50"
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    Relasi / Tanggung Jawab <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pickerRole}
                    onChange={(e) => setPickerRole(e.target.value)}
                    placeholder="Cth: Supir Pribadi / Paman"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-gray-50"
                  />
                </div>

                {/* Quick Chips for easy selection */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Pilihan Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Supir Pribadi", "Paman / Tante", "Kakek / Nenek", "Wali Pengganti", "Keluarga"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setPickerRole(chip)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition ${
                          pickerRole === chip
                            ? "bg-violet-100 text-violet-900 border-violet-300"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <QRCodeSVG value="x" size={16} className="opacity-80" />
              Buat QR Code Penjemputan
            </button>
          </form>

          {/* Security note */}
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <RefreshCcw size={13} className="mt-0.5 shrink-0" />
            <span>QR Code diperbarui otomatis setiap 30 detik untuk keamanan. Tampilkan ke petugas security saat menjemput.</span>
          </div>
        </div>

        {/* Pickup History */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Clock size={22} className="text-gray-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Riwayat Penjemputan</h2>
              <p className="text-xs text-gray-400 font-medium">10 data terbaru</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Belum ada riwayat</p>
              <p className="text-xs text-gray-300">Riwayat penjemputan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const statusColor =
                  item.status === "PICKED_UP"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : item.status === "WAITING"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-600 border-gray-200";
                const statusLabel =
                  item.status === "PICKED_UP"
                    ? "Sudah Dijemput"
                    : item.status === "WAITING"
                    ? "Menunggu"
                    : item.status;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Car size={16} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-bold text-gray-800 text-sm">
                          {item.picked_by_name || "—"}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {item.picked_by_relation || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(item.pickup_date)}
                        {item.picked_up_at ? ` · ${formatTime(item.picked_up_at)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Shared QR Modal ── */}
      <PickupQRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        student={student}
        parentName={parentName}
        showLinkToFullPage={false}
      />
    </div>
  );
}
