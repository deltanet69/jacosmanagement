"use client";

import { useState, useRef, useEffect } from "react";
import { processRfidScan } from "@/app/management/absensi/actions";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function AbsenClientPage({ classData, initialAttendance }: { classData: any, initialAttendance: any[] }) {
  const router = useRouter();
  const [rfid, setRfid] = useState("");
  const [result, setResult] = useState<{
    success: boolean, 
    message: string, 
    student?: any, 
    alreadyScanned?: boolean,
    isCheckOut?: boolean
  } | null>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // We keep a local state of attendance for instant UI updates, but also sync with server via router.refresh()
  const [attendanceList, setAttendanceList] = useState(initialAttendance);

  useEffect(() => {
    // Whenever initialAttendance changes (e.g. from router.refresh()), update local state
    setAttendanceList(initialAttendance);
  }, [initialAttendance]);

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
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfid.trim()) return;

    const currentRfid = rfid.trim();
    setRfid(""); // Clear input immediately for next scan

    const res = await processRfidScan(currentRfid, classData.id);
    setResult(res);

    if (res.success && res.student) {
      // Optimistic UI update
      setAttendanceList((prev) => {
        const existingIdx = prev.findIndex(a => a.students?.id === res.student.id);
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (existingIdx >= 0) {
          // Update check_out_time if it's a check-out
          if (res.isCheckOut) {
            const updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], check_out_time: timeStr };
            return updated;
          }
          return prev;
        } else {
          // New check-in
          const newEntry = {
            id: 'temp-' + Date.now(),
            check_in_time: timeStr,
            check_out_time: null,
            students: res.student
          };
          return [newEntry, ...prev];
        }
      });
      
      // Sync with server
      router.refresh();
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-ink flex flex-col lg:flex-row overflow-hidden text-white relative">
      {/* Background Texture */}
      <div className="absolute inset-0 star-texture opacity-[0.10] pointer-events-none"></div>

      {/* LEFT PANE: Scanner (Kiosk Mode) */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky flex items-center justify-center font-display text-white text-xl font-bold shadow-lg shadow-sky/20">
            J
          </div>
          <span className="font-display font-bold text-lg tracking-wide">JACOS Management App</span>
        </div>
        
        <div className="absolute top-8 right-8 text-right hidden lg:block">
          <p className="font-mono text-2xl font-bold tracking-tight">{formattedTime}</p>
          <p className="text-sm text-white/50">{formattedDate}</p>
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
            <div className="bg-white/5 text-white/80 px-5 py-2 rounded-full border border-white/10 mb-8 font-bold text-sm tracking-widest uppercase">
              Kelas {classData.name}
            </div>
            
            <div className="relative w-56 h-56 flex items-center justify-center mb-10">
              <div className="pulse-ring absolute inset-0 rounded-full border-2 border-sky/40"></div>
              <div className="pulse-ring-delay absolute inset-0 rounded-full border-2 border-sky/40"></div>
              <div className="w-40 h-40 rounded-full bg-sky/10 border-2 border-sky flex items-center justify-center text-7xl shadow-xl shadow-sky/20">
                💳
              </div>
            </div>
            <h1 className="font-display text-4xl mb-4 font-bold tracking-tight">Tempelkan Kartu RFID</h1>
            <p className="text-white/50 text-lg max-w-sm">Dekatkan kartu identitas ke area pembaca untuk mencatat kehadiran.</p>
          </div>
        )}

        {result && result.success && (
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="pop-in w-40 h-40 rounded-full bg-leaf flex items-center justify-center text-7xl mb-8 shadow-2xl shadow-leaf/40 text-white">
              ✓
            </div>
            <div className="pop-in bg-white text-ink rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-leaf"></div>
              
              {result.student?.profile_picture ? (
                <img src={result.student.profile_picture} className="w-24 h-24 rounded-full object-cover mx-auto mb-5 border-4 border-white shadow-lg" alt="Avatar" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-sky-50 mx-auto mb-5 flex items-center justify-center text-4xl font-display text-sky shadow-inner">
                  {result.student?.full_name?.substring(0, 1).toUpperCase()}
                </div>
              )}
              
              <p className="font-display text-3xl mb-2 text-ink font-extrabold tracking-tight">
                {result.isCheckOut ? 'Sampai Jumpa' : (result.alreadyScanned ? 'Halo Lagi' : 'Selamat Datang')}, 
                <br />
                <span className="text-sky">{result.student?.full_name?.split(' ')[0]}!</span>
              </p>
              
              <p className="text-ink-400 font-medium mb-6">{result.student?.full_name}</p>
              
              <div className={`flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl mx-auto w-fit ${
                result.isCheckOut ? 'bg-coral-50 text-coral-600' : 'bg-leaf-50 text-leaf-600'
              }`}>
                <span>{result.isCheckOut ? 'Absen Pulang' : 'Absen Masuk'}</span> 
                <span className="opacity-50">•</span> 
                <span className="font-mono text-base">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="pop-in w-40 h-40 rounded-full bg-coral flex items-center justify-center text-7xl mb-8 shadow-2xl shadow-coral/40 text-white font-bold">
              !
            </div>
            <div className="pop-in bg-white text-ink rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-coral"></div>
              <h2 className="font-display text-3xl font-extrabold text-coral mb-3">Akses Ditolak</h2>
              <p className="text-ink-500 font-medium text-lg leading-relaxed">{result.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Real-time List */}
      <div className="w-full lg:w-[450px] xl:w-[500px] bg-white/5 backdrop-blur-md flex flex-col relative z-10">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Kehadiran Hari Ini</h2>
            <p className="text-white/50 text-sm">{attendanceList.length} siswa telah absen</p>
          </div>
          <div className="lg:hidden text-right">
            <p className="font-mono text-lg font-bold">{formattedTime}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {attendanceList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-medium">Belum ada siswa yang hadir</p>
            </div>
          ) : (
            attendanceList.map((att, idx) => (
              <div key={att.id} className="bg-white/10 border border-white/5 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-right-4 fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                {att.students?.profile_picture ? (
                  <img src={att.students.profile_picture} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-display text-lg font-bold">
                    {att.students?.full_name?.substring(0, 1).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{att.students?.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-medium">
                    <div className="flex items-center gap-1 text-leaf-400">
                      <span>Masuk:</span>
                      <span className="font-mono">{att.check_in_time ? att.check_in_time.substring(0, 5) : '-'}</span>
                    </div>
                    {att.check_out_time && (
                      <div className="flex items-center gap-1 text-coral-400">
                        <span>Pulang:</span>
                        <span className="font-mono">{att.check_out_time.substring(0, 5)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
