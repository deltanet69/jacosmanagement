"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Megaphone,
  CheckCircle2,
  Clock,
  Car,
  UserCheck,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  getPickupQueue,
  confirmPickup,
  callPickupStudent,
} from "../../actions";
import { Button } from "@/components/ui/button";
import PhoneQRScanner from "@/components/pickup/phone-qr-scanner";

export default function SecurityScannerPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const data = await getPickupQueue();
      setQueue(data.filter((q) => q.status === "WAITING" || q.status === "CALLED"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleCall = async (queueId: string) => {
    await callPickupStudent(queueId);
    setQueue((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, status: "CALLED" } : q))
    );
  };

  const handleConfirm = async (queueId: string, studentId: string) => {
    await confirmPickup(queueId, studentId);
    fetchQueue();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-3 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <Link href="/management/absensi/penjemputan">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-ink border-ink/10 text-ink-400 hover:text-sky transition shadow-sm"
            >
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
                Scan Penjemputan HP
              </h1>
              <span className="bg-sky-50 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                Staff / Security
              </span>
            </div>
            <p className="text-xs text-ink-400 dark:text-white/60 mt-0.5">
              Scan barcode/QR orang tua menggunakan kamera HP saat tiba di gerbang
            </p>
          </div>
        </div>

        {/* Live Queue Counter Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-ink px-4 py-2 rounded-2xl border border-ink/10 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-leaf animate-ping" />
          <span className="text-xs font-bold text-ink dark:text-white">
            {queue.length} Siswa Menunggu
          </span>
        </div>
      </div>

      {/* Main Grid: Left Scanner, Right Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SCANNER WORKSTATION (Mobile Camera) */}
        <div className="lg:col-span-6 xl:col-span-5">
          <PhoneQRScanner
            onQueueUpdated={fetchQueue}
            isStandalonePage={true}
          />
        </div>

        {/* LIVE QUEUE & QUICK ACTIONS */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <div className="bg-white dark:bg-ink rounded-[2rem] p-5 sm:p-6 border border-ink/10 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-ink/5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky flex items-center justify-center font-bold">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-ink dark:text-white">
                    Antrian Siswa Menunggu
                  </h3>
                  <p className="text-xs text-ink-400 dark:text-white/60">
                    Daftar siswa yang sudah discan oleh security
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchQueue}
                className="text-xs font-bold text-sky hover:bg-sky-50 rounded-xl h-8 gap-1.5"
              >
                <RefreshCw size={13} /> Refresh
              </Button>
            </div>

            {/* Queue List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-ink-300 animate-pulse">
                Memuat data antrian penjemputan...
              </div>
            ) : queue.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-cloud dark:bg-white/5 rounded-2xl border border-dashed border-ink/10">
                <div className="w-12 h-12 rounded-2xl bg-leaf-50 text-leaf flex items-center justify-center mb-2.5">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-sm text-ink dark:text-white">
                  Semua Siswa Sudah Dijemput
                </p>
                <p className="text-xs text-ink-400 dark:text-white/60 mt-0.5 max-w-xs">
                  Belum ada antrian penjemputan aktif saat ini. Arahkan kamera HP ke QR orang tua untuk memulai.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.status === "CALLED"
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm"
                        : "bg-cloud dark:bg-white/5 border-ink/5 hover:border-sky/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky text-white font-display text-base font-bold flex items-center justify-center shadow-md shadow-sky/20 uppercase shrink-0">
                          {item.students?.full_name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display font-bold text-sm text-ink dark:text-white">
                              {item.students?.full_name}
                            </p>
                            {item.status === "CALLED" ? (
                              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                Dipanggil
                              </span>
                            ) : (
                              <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                                Menunggu
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-400 dark:text-white/60 mt-0.5">
                            {item.className} • Penjemput:{" "}
                            <span className="font-semibold text-ink dark:text-white">
                              {item.picked_by_name || "Orang Tua"}
                            </span>{" "}
                            ({item.picked_by_relation || "Wali"})
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCall(item.id)}
                          className={`h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs ${
                            item.status === "CALLED"
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-sky hover:bg-sky-600 text-white"
                          }`}
                        >
                          <Megaphone size={14} />
                          {item.status === "CALLED" ? "Panggil Ulang" : "Panggil"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleConfirm(item.id, item.student_id)}
                          className="h-9 px-3.5 rounded-xl bg-leaf hover:bg-leaf-600 text-white text-xs font-bold gap-1.5 shadow-xs"
                        >
                          <UserCheck size={14} /> Selesai
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
