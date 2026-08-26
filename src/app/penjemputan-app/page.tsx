"use client";

import { useEffect, useState } from "react";
import { getPickupQueue } from "@/app/management/absensi/actions";

export default function LobbyDisplayPage() {
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const data = await getPickupQueue();
      const waiting = data
        .filter((q) => q.status === "WAITING" || q.status === "CALLED")
        .sort((a, b) => (b.status === "CALLED" ? 1 : 0) - (a.status === "CALLED" ? 1 : 0));
      const pickedUp = data.filter((q) => q.status === "PICKED_UP").slice(0, 10);
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
    const interval = setInterval(fetchData, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [mounted]);

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("id-ID", { hour12: false })
    : "";
  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-ink text-white relative overflow-hidden">
      <div className="absolute inset-0 star-texture opacity-[0.12]"></div>

      <header className="relative flex items-center justify-between px-12 py-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky flex items-center justify-center font-display text-2xl text-white font-bold">
            J
          </div>
          <div>
            <p className="font-display text-2xl font-bold">JACOS</p>
            <p className="text-white/40 text-sm">Papan Penjemputan Siswa</p>
          </div>
        </div>
        <div className="text-right" suppressHydrationWarning>
          <p className="font-mono text-3xl font-bold" suppressHydrationWarning>
            {mounted && formattedTime ? formattedTime : "--:--:--"}
          </p>
          <p className="text-white/40 text-sm" suppressHydrationWarning>
            {mounted && formattedDate ? formattedDate : "Memuat waktu..."}
          </p>
        </div>
      </header>

      <main className="relative px-12 pb-12">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-gold shimmer shadow-[0_0_15px_rgba(255,215,0,0.5)]"></span>
            <h2 className="font-display text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-white">
              Sedang Dipanggil
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
            <p className="font-bold text-white text-lg tracking-widest">LOKET PENJEMPUTAN 1</p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-4xl bg-white/5 mb-14">
            <p className="text-white/40 text-2xl font-display font-bold">
              Belum ada antrian penjemputan.
            </p>
            <p className="text-white/30 text-base mt-2">Menunggu QR Code dari Orang Tua...</p>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-8 mb-14">
            {/* Main Highlight (First in Queue) */}
            <div className="xl:w-1/2">
              <div className="bg-gradient-to-br from-gold/20 to-sky/20 border-2 border-gold/50 rounded-[3rem] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.15)] animate-pulse-slow pop-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                <div className="relative z-10 flex items-start gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center font-display text-6xl text-white font-extrabold shadow-xl">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-gold uppercase tracking-widest font-bold text-sm mb-2">
                      Mohon Menuju Loket
                    </p>
                    <h3 className="font-display text-5xl font-black text-white mb-2 leading-tight">
                      {queue[0].students?.full_name?.split(" ")[0]}
                    </h3>
                    <p className="text-white/70 text-2xl font-medium mb-6">
                      {queue[0].className ||
                        (queue[0].students?.class_id
                          ? `Kelas ${queue[0].students.class_id}`
                          : "-")}
                    </p>
                    <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                      <span className="text-white/60">Dijemput oleh:</span>
                      <span className="text-white font-bold text-xl">
                        {queue[0].picked_by_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next in Queue */}
            {queue.length > 1 && (
              <div className="xl:w-1/2">
                <h3 className="text-white/40 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  Antrian Selanjutnya{" "}
                  <span className="bg-sky/20 text-sky px-2 py-0.5 rounded-md text-xs">
                    {queue.length - 1}
                  </span>
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {queue.slice(1, 7).map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white/5 border border-white/10 rounded-3xl p-5 slide-in-right"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky/20 text-sky flex items-center justify-center font-display text-lg font-bold">
                            {idx + 2}
                          </div>
                          <div>
                            <p className="font-display text-lg font-bold leading-tight">
                              {q.students?.full_name?.split(" ")[0]}
                            </p>
                            <p className="text-white/40 text-xs mt-0.5">
                              {q.className ||
                                (q.students?.class_id ? `Kelas ${q.students.class_id}` : "-")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                          Estimasi
                        </span>
                        <span className="text-gold font-bold text-sm">{(idx + 2) * 3} Menit</span>
                      </div>
                    </div>
                  ))}
                  {queue.length > 7 && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-center">
                      <p className="text-white/50 font-bold text-lg">+{queue.length - 7} lainnya...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t-2 border-white/10 pt-8 mt-auto">
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-6">
            Baru Saja Dijemput (Selesai)
          </p>
          <div className="flex flex-wrap gap-4">
            {completed.length === 0 ? (
              <span className="text-white/20 text-sm font-medium">—</span>
            ) : (
              completed.map((c) => (
                <div
                  key={c.id}
                  className="bg-leaf/10 border border-leaf/20 px-5 py-2.5 rounded-2xl flex items-center gap-3 slide-in-right"
                >
                  <span className="w-6 h-6 rounded-full bg-leaf text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-white font-bold">{c.students?.full_name?.split(" ")[0]}</span>
                  <span className="text-white/40 text-xs">
                    ({c.className || c.students?.class_id || "-"})
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
