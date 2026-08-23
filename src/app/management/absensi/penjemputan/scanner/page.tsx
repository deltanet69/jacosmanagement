"use client";

import { useState, useRef, useEffect } from "react";
import { getPickupQueue, confirmPickup, addPickupQueue } from "../../actions";
import { Input } from "@/components/ui/input";

export default function SecurityScannerPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [recentScan, setRecentScan] = useState<any | null>(null);
  const [qrCode, setQrCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchQueue = async () => {
    const data = await getPickupQueue();
    setQueue(data.filter(q => q.status === 'WAITING'));
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      inputRef.current?.focus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    let studentId = qrCode.trim();
    let pickedByName = "Orang Tua/Wali";
    let pickedByRelation = "Orang Tua";

    try {
      if (qrCode.trim().startsWith("{")) {
        const parsed = JSON.parse(qrCode.trim());
        if (parsed.studentId) studentId = parsed.studentId;
        if (parsed.picker) pickedByName = parsed.picker;
        if (parsed.role) pickedByRelation = parsed.role;
      } else if (qrCode.trim().startsWith("pickup:")) {
        const parts = qrCode.trim().split(":");
        if (parts[1]) studentId = parts[1];
      }
    } catch (err) {
      console.error("Error parsing QR Code:", err);
    }

    const res = await addPickupQueue(studentId, pickedByName, pickedByRelation);
    
    if (res.success) {
      setRecentScan({ 
        studentId, 
        picker: pickedByName,
        relation: pickedByRelation,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
      });
      setTimeout(() => setRecentScan(null), 5000);
    }
    
    setQrCode("");
    fetchQueue();
  };

  const handleConfirm = async (queueId: string, studentId: string) => {
    await confirmPickup(queueId, studentId);
    fetchQueue();
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Scan QR Penjemputan</h1>
        <p className="text-ink-400 text-sm">Arahkan barcode scanner ke layar HP orang tua.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <div className="bg-ink rounded-4xl p-10 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden">
          <div className="absolute inset-0 star-texture opacity-[0.12]"></div>
          <div className="absolute inset-6 border-2 border-dashed border-white/20 rounded-3xl"></div>
          
          {/* Corner accents */}
          <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-sky rounded-tl-xl"></div>
          <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-sky rounded-tr-xl"></div>
          <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-sky rounded-bl-xl"></div>
          <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-sky rounded-br-xl"></div>
          
          <div className="text-5xl mb-4 relative z-10 animate-bounce">📷</div>
          <p className="text-white/60 text-sm relative z-10 font-medium">Menunggu QR code...</p>

          <form onSubmit={handleScan}>
            <Input 
              ref={inputRef}
              type="text" 
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="opacity-0 absolute h-0 w-0 pointer-events-none" 
              autoComplete="off"
            />
          </form>
        </div>

        {/* Recent Scan */}
        <div className="bg-white rounded-4xl p-6 shadow-sm border border-ink/5">
          <p className="font-display text-xl font-bold mb-4">Baru discan</p>
          
          {recentScan ? (
            <div className="flex items-center gap-3 slide-in-right text-left">
              <div className="w-12 h-12 rounded-full bg-leaf-50 flex items-center justify-center text-lg font-bold text-leaf-600">✓</div>
              <div className="flex-1">
                <p className="font-bold text-ink">Berhasil ditambahkan ke antrian</p>
                <p className="text-xs text-ink-400 font-medium mt-0.5">Discan pada {recentScan.time}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-300 text-center py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cloud flex items-center justify-center text-ink-300">⏳</div>
              <p className="font-medium">Belum ada scan baru</p>
            </div>
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-4xl p-6 shadow-sm border border-ink/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Antrian Penjemputan</h2>
          <span className="text-xs font-bold text-ink-300 bg-cloud px-3 py-1.5 rounded-full">Urut berdasar waktu scan</span>
        </div>
        
        <div className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-sm text-ink-400 font-medium text-center py-10 bg-cloud/50 rounded-2xl border border-dashed border-ink/10">
              Antrian kosong — scan QR untuk memanggil siswa.
            </p>
          ) : (
            queue.map((q, idx) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-cloud rounded-2xl p-4 slide-in-right" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center text-lg font-display font-bold text-white shrink-0 shadow-inner">
                  {q.students?.full_name?.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-base">{q.students?.full_name}</p>
                  <p className="text-xs text-ink-400 font-medium mt-0.5">Kelas {q.students?.class_id || '-'} · dijemput oleh {q.picked_by_name}</p>
                </div>
                
                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-ink-300 uppercase">Waktu Tunggu</p>
                    <p className="text-xs font-bold text-ink">Est. {(idx + 1) * 3} Menit</p>
                  </div>
                  <Button 
                    onClick={() => handleConfirm(q.id, q.student_id)}
                    className="w-full sm:w-auto bg-leaf hover:bg-leaf-600 text-white font-bold rounded-xl shadow-sm border border-leaf-600"
                  >
                    Sudah Dijemput
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
