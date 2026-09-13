"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  ShieldCheck,
  UserCircle,
  Users,
  Sun,
  CheckCircle2,
  RefreshCcw,
  Car,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudentData {
  id?: string;
  full_name?: string;
  nis?: string | null;
  program?: string | null;
  school_classes?: any;
  authorized_pickup_name?: string | null;
  authorized_pickup_relation?: string | null;
}

interface PickupQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData | null;
  parentName?: string;
  showLinkToFullPage?: boolean;
}

// ─── Program labels helper ───
const programLabels: Record<string, string> = {
  PRESCHOOL: "Preschool",
  KINDERGARTEN: "Kindergarten (TK)",
  PRIMARY_SCHOOL: "Primary School (SD)",
  SD: "Primary School (SD)",
  TK: "Kindergarten (TK)",
};

const QUICK_RELATION_CHIPS = [
  "Supir Pribadi",
  "Paman / Tante",
  "Kakek / Nenek",
  "Wali Pengganti",
  "Keluarga",
];

// ─── Circular 30s Countdown Timer ───
function QRTimer({ duration = 30, onExpire }: { duration?: number; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    setSeconds(duration);
  }, [duration]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      setSeconds(duration);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, duration, onExpire]);

  const pct = (seconds / duration) * 100;
  const stroke = 2 * Math.PI * 18;
  const dash = (pct / 100) * stroke;
  const color = seconds > 10 ? "#22c55e" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="44" height="44" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="18" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${stroke}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <span className="text-[11px] font-extrabold font-mono -mt-1" style={{ color }}>
        {seconds}s
      </span>
    </div>
  );
}

