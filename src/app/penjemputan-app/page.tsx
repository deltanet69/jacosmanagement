"use client";

import { useEffect, useState, useRef } from "react";
import { getPickupQueue } from "@/app/management/absensi/actions";
import {
  Car,
  Megaphone,
  Clock,
  CheckCircle2,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Check,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function announceStudentPickup(studentName: string, className: string) {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `Panggilan penjemputan untuk ananda ${studentName}, ${className}. Mohon menuju loket penjemputan.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    // ignore
  }
}

export default function LobbyDisplayPage() {
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lastCalledIdsRef = useRef<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      const data = await getPickupQueue();
      const waiting = data
        .filter((q) => q.status === "WAITING" || q.status === "CALLED")
        .sort((a, b) => (b.status === "CALLED" ? 1 : 0) - (a.status === "CALLED" ? 1 : 0));
      const pickedUp = data.filter((q) => q.status === "PICKED_UP").slice(0, 12);

      // Auto-voice announcement for newly called students
      if (soundEnabled) {
        waiting.forEach((item) => {
          if (item.status === "CALLED" && !lastCalledIdsRef.current.has(item.id)) {
            lastCalledIdsRef.current.add(item.id);
            const studentName = item.students?.full_name || "Siswa";
            const className = item.className || "";
            announceStudentPickup(studentName, className);
          }
        });
      }

      setQueue(waiting);
      setCompleted(pickedUp);
    } catch (e) {
      console.error("Error fetching lobby queue:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    fetchData();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  useEffect(() => {
    if (!mounted) return;
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [mounted]);

  const formattedTime = mounted && currentTime
    ? currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";
  const formattedDate = mounted && currentTime
    ? currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const calledStudents = queue.filter((q) => q.status === "CALLED");
  const waitingStudents = queue.filter((q) => q.status === "WAITING");

  return (
    <div className="min-h-screen bg-[#060B16] text-white relative overflow-hidden flex flex-col font-sans selection:bg-gold/30">
      {/* Cinematic Studio Glow & Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(232,166,46,0.18),transparent)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom_right,rgba(47,111,237,0.15),transparent)] pointer-events-none" />
      <div className="absolute inset-0 star-texture opacity-[0.07] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. BROADCAST TV HEADER BAR */}
      {/* ========================================================================= */}
      <header className="relative z-20 px-8 lg:px-12 py-5 border-b border-white/10 bg-[#060B16]/85 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Live TV Badge */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold to-yellow-500 flex items-center justify-center font-display text-white text-3xl font-black shadow-[0_0_30px_rgba(232,166,46,0.4)]">
            J
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight text-white">
                JACOS <span className="text-gold font-normal">PICKUP DISPLAY</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-black tracking-wider uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
                LOBBY PENJEMPUTAN
              </span>
            </div>
            <p className="text-xs lg:text-sm text-white/50">
              Papan Informasi Penjemputan Siswa Real-Time • Gerbang Utama
            </p>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="flex flex-col items-center justify-center text-center px-8 py-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
          <div className="flex items-center gap-2.5" suppressHydrationWarning>
            <Clock size={20} className="text-gold animate-pulse" />
            <span className="font-mono text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-100 to-gold">
              {formattedTime}
            </span>
            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
              WIB
            </span>
          </div>
          <p className="text-xs text-white/60 font-medium mt-0.5" suppressHydrationWarning>
            {formattedDate}
          </p>
        </div>

        {/* Right Metric Summary & Sound Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Megaphone size={14} className="animate-bounce" />
              <span>{calledStudents.length} Dipanggil</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-sky/20 border border-sky/30 text-sky-300 text-xs font-bold flex items-center gap-1.5">
              <Users size={14} />
              <span>{waitingStudents.length} Menunggu</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-leaf/20 border border-leaf/30 text-leaf-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>{completed.length} Selesai</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
            title={soundEnabled ? "Suara Panggilan Aktif" : "Suara Panggilan Mute"}
          >
            {soundEnabled ? <Volume2 size={22} className="text-gold" /> : <VolumeX size={22} />}
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN DISPLAY STAGE */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 px-8 lg:px-12 py-8 flex flex-col justify-between gap-8 overflow-y-auto">
        {/* TOP SECTION: CALLED STUDENTS (SPOTLIGHT) */}
        {calledStudents.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gold/30">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-gold animate-ping" />
                <h2 className="font-display text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-white uppercase tracking-tight flex items-center gap-2">
                  <Megaphone size={26} className="text-gold" />
                  SEDANG DIPANGGIL • MOHON MENUJU LOKET
                </h2>
              </div>
              <span className="bg-gold text-ink font-display font-black text-xs lg:text-sm px-4 py-1.5 rounded-full shadow-lg shadow-gold/30 uppercase tracking-wider">
                Loket Penjemputan Gerbang
              </span>
            </div>

            {/* Big Spotlight Cards for Called Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {calledStudents.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-amber-500/20 via-[#131A2E] to-gold/15 border-2 border-gold/80 rounded-[2.5rem] p-7 shadow-[0_0_50px_rgba(232,166,46,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gold/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                  <div className="relative z-10 flex items-start gap-5">
                    {/* Student Avatar */}
                    <div className="relative shrink-0">
                      {item.students?.profile_picture ? (
                        <img
                          src={item.students.profile_picture}
                          className="w-24 h-24 rounded-3xl object-cover border-4 border-gold shadow-2xl"
                          alt={item.students?.full_name}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-gold to-amber-600 text-white flex items-center justify-center font-display text-4xl font-black shadow-2xl border-4 border-white/20 uppercase">
                          {item.students?.full_name?.charAt(0) || "S"}
                        </div>
                      )}
                      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gold text-ink font-display font-black text-sm flex items-center justify-center shadow-md">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-1.5 border border-gold/40">
                        <GraduationCap size={14} />
                        <span>{item.className || "Siswa JACOS"}</span>
                      </div>

                      <h3 className="font-display text-2xl lg:text-3xl font-black text-white truncate tracking-tight">
                        {item.students?.full_name}
                      </h3>

                      <div className="mt-3 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <span className="text-white/50 text-xs">Penjemput:</span>
                        <span className="text-gold font-extrabold text-xs lg:text-sm truncate">
                          {item.picked_by_name || "Orang Tua"} ({item.picked_by_relation || "Wali"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* MIDDLE SECTION: WAITING QUEUE (IF ANY) */}
        {waitingStudents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-sky" />
                <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">
                  Antrian Siswa Selanjutnya ({waitingStudents.length})
                </h3>
              </div>
              <span className="text-xs text-white/50">
                Siswa dalam antrian persiapan penjemputan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {waitingStudents.slice(0, 8).map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-[#0C1426]/80 border border-white/10 hover:border-sky/40 rounded-3xl p-4.5 flex items-center gap-4 transition-all shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky/20 text-sky font-display font-black text-lg flex items-center justify-center shrink-0 border border-sky/30">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-sm lg:text-base text-white truncate">
                      {q.students?.full_name}
                    </h4>
                    <p className="text-xs text-white/50 mt-0.5 truncate">
                      {q.className} • {q.picked_by_name || "Orang Tua"}
                    </p>
                  </div>
                </div>
              ))}
              {waitingStudents.length > 8 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-center text-center">
                  <p className="text-white/60 font-bold text-sm">
                    +{waitingStudents.length - 8} Siswa Lainnya...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE: WHEN NO STUDENTS IN QUEUE */}
        {queue.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 bg-gradient-to-b from-white/[0.02] to-white/[0.04] rounded-[3rem] border-2 border-dashed border-white/10 shadow-2xl">
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <div className="pulse-ring absolute inset-0 rounded-full border-2 border-gold/40" />
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-gold to-yellow-600 flex items-center justify-center text-white shadow-2xl shadow-gold/30">
                <Car size={46} />
              </div>
            </div>

            <h2 className="font-display text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
              Lobby Penjemputan Siaga
            </h2>
            <p className="text-white/60 text-base max-w-md leading-relaxed">
              Belum ada antrian penjemputan aktif saat ini. Orang tua dapat memindai QR Code di Pos Security saat tiba.
            </p>

            <div className="mt-8 flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
              <Radio size={15} className="text-leaf-400 animate-ping" />
              <span>Sistem terhubung &amp; memperbarui otomatis setiap 3 detik</span>
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: RECENTLY COMPLETED TICKER */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-leaf-400" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/50">
              Baru Saja Dijemput (Selesai)
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {completed.length === 0 ? (
              <span className="text-xs text-white/30 italic">
                Belum ada penjemputan yang diselesaikan hari ini.
              </span>
            ) : (
              completed.map((c) => (
                <div
                  key={c.id}
                  className="bg-leaf/10 border border-leaf/25 px-4 py-2 rounded-2xl flex items-center gap-2.5 shrink-0 shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-leaf text-white flex items-center justify-center text-[10px] font-black">
                    ✓
                  </div>
                  <span className="font-bold text-xs text-white">
                    {c.students?.full_name?.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-white/40">
                    ({c.className || "Siswa"})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
