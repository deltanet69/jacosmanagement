"use client";

import { useEffect, useState } from "react";
import { getPickupQueue } from "@/app/management/absensi/actions";

export default function LobbyDisplayPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    try {
      const data = await getPickupQueue();
      const waiting = data.filter(q => q.status === 'WAITING');
      const pickedUp = data.filter(q => q.status === 'PICKED_UP').slice(0, 10);
      setQueue(waiting);
      setCompleted(pickedUp);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-ink text-white relative overflow-hidden">
      <div className="absolute inset-0 star-texture opacity-[0.12]"></div>

      <header className="relative flex items-center justify-between px-12 py-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky flex items-center justify-center font-display text-2xl text-white font-bold">J</div>
          <div>
            <p className="font-display text-2xl font-bold">JACOS</p>
            <p className="text-white/40 text-sm">Papan Penjemputan Siswa</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold">{formattedTime}</p>
          <p className="text-white/40 text-sm">{formattedDate}</p>
        </div>
      </header>

      <main className="relative px-12 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 rounded-full bg-gold shimmer"></span>
          <h2 className="font-display text-3xl font-bold">Sedang Dipanggil</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-14 min-h-[140px]">
          {queue.length === 0 ? (
            <p className="text-white/30 text-lg col-span-full py-10 text-center font-medium">Belum ada siswa dalam antrian penjemputan.</p>
          ) : (
            queue.map((q) => (
              <div key={q.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 pop-in">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky flex items-center justify-center font-display text-xl font-bold">
                    {q.students?.full_name?.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold">{q.students?.full_name?.split(' ')[0]}</p>
                    <p className="text-white/40 text-sm">Kelas {q.students?.class_id || '-'}</p>
                  </div>
                </div>
                <span className="inline-block bg-gold/20 text-gold text-xs font-bold px-3 py-1 rounded-full">
                  Menunggu dijemput · {new Date(q.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-4">Baru saja dijemput</p>
          <div className="flex flex-wrap gap-3">
            {completed.length === 0 ? (
              <span className="text-white/20 text-sm font-medium">—</span>
            ) : (
              completed.map((c) => (
                <div key={c.id} className="bg-white/5 border border-white/5 px-4 py-2 rounded-full flex items-center gap-2 slide-in-right">
                  <span className="text-leaf font-bold">✓</span>
                  <span className="text-white/70 text-sm font-medium">{c.students?.full_name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