export function PickupQRModal({
  isOpen,
  onClose,
  student,
  parentName = "Orang Tua",
  showLinkToFullPage = false,
}: PickupQRModalProps) {
  const [pickerType, setPickerType] = useState<"parent" | "other">("parent");
  const [pickerName, setPickerName] = useState("");
  const [pickerRole, setPickerRole] = useState("");
  const [qrKey, setQrKey] = useState(Date.now());

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQrKey(Date.now());
      if (student?.authorized_pickup_name) {
        setPickerName(student.authorized_pickup_name);
        setPickerRole(student.authorized_pickup_relation || "Utusan Terdaftar");
      }
    }
  }, [isOpen, student]);

  const handleQRExpire = useCallback(() => {
    setQrKey(Date.now());
  }, []);

  const className = useMemo(() => {
    if (!student?.school_classes) return "Grade 1";
    if (Array.isArray(student.school_classes)) {
      return student.school_classes[0]?.name || "Grade 1";
    }
    return (student.school_classes as any)?.name || "Grade 1";
  }, [student]);

  const programName = useMemo(() => {
    const prog = student?.program || "";
    return programLabels[prog] || prog || "Primary School (SD)";
  }, [student]);

  const pickerDisplay = useMemo(() => {
    if (pickerType === "parent") {
      return parentName;
    }
    return pickerName.trim() || student?.authorized_pickup_name || "Utusan / Penjemput";
  }, [pickerType, parentName, pickerName, student]);

  const roleDisplay = useMemo(() => {
    if (pickerType === "parent") {
      return "Orang Tua / Wali Utama";
    }
    return pickerRole.trim() || student?.authorized_pickup_relation || "Utusan Penjemput";
  }, [pickerType, pickerRole, student]);

  const qrPayload = useMemo(() => {
    return JSON.stringify({
      v: 2,
      studentId: student?.id || "",
      studentName: student?.full_name || "Siswa JACOS",
      studentNis: student?.nis || "",
      picker: pickerDisplay,
      pickerName: pickerDisplay,
      role: roleDisplay,
      pickerRole: roleDisplay,
      ts: qrKey,
    });
  }, [student, pickerDisplay, roleDisplay, qrKey]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* ─── Modal Header ─── */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 pt-6 pb-5 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center text-white transition shadow-xs z-10"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase mb-2 border border-white/10">
            <ShieldCheck size={13} className="text-purple-200" />
            <span>QR PENJEMPUTAN DIGITAL JACOS</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white truncate pr-8">
            {student?.full_name || "Siswa JACOS"}
          </h3>
          <p className="text-purple-100 text-xs font-medium mt-0.5">
            {className} • {programName}
            {student?.nis ? ` • NIS: ${student.nis}` : ""}
          </p>
        </div>

        {/* ─── Modal Scrollable Body ─── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* Picker Toggle & Configuration */}
          <div className="bg-slate-50/80 rounded-2xl p-1.5 border border-slate-200/80">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPickerType("parent")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  pickerType === "parent"
                    ? "bg-white text-purple-900 shadow-sm border border-purple-200/80 scale-[1.01]"
                    : "text-ink-400 hover:text-ink hover:bg-slate-100/60"
                }`}
              >
                <UserCircle size={17} className={pickerType === "parent" ? "text-purple-600" : "text-ink-300"} />
                <span>Saya Sendiri</span>
                {pickerType === "parent" && <CheckCircle2 size={14} className="text-purple-600 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => setPickerType("other")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  pickerType === "other"
                    ? "bg-white text-purple-900 shadow-sm border border-purple-200/80 scale-[1.01]"
                    : "text-ink-400 hover:text-ink hover:bg-slate-100/60"
                }`}
              >
                <Users size={17} className={pickerType === "other" ? "text-purple-600" : "text-ink-300"} />
                <span>Utusan / Lainnya</span>
                {pickerType === "other" && <CheckCircle2 size={14} className="text-purple-600 ml-auto" />}
              </button>
            </div>

            {/* Manual input expandable form for "Utusan / Keluarga" */}
            {pickerType === "other" && (
              <div className="mt-3 p-3.5 bg-white rounded-xl border border-purple-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <Label htmlFor="manualPickerName" className="text-[11px] font-bold text-ink-600 block mb-1">
                    Nama Penjemput <span className="text-coral">*</span>
                  </Label>
                  <Input
                    id="manualPickerName"
                    type="text"
                    value={pickerName}
                    onChange={(e) => setPickerName(e.target.value)}
                    placeholder="Contoh: Pak Budi (Supir)"
                    className="h-9 text-xs rounded-xl border-ink/15 bg-slate-50/50 focus:bg-white"
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="manualPickerRole" className="text-[11px] font-bold text-ink-600 block mb-1">
                    Hubungan / Tanggung Jawab <span className="text-coral">*</span>
                  </Label>
                  <Input
                    id="manualPickerRole"
                    type="text"
                    value={pickerRole}
                    onChange={(e) => setPickerRole(e.target.value)}
                    placeholder="Contoh: Supir Pribadi / Paman"
                    className="h-9 text-xs rounded-xl border-ink/15 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                {/* Quick Chips for fast tap */}
                <div>
                  <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block mb-1.5">
                    Pilihan Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_RELATION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setPickerRole(chip)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          pickerRole === chip
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : "bg-slate-50 text-ink-500 border-ink/10 hover:bg-slate-100"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── PROMINENT LARGE QR CODE BOX ─── */}
          <div className="bg-gradient-to-b from-purple-50/50 to-indigo-50/30 p-4 sm:p-5 rounded-3xl border-2 border-purple-100 flex flex-col items-center justify-center text-center shadow-xs relative">
            
            {/* White frame holding QR Code */}
            <div className="bg-white border-4 border-violet-200/90 rounded-[2rem] p-4 sm:p-5 shadow-lg flex items-center justify-center relative overflow-hidden">
              {/* Laser scanning beam */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse rounded-t-3xl" />
              
              <QRCodeSVG
                key={qrKey}
                value={qrPayload}
                size={250}
                level="H"
                includeMargin={false}
                className="w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] object-contain rounded-xl"
                imageSettings={{
                  src: "/publicjacos/logohijau.png",
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
            </div>

            {/* Timer & Status Bar */}
            <div className="flex items-center justify-center gap-3 mt-4 w-full">
              <QRTimer duration={30} onExpire={handleQRExpire} />
              <div className="text-left">
                <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <RefreshCcw size={13} className="text-purple-600 animate-spin" />
                  QR Otomatis Diperbarui
                </p>
                <p className="text-[11px] text-ink-400">
                  Validitas 30 detik untuk keamanan maksimal
                </p>
              </div>
            </div>

            {/* Brightness Tip Banner */}
            <div className="mt-3.5 w-full bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center gap-2 text-left">
              <Sun size={15} className="text-amber-500 shrink-0" />
              <p className="text-[11px] font-semibold text-amber-900 leading-tight">
                Tingkatkan kecerahan layar HP agar petugas security mudah memindai.
              </p>
            </div>
          </div>

          {/* Active Penjemput Summary Badge */}
          <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                  Penjemput Sah
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Siap Scan
                </span>
              </div>
              <p className="font-bold text-purple-950 text-sm truncate">{pickerDisplay}</p>
              <p className="text-xs text-purple-700 font-medium">{roleDisplay}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {showLinkToFullPage && (
              <Link href="/parent-portal/penjemputan" onClick={onClose} className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-2xl font-bold text-xs text-purple-700 border-purple-200 hover:bg-purple-50 gap-2 shadow-xs"
                >
                  <Car size={16} /> Buka Halaman Penjemputan Lengkap
                  <ChevronRight size={14} className="ml-auto" />
                </Button>
              </Link>
            )}

            <Button
              type="button"
              onClick={onClose}
              className="w-full h-12 bg-ink hover:bg-ink-700 text-white rounded-2xl font-bold text-xs shadow-sm transition active:scale-95"
            >
              Tutup QR Penjemputan
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
