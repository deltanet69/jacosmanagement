"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Search,
  Check,
  Smartphone,
  X,
} from "lucide-react";
import {
  getPickupQueue,
  confirmPickup,
  callPickupStudent,
  addPickupQueue,
  searchStudentsForPickup,
} from "../../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function playBeepSound(type: "success" | "chime" | "error" = "success") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "success" || type === "chime") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    console.log("Audio feedback error:", err);
  }
}

export default function SecurityScannerPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [recentScan, setRecentScan] = useState<any | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualPicker, setManualPicker] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchQueue = async () => {
    const data = await getPickupQueue();
    setQueue(data.filter((q) => q.status === "WAITING" || q.status === "CALLED"));
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isManualSearch) {
      inputRef.current?.focus();
      const interval = setInterval(() => {
        if (!isManualSearch && document.activeElement?.tagName !== "INPUT") {
          inputRef.current?.focus();
        }
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isManualSearch]);

  // Debounce search
  useEffect(() => {
    if (manualQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await searchStudentsForPickup(manualQuery);
        setSearchResults(results);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [manualQuery]);

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
      playBeepSound("success");
      setRecentScan({
        success: true,
        message: res.message,
        picker: pickedByName,
        relation: pickedByRelation,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      });
      fetchQueue();
    } else {
      playBeepSound("error");
      setRecentScan({
        success: false,
        message: res.message || "Gagal memasukkan ke antrian",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      });
    }

    setQrCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleManualAdd = async (student: any) => {
    const res = await addPickupQueue(
      student.id,
      manualPicker || student.authorized_pickup_name || "Orang Tua/Wali",
      "Orang Tua / Wali"
    );

    if (res.success) {
      playBeepSound("success");
      setRecentScan({
        success: true,
        message: `Ananda ${student.full_name} masuk antrian`,
        picker: manualPicker || "Orang Tua",
        relation: "Wali",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      });
      setIsManualSearch(false);
      setManualQuery("");
      setManualPicker("");
      fetchQueue();
    } else {
      playBeepSound("error");
      alert(res.message || "Gagal");
    }
  };

  const handleCall = async (queueId: string) => {
    playBeepSound("chime");
    await callPickupStudent(queueId);
    setQueue((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, status: "CALLED" } : q))
    );
  };

  const handleConfirm = async (queueId: string, studentId: string) => {
    playBeepSound("success");
    await confirmPickup(queueId, studentId);
    fetchQueue();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link href="/management/absensi/penjemputan">
            <Button
              variant="outline"
              className="w-11 h-11 p-0 rounded-2xl bg-white border-ink/10 text-ink-400 hover:text-sky transition shadow-sm"
            >
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              Scanner Pos Penjemputan
            </h1>
            <p className="text-ink-400 text-xs sm:text-sm">
              Workstation Security &amp; Petugas Gerbang Sekolah
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsManualSearch(!isManualSearch)}
          variant="outline"
          className="h-11 px-4 rounded-xl border-ink/15 text-xs font-bold text-ink"
        >
          {isManualSearch ? (
            <>
              <Smartphone size={15} className="mr-1.5" /> Mode Barcode Scanner
            </>
          ) : (
            <>
              <Search size={15} className="mr-1.5" /> Cari Siswa Manual
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scanner Workstation Box */}
        {!isManualSearch ? (
          <div className="bg-ink rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden shadow-xl border-4 border-ink">
            <div className="absolute inset-0 bg-gradient-to-br from-sky/20 to-purple-600/20 opacity-30"></div>
            <div className="absolute inset-6 border-2 border-dashed border-white/20 rounded-3xl"></div>

            {/* Corner accents */}
            <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-sky rounded-tl-xl"></div>
            <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-sky rounded-tr-xl"></div>
            <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-sky rounded-bl-xl"></div>
            <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-sky rounded-br-xl"></div>

            <div className="w-16 h-16 rounded-3xl bg-white/10 text-white flex items-center justify-center mb-4 relative z-10 animate-bounce">
              <QrCode size={34} />
            </div>
            <p className="text-white font-bold text-lg relative z-10">Siap Menerima Scan QR</p>
            <p className="text-white/60 text-xs mt-1 relative z-10 max-w-xs leading-relaxed">
              Arahkan barcode scanner ke layar HP orang tua.
            </p>

            <form onSubmit={handleScan} className="w-full mt-6 relative z-10 max-w-xs">
              <Input
                ref={inputRef}
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Klik di sini jika scanner terputus"
                className="text-center bg-white/15 text-white placeholder:text-white/40 font-mono text-xs py-2.5 rounded-xl border border-white/20 outline-none focus:border-sky focus:bg-white/25"
                autoComplete="off"
              />
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-ink/5 space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">Input Manual Siswa</h3>
            <p className="text-xs text-ink-400">
              Gunakan jika orang tua tidak membawa HP atau QR code tidak terbaca.
            </p>

            <div className="space-y-3">
              <div>
                <Label className="block text-xs font-bold mb-1">Cari Nama / NIS</Label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3 text-ink-300" />
                  <Input
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Ketik minimal 2 huruf..."
                    className="pl-9 h-11 rounded-xl text-xs bg-cloud"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-xs font-bold mb-1">Nama Penjemput (Opsional)</Label>
                <Input
                  value={manualPicker}
                  onChange={(e) => setManualPicker(e.target.value)}
                  placeholder="Nama orang tua/supir..."
                  className="h-11 rounded-xl text-xs bg-cloud"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-ink/10 p-2 rounded-2xl">
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleManualAdd(s)}
                      className="p-3 rounded-xl bg-cloud/50 hover:bg-sky-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <p className="font-bold text-xs text-ink">{s.full_name}</p>
                        <p className="text-[11px] text-ink-400">
                          {s.className} • NIS: {s.nis || "-"}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-sky">Pilih + Jemput</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Scan Card Feedback */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-ink/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink">Hasil Scan Terakhir</h3>
              {recentScan && (
                <span className="text-xs font-mono font-bold text-ink-400 bg-cloud px-2.5 py-1 rounded-xl">
                  {recentScan.time}
                </span>
              )}
            </div>

            {recentScan ? (
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  recentScan.success
                    ? "bg-leaf-50/70 border-leaf-200 text-leaf-900"
                    : "bg-coral-50/70 border-coral-200 text-coral-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {recentScan.success ? (
                    <CheckCircle2 size={22} className="text-leaf" />
                  ) : (
                    <AlertCircle size={22} className="text-coral" />
                  )}
                  <p className="font-bold text-sm">{recentScan.message}</p>
                </div>

                {recentScan.picker && (
                  <div className="text-xs space-y-1 pt-2 border-t border-leaf-200">
                    <p className="text-ink-400">
                      Penjemput: <strong className="text-ink">{recentScan.picker}</strong>
                    </p>
                    <p className="text-ink-400">
                      Relasi: <strong className="text-purple-700">{recentScan.relation}</strong>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-ink-300 text-xs space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cloud text-ink-300 flex items-center justify-center mx-auto text-lg">
                  ⏳
                </div>
                <p className="font-medium">Belum ada scan baru.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-ink/5 text-xs text-ink-400 flex items-center justify-between">
            <span>Antrian aktif hari ini:</span>
            <span className="font-bold text-sky">{queue.length} Siswa</span>
          </div>
        </div>
      </div>

      {/* Queue List on Workstation */}
      <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-ink/5 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-ink/5">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Daftar Panggilan Siswa</h2>
            <p className="text-xs text-ink-400">Urutan siswa yang sedang menunggu dijemput di lobby</p>
          </div>
          <span className="text-xs font-bold bg-sky-50 text-sky px-3 py-1 rounded-full border border-sky-100">
            {queue.length} Menunggu
          </span>
        </div>

        {queue.length === 0 ? (
          <p className="text-center py-10 text-ink-400 text-xs">
            Antrian kosong — semua siswa sudah selesai dijemput.
          </p>
        ) : (
          <div className="space-y-3">
            {queue.map((q, idx) => {
              const isCalled = q.status === "CALLED";

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    isCalled ? "bg-sky-50/50 border-sky-200" : "bg-cloud/40 border-ink/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center font-display font-black text-sm">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-ink">{q.students?.full_name}</h4>
                        {isCalled && (
                          <span className="text-[10px] font-bold bg-sky text-white px-2 py-0.5 rounded-full">
                            Dipanggil
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">
                        {q.className} • Dijemput oleh: <span className="font-bold text-ink">{q.picked_by_name}</span> ({q.picked_by_relation})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleCall(q.id)}
                      variant="outline"
                      size="sm"
                      className="h-10 px-3.5 rounded-xl text-xs font-bold text-sky border-sky/30 hover:bg-sky-50"
                    >
                      <Volume2 size={14} className="mr-1" /> Panggil
                    </Button>
                    <Button
                      onClick={() => handleConfirm(q.id, q.student_id)}
                      size="sm"
                      className="h-10 px-4 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white text-xs font-bold shadow-sm"
                    >
                      <Check size={14} className="mr-1" /> Selesai
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
