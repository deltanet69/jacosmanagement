"use client";

import { useState, useRef, useEffect } from "react";
import { processRfidScan } from "@/app/management/absensi/actions";
import { Input } from "@/components/ui/input";

export default function RfidScannerPage() {
  const [rfid, setRfid] = useState("");
  const [result, setResult] = useState<{success: boolean, message: string, student?: any, alreadyScanned?: boolean} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on input to act as a kiosk
  useEffect(() => {
    inputRef.current?.focus();
    const focusInterval = setInterval(() => {
      inputRef.current?.focus();
    }, 2000);
    return () => clearInterval(focusInterval);
  }, []);

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Clear result after 3 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfid.trim()) return;

    const res = await processRfidScan(rfid.trim());
    setResult(res);
    setRfid("");
  };

  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-ink relative overflow-hidden flex flex-col items-center justify-center px-6 py-10 text-white">
      <div className="absolute inset-0 star-texture opacity-[0.15]"></div>

      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-sky flex items-center justify-center font-display text-white text-xl font-bold">J</div>
        <span className="font-display font-bold">JACOS · Gate 01</span>
      </div>
      <div className="absolute top-8 right-8 text-right">
        <p className="font-mono text-xl font-bold">{formattedTime}</p>
        <p className="text-xs text-white/50">{formattedDate}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Input 
          ref={inputRef}
          type="text" 
          value={rfid}
          onChange={(e) => setRfid(e.target.value)}
          className="opacity-0 absolute h-0 w-0 pointer-events-none" 
          autoComplete="off"
        />
      </form>

      {!result && (
        <div className="flex flex-col items-center text-center relative z-10 animate-in fade-in duration-300">
          <div className="relative w-52 h-52 flex items-center justify-center mb-10">
            <div className="pulse-ring absolute inset-0 rounded-full border-2 border-sky/50"></div>
            <div className="pulse-ring-delay absolute inset-0 rounded-full border-2 border-sky/50"></div>
            <div className="w-36 h-36 rounded-full bg-sky/10 border-2 border-sky flex items-center justify-center text-6xl">💳</div>
          </div>
          <h1 className="font-display text-3xl mb-3">Tempelkan Kartu RFID</h1>
          <p className="text-white/50 max-w-xs">Dekatkan kartu siswa ke area pembaca untuk mencatat kehadiran hari ini.</p>
        </div>
      )}

      {result && result.success && (
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="pop-in w-36 h-36 rounded-full bg-leaf flex items-center justify-center text-6xl mb-8 shadow-2xl shadow-leaf/30 text-white">
            ✓
          </div>
          <div className="pop-in bg-white text-ink rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            {result.student?.profile_picture ? (
              <img src={result.student.profile_picture} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-sky-50" alt="Avatar" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sky-50 mx-auto mb-4 flex items-center justify-center text-3xl font-display text-sky">
                {result.student?.full_name?.substring(0, 1).toUpperCase()}
              </div>
            )}
            <p className="font-display text-2xl mb-1 text-ink">
              {result.alreadyScanned ? 'Sampai Jumpa' : 'Selamat Pagi'}, {result.student?.full_name?.split(' ')[0]}! 👋
            </p>
            <p className="text-ink-400 text-sm mb-5">NIS {result.student?.nis || '-'}</p>
            <div className="flex items-center justify-center gap-2 bg-leaf-50 text-leaf-600 font-bold text-sm px-4 py-2.5 rounded-full mx-auto w-fit">
              <span>{result.alreadyScanned ? 'Absen Pulang' : 'Absen Masuk'}</span> · <span className="font-mono">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-8 pop-in">Notifikasi terkirim ke orang tua secara otomatis 📲</p>
        </div>
      )}

      {result && !result.success && (
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="pop-in w-36 h-36 rounded-full bg-coral flex items-center justify-center text-6xl mb-8 shadow-2xl shadow-coral/30 text-white font-bold">
            !
          </div>
          <div className="pop-in bg-white text-ink rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-coral mb-2">Akses Ditolak</h2>
            <p className="text-ink-400 font-medium">{result.message}</p>
            <p className="text-xs text-ink-300 mt-4">Silakan hubungi tata usaha atau security.</p>
          </div>
        </div>
      )}
    </div>
  );
}
