"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { processRfidScan } from "@/app/management/absensi/actions";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Check,
  Volume2,
  VolumeX,
  GraduationCap,
  ShieldCheck,
  Radio,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function playKioskBeep(type: "checkin" | "checkout" | "error" | "chime" = "checkin") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "checkin" || type === "chime") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.4);
    } else if (type === "checkout") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.12); // D5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.4);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Ignore audio blocked errors
  }
}

function speakGreeting(studentName: string, isCheckOut: boolean) {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = isCheckOut
        ? `Sampai jumpa lagi ananda ${studentName}, hati-hati di jalan!`
        : `Selamat datang ananda ${studentName}, selamat belajar!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    // ignore TTS errors
  }
}

interface AbsenClientPageProps {
  classData: { id: string; name: string; grade?: string };
  initialAttendance: any[];
  totalStudents?: number;
}

export default function AbsenClientPage({
  classData,
  initialAttendance,
  totalStudents = 0,
}: AbsenClientPageProps) {
  const router = useRouter();
  const [rfid, setRfid] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    student?: any;
    alreadyScanned?: boolean;
    isCheckOut?: boolean;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [attendanceList, setAttendanceList] = useState(initialAttendance);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PRESENT" | "CHECKOUT">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAttendanceList(initialAttendance);
  }, [initialAttendance]);

  // Kiosk Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
    const focusInterval = setInterval(() => {
      inputRef.current?.focus();
    }, 2000);
    return () => clearInterval(focusInterval);
  }, []);

  // Live Clock Interval
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Auto-dismiss Result Card
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfid.trim()) return;

    const currentRfid = rfid.trim();
    setRfid("");

    const res = await processRfidScan(currentRfid, classData.id);
    setResult(res);

    if (soundEnabled) {
      if (res.success) {
        playKioskBeep(res.isCheckOut ? "checkout" : "checkin");
        if (res.student?.full_name) {
          const firstName = res.student.full_name.split(" ")[0];
          speakGreeting(firstName, !!res.isCheckOut);
        }
      } else {
        playKioskBeep("error");
      }
    }

    if (res.success && res.student) {
      // Optimistic UI update
      setAttendanceList((prev) => {
        const existingIdx = prev.findIndex((a) => a.students?.id === res.student.id);
        const timeStr = new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        if (existingIdx >= 0) {
          if (res.isCheckOut) {
            const updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], check_out_time: timeStr };
            return updated;
          }
          return prev;
        } else {
          const newEntry = {
            id: "temp-" + Date.now(),
            check_in_time: timeStr,
            check_out_time: null,
            students: res.student,
          };
          return [newEntry, ...prev];
        }
      });

      router.refresh();
    }
  };

  const formattedTimeHours = mounted
    ? currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";
  const formattedDate = mounted
    ? currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Attendance stats
  const totalAttended = attendanceList.length;
  const effectiveTotal = Math.max(totalStudents, totalAttended);
  const percentAttendance = effectiveTotal > 0 ? Math.round((totalAttended / effectiveTotal) * 100) : 0;
  
  // Categorize
  const onTimeCount = useMemo(() => {
    return attendanceList.filter((a) => {
      if (!a.check_in_time) return false;
      const [h, m] = a.check_in_time.split(":").map(Number);
      return h < 7 || (h === 7 && m <= 15);
    }).length;
  }, [attendanceList]);

  const lateCount = totalAttended - onTimeCount;
  const checkedOutCount = useMemo(() => {
    return attendanceList.filter((a) => Boolean(a.check_out_time)).length;
  }, [attendanceList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return attendanceList.filter((item) => {
      const nameMatch = (item.students?.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const nisMatch = (item.students?.nis || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const queryOk = searchQuery.trim() === "" || nameMatch || nisMatch;

      if (!queryOk) return false;
      if (filterType === "PRESENT") return !item.check_out_time;
      if (filterType === "CHECKOUT") return Boolean(item.check_out_time);
      return true;
    });
  }, [attendanceList, searchQuery, filterType]);

  return (
    <div className="min-h-screen bg-[#070D18] text-white relative overflow-hidden flex flex-col font-sans selection:bg-sky/30">
      {/* Dynamic Background Mesh & Star Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(47,111,237,0.18),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_10%_90%,rgba(47,179,120,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 star-texture opacity-[0.08] pointer-events-none" />

      {/* Hidden Kiosk RFID Input Form */}
      <form onSubmit={handleSubmit} className="absolute opacity-0 pointer-events-none -top-96">
        <Input
          ref={inputRef}
          type="text"
          value={rfid}
          onChange={(e) => setRfid(e.target.value)}
          autoComplete="off"
        />
      </form>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR */}
      {/* ========================================================================= */}
      <header className="relative z-20 px-6 lg:px-10 py-4.5 border-b border-white/10 bg-[#070D18]/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Kiosk Status */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky to-sky-400 flex items-center justify-center font-display text-white text-2xl font-black shadow-[0_0_24px_rgba(47,111,237,0.4)]">
            J
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg lg:text-xl tracking-tight text-white">
                JACOS <span className="text-sky font-normal">SMART ATTENDANCE</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-leaf/15 text-leaf-400 border border-leaf/30 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-leaf animate-ping" />
                SCANNER SIAGA
              </span>
            </div>
            <p className="text-xs text-white/50">
              Presensi Siswa Mandiri • Kelas {classData.name}
            </p>
          </div>
        </div>

        {/* Center Digital Clock Display */}
        <div className="flex flex-col items-center justify-center text-center px-6 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <Clock size={16} className="text-sky animate-pulse" />
            <span className="font-mono text-2xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky">
              {formattedTimeHours}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky/20 text-sky border border-sky/30">
              WIB
            </span>
          </div>
          <p className="text-[11px] text-white/50 font-medium" suppressHydrationWarning>
            {formattedDate}
          </p>
        </div>

        {/* Class Badge & Sound Switch */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky/20 to-purple-600/20 border border-sky/30 flex items-center gap-2.5 shadow-sm">
            <GraduationCap size={18} className="text-sky" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky block">
                Ruang Kelas
              </span>
              <span className="text-sm font-black text-white">{classData.name}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
            title={soundEnabled ? "Audio Aktif" : "Audio Mute"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-sky" /> : <VolumeX size={18} />}
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI STATS RIBBON */}
      {/* ========================================================================= */}
      <section className="relative z-10 px-6 lg:px-10 py-3 bg-white/[0.02] border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6">
        {/* Total Hadir */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-sky/15 text-sky flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">
              Total Kehadiran
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-lg text-white">
                {totalAttended}
              </span>
              <span className="text-xs text-white/40 font-medium">
                / {effectiveTotal} Siswa ({percentAttendance}%)
              </span>
            </div>
          </div>
        </div>

        {/* Tepat Waktu */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-leaf/15 text-leaf-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-leaf-400 block">
              Hadir Tepat Waktu
            </span>
            <span className="font-display font-black text-lg text-white">
              {onTimeCount} <span className="text-xs text-white/40 font-normal">Siswa</span>
            </span>
          </div>
        </div>

        {/* Terlambat */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gold block">
              Terlambat
            </span>
            <span className="font-display font-black text-lg text-white">
              {lateCount} <span className="text-xs text-white/40 font-normal">Siswa</span>
            </span>
          </div>
        </div>

        {/* Belum Absen */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-coral/15 text-coral flex items-center justify-center font-bold">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-coral block">
              Sudah Pulang
            </span>
            <span className="font-display font-black text-lg text-white">
              {checkedOutCount} <span className="text-xs text-white/40 font-normal">Siswa</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE (LEFT SCANNER, RIGHT ATTENDANCE BOARD) */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT PANE: Holographic Scanner Interactive Area */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 xl:col-span-5 p-6 lg:p-10 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-b from-transparent via-white/[0.01] to-black/30">
          {!result && (
            <div className="flex flex-col items-center text-center max-w-sm animate-in fade-in duration-300">
              {/* High-Tech Glowing Card Pad Target */}
              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Orbital animated pulse rings */}
                <div className="pulse-ring absolute inset-0 rounded-full border-2 border-sky/40" />
                <div className="pulse-ring-delay absolute inset-0 rounded-full border-2 border-sky/30" />
                <div className="absolute inset-4 rounded-full border border-dashed border-sky/30 animate-spin" style={{ animationDuration: "20s" }} />

                {/* Center Glow Sensor Plate */}
                <div className="relative z-10 w-44 h-44 rounded-[2.5rem] bg-gradient-to-tr from-sky/20 via-[#0E1A33] to-purple-600/20 border-2 border-sky/60 shadow-[0_0_50px_rgba(47,111,237,0.35)] flex flex-col items-center justify-center group">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky to-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky/40 mb-1 group-hover:scale-110 transition-transform duration-300">
                    <CreditCard size={40} className="animate-pulse" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky mt-1">
                    NFC / RFID AREA
                  </span>
                </div>
              </div>

              {/* Text Instructions */}
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
                Tempelkan Kartu
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                Dekatkan kartu identitas / RFID pelajar ke area sensor untuk mencatat presensi hari ini.
              </p>

              {/* Kiosk status indicator */}
              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
                <Radio size={14} className="text-leaf-400 animate-ping" />
                <span>Sensor otomatis mendeteksi saat kartu ditempel</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* RESULT CARD: SCAN SUCCESS GREETING */}
          {/* --------------------------------------------------------------------- */}
          {result && result.success && (
            <div className="flex flex-col items-center text-center w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
              <div className="w-full bg-[#0D172E] border-2 border-leaf/60 rounded-[3rem] p-7 shadow-[0_0_60px_rgba(47,179,120,0.3)] relative overflow-hidden">
                {/* Top Glowing Ribbon */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-leaf via-sky to-leaf" />

                {/* Avatar */}
                <div className="relative mx-auto w-28 h-28 mb-4">
                  {result.student?.profile_picture ? (
                    <img
                      src={result.student.profile_picture}
                      className="w-full h-full rounded-full object-cover border-4 border-leaf shadow-xl"
                      alt={result.student?.full_name}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-leaf to-sky text-white flex items-center justify-center font-display text-4xl font-black shadow-xl border-4 border-white/20 uppercase">
                      {result.student?.full_name?.charAt(0) || "S"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-leaf text-white flex items-center justify-center shadow-lg border-2 border-[#0D172E]">
                    <Check size={18} strokeWidth={3} />
                  </div>
                </div>

                {/* Greetings */}
                <span className="text-xs font-black tracking-widest uppercase text-leaf-400">
                  {result.isCheckOut
                    ? "PRESENSI PULANG BERHASIL"
                    : result.alreadyScanned
                    ? "SUDAH TERCATAT SEBELUMNYA"
                    : "PRESENSI MASUK BERHASIL"}
                </span>

                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-1">
                  {result.isCheckOut
                    ? "Sampai Jumpa,"
                    : result.alreadyScanned
                    ? "Halo Kembali,"
                    : "Selamat Datang,"}{" "}
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-leaf-400 to-sky">
                    {result.student?.full_name?.split(" ")[0]}!
                  </span>
                </h3>

                <p className="text-xs text-white/60 mb-5">{result.student?.full_name}</p>

                {/* Badge Time Details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-around">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">
                      Waktu Presensi
                    </span>
                    <span className="font-mono text-base font-black text-white">
                      {currentTime.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">
                      Status
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        result.isCheckOut
                          ? "bg-coral/20 text-coral border border-coral/30"
                          : "bg-leaf/20 text-leaf-400 border border-leaf/30"
                      }`}
                    >
                      {result.isCheckOut ? "Absen Pulang" : "Hadir"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* RESULT CARD: SCAN ERROR */}
          {/* --------------------------------------------------------------------- */}
          {result && !result.success && (
            <div className="flex flex-col items-center text-center w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
              <div className="w-full bg-[#0D172E] border-2 border-coral/60 rounded-[3rem] p-7 shadow-[0_0_60px_rgba(255,111,94,0.3)] relative overflow-hidden">
                <div className="w-20 h-20 rounded-full bg-coral/20 border-2 border-coral text-coral flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                  !
                </div>
                <h3 className="font-display text-2xl font-black text-coral mb-2">
                  Presensi Ditolak
                </h3>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  {result.message || "Kartu RFID tidak dikenali atau belum terdaftar."}
                </p>
                <span className="text-[11px] text-white/40 block">
                  Silakan hubungi wali kelas atau admin JACOS.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT PANE: Modern Real-Time Attendance Board */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 xl:col-span-7 p-6 lg:p-8 flex flex-col h-full bg-[#081020]/60 backdrop-blur-md">
          {/* Section Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg lg:text-xl font-black text-white">
                  Daftar Presensi Hari Ini
                </h3>
                <span className="bg-sky/20 text-sky px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {attendanceList.length} Siswa
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Monitoring real-time kehadiran kelas {classData.name}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === "ALL" ? "bg-sky text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Semua ({attendanceList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("PRESENT")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === "PRESENT" ? "bg-sky text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Di Kelas ({attendanceList.length - checkedOutCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CHECKOUT")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === "CHECKOUT" ? "bg-sky text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Pulang ({checkedOutCount})
              </button>
            </div>
          </div>

          {/* Instant Search Bar */}
          <div className="my-3.5 relative">
            <Search size={16} className="absolute left-3.5 top-3 text-white/30" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau NIS..."
              className="h-10 pl-10 rounded-xl bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-white/30 focus:border-sky/50"
            />
          </div>

          {/* Cards Grid List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[600px] custom-scrollbar">
            {filteredList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center mb-3 text-xl">
                  📭
                </div>
                <p className="font-bold text-sm text-white/80">Belum Ada Data Presensi</p>
                <p className="text-xs text-white/40 mt-1 max-w-xs">
                  {searchQuery
                    ? "Tidak ditemukan siswa dengan kata kunci tersebut."
                    : "Siswa yang menempelkan kartu RFID akan langsung tampil otomatis di daftar ini."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredList.map((att, idx) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-[#0D172E]/70 hover:bg-[#111F3D] border border-white/5 hover:border-sky/30 transition-all shadow-sm flex flex-col justify-between gap-2.5 animate-in slide-in-from-right-2 fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Top Student Bio */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {att.students?.profile_picture ? (
                          <img
                            src={att.students.profile_picture}
                            className="w-11 h-11 rounded-xl object-cover border border-white/20"
                            alt=""
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky/40 to-purple-600/40 border border-white/10 text-white font-display text-base font-bold flex items-center justify-center uppercase shadow-inner">
                            {att.students?.full_name?.charAt(0) || "S"}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0D172E] ${
                            att.check_out_time ? "bg-coral" : "bg-leaf"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">
                          {att.students?.full_name}
                        </h4>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          NIS: {att.students?.nis || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Time Badges */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5 text-[10px]">
                      <div className="bg-leaf/10 border border-leaf/20 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span className="text-leaf-400 font-bold">Masuk</span>
                        <span className="font-mono text-white font-bold">
                          {att.check_in_time ? att.check_in_time.substring(0, 5) : "-"}
                        </span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-lg flex items-center justify-between ${
                          att.check_out_time
                            ? "bg-coral/10 border border-coral/20 text-coral"
                            : "bg-white/5 border border-white/5 text-white/30"
                        }`}
                      >
                        <span className="font-bold">Pulang</span>
                        <span className="font-mono font-bold">
                          {att.check_out_time ? att.check_out_time.substring(0, 5) : "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
