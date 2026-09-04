"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import PhoneQRScanner from "@/components/pickup/phone-qr-scanner";
import {
  Car,
  QrCode,
  Search,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  History,
  TrendingUp,
  Volume2,
  Tv,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPickupQueue,
  getPickupStats,
  getPickupHistory,
  confirmPickup,
  callPickupStudent,
  cancelPickup,
  addPickupQueue,
  searchStudentsForPickup,
  getAllClassesList,
} from "../actions";

// Sound synthesis helper for audio feedback without external audio files
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
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

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
    console.log("Audio not supported or blocked by user gesture:", err);
  }
}

export default function PenjemputanAdminPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORY" | "TV_DISPLAY">("LIVE");

  // Live Queue & Stats State
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    waiting: 0,
    pickedUp: 0,
    cancelled: 0,
    avgWaitTime: "2.5",
    completionRate: 0,
    peakHours: "14:00 - 15:30",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // History Tab States
  const [historyPeriod, setHistoryPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [classList, setClassList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // History Pagination States
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Quick Scanner & Manual Modal States
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerMode, setScannerMode] = useState<"HARDWARE" | "MANUAL">("HARDWARE");
  const [qrInput, setQrInput] = useState("");
  const [recentScanResult, setRecentScanResult] = useState<any | null>(null);

  // Manual Search States
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [manualPickerName, setManualPickerName] = useState("");
  const [manualPickerRelation, setManualPickerRelation] = useState("Orang Tua / Wali");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const hardwareInputRef = useRef<HTMLInputElement>(null);

  // Fetch Live Queue & Stats
  const fetchLiveData = async () => {
    try {
      const [qData, sData] = await Promise.all([getPickupQueue(), getPickupStats()]);
      setQueue(qData || []);
      setStats(sData || stats);
    } catch (err) {
      console.error("Error fetching pickup live data:", err);
    }
  };

  // Fetch History Records
  const fetchHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await getPickupHistory({
        period: historyPeriod,
        classId: selectedClassFilter,
        search: historySearch,
      });
      setHistoryList(records || []);
    } catch (err) {
      console.error("Error fetching pickup history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchLiveData();
    getAllClassesList().then((res) => setClassList(res || []));

    // Polling live queue when tab is active
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchLiveData();
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Update history whenever filters change
  useEffect(() => {
    if (activeTab === "HISTORY") {
      fetchHistoryData();
    }
  }, [activeTab, historyPeriod, selectedClassFilter, historySearch]);

  // Reset history pagination on filter change
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyPeriod, selectedClassFilter, historySearch, historyPageSize]);

  // Focus hardware scanner input when modal is open
  useEffect(() => {
    if (showScannerModal && scannerMode === "HARDWARE") {
      setTimeout(() => hardwareInputRef.current?.focus(), 150);
    }
  }, [showScannerModal, scannerMode]);

  // Manual student search debounce
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

  // Paginated History Data
  const paginatedHistoryList = useMemo(() => {
    const from = (historyCurrentPage - 1) * historyPageSize;
    return historyList.slice(from, from + historyPageSize);
  }, [historyList, historyCurrentPage, historyPageSize]);

  const historyTotalPages = Math.max(1, Math.ceil(historyList.length / historyPageSize));

  // Handle Hardware QR Scan
  const handleProcessScan = async (rawCode: string) => {
    if (!rawCode.trim()) return;

    let cleanId = rawCode.trim();
    if (cleanId.includes("/reg/") || cleanId.includes("/pickup/") || cleanId.includes("id=")) {
      const parts = cleanId.split(/[\/=]/);
      cleanId = parts[parts.length - 1];
    }

    try {
      const res = await addPickupQueue(cleanId, "Orang Tua / Wali", "Orang Tua");
      if (res.success) {
        playBeepSound("success");
        setRecentScanResult({
          success: true,
          message: res.message,
        });
        fetchLiveData();
      } else {
        playBeepSound("error");
        setRecentScanResult({
          success: false,
          message: res.message || "QR Code tidak valid atau belum terdaftar.",
        });
      }
    } catch (err) {
      playBeepSound("error");
      setRecentScanResult({
        success: false,
        message: "Terjadi kesalahan saat memproses scan.",
      });
    }

    setQrInput("");
    setTimeout(() => {
      hardwareInputRef.current?.focus();
    }, 100);
  };

  // Handle Manual Add
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert("Harap pilih siswa dari hasil pencarian.");
      return;
    }

    setIsSubmittingManual(true);
    const res = await addPickupQueue(
      selectedStudent.id,
      manualPickerName || "Orang Tua/Wali",
      manualPickerRelation || "Orang Tua"
    );
    setIsSubmittingManual(false);

    if (res.success) {
      playBeepSound("success");
      alert(res.message);
      setSelectedStudent(null);
      setManualQuery("");
      setManualPickerName("");
      setShowScannerModal(false);
      fetchLiveData();
    } else {
      playBeepSound("error");
      alert(res.message || "Gagal menambahkan antrian.");
    }
  };

  // Handle Call Student (Broadcast to TV)
  const handleCallStudent = async (queueId: string) => {
    playBeepSound("chime");
    await callPickupStudent(queueId);
    setQueue((prev) =>
      prev.map((item) => (item.id === queueId ? { ...item, status: "CALLED" } : item))
    );
  };

  // Handle Confirm Pickup Finished
  const handleConfirmFinish = async (queueId: string, studentId: string) => {
    playBeepSound("success");
    await confirmPickup(queueId, studentId);
    fetchLiveData();
  };

  // Handle Cancel Queue
  const handleCancelQueue = async (queueId: string) => {
    if (confirm("Apakah Anda yakin ingin membatalkan antrian siswa ini?")) {
      await cancelPickup(queueId);
      fetchLiveData();
    }
  };

  // Export History to CSV
  const handleExportCSV = () => {
    if (historyList.length === 0) {
      alert("Tidak ada data riwayat untuk diexport.");
      return;
    }

    const headers = [
      "Tanggal",
      "Jam Scan",
      "Jam Selesai",
      "Durasi (Menit)",
      "Nama Siswa",
      "NIS",
      "Kelas",
      "Nama Penjemput",
      "Relasi",
      "Status",
    ];

    const rows = historyList.map((r) => [
      r.pickup_date || "-",
      r.created_at
        ? new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
      r.picked_up_at
        ? new Date(r.picked_up_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
      r.waitMinutes !== null && r.waitMinutes !== undefined ? `${r.waitMinutes} Menit` : "-",
      `"${r.students?.full_name || "-"}"`,
      r.students?.nis || "-",
      `"${r.className || "-"}"`,
      `"${r.picked_by_name || "-"}"`,
      `"${r.picked_by_relation || "-"}"`,
      r.status === "PICKED_UP" ? "Selesai" : r.status === "CANCELLED" ? "Dibatalkan" : "Menunggu",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Penjemputan_JACOS_${historyPeriod}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const waitingQueue = queue.filter((q) => q.status === "WAITING" || q.status === "CALLED");
  const completedToday = queue.filter((q) => q.status === "PICKED_UP");

  return (
    <div className="space-y-6 sm:space-y-7 pb-16 w-full">
      {/* ========================================================================= */}
      {/* MODAL SCANNER & MANUAL PICKUP */}
      {/* ========================================================================= */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full max-h-[92vh] overflow-y-auto">
            <PhoneQRScanner
              onQueueUpdated={fetchLiveData}
              onClose={() => setShowScannerModal(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              Penjemputan Siswa
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-leaf-50 text-leaf-700 text-xs font-bold border border-leaf-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse"></span> Live Sync
            </span>
          </div>
          <p className="text-ink-400 text-xs sm:text-sm mt-1">
            Pantau dan kelola alur penjemputan siswa secara real-time, tertib, dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            onClick={() => {
              setRecentScanResult(null);
              setShowScannerModal(true);
            }}
            className="h-11 px-4 rounded-xl sm:rounded-2xl bg-sky hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky/20 transition-transform active:scale-[0.98] justify-center"
          >
            <QrCode size={16} className="mr-1.5" /> Buka Scanner Cepat
          </Button>

          <Link href="/penjemputan-app" target="_blank" className="w-full">
            <Button
              variant="outline"
              className="w-full h-11 px-4 rounded-xl sm:rounded-2xl bg-white border-ink/15 text-ink font-bold text-xs hover:bg-cloud shadow-2xs justify-center"
            >
              <Tv size={15} className="mr-1.5 text-purple-600" /> Buka TV Lobby
              <ExternalLink size={12} className="ml-1 text-ink-300" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS RECAP CARDS (4 GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* Stat 1: Total Dijemput Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-ink/5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-ink-400 uppercase tracking-wider">Total Jemput</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Car size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-ink">{stats.total}</p>
            <span className="text-[11px] font-bold text-ink-400">Siswa</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-purple-600 truncate">Puncak: {stats.peakHours}</p>
        </div>

        {/* Stat 2: Sedang Antri */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-ink/5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-gold-600 uppercase tracking-wider">Sedang Antri</span>
            <div className="w-8 h-8 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gold">{waitingQueue.length}</p>
            <span className="text-[11px] font-bold text-gold-700">Di lobby</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-ink-400 truncate">
            {waitingQueue.filter((q) => q.status === "CALLED").length} dipanggil di TV
          </p>
        </div>

        {/* Stat 3: Selesai Dijemput */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-ink/5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-leaf-600 uppercase tracking-wider">Selesai</span>
            <div className="w-8 h-8 rounded-xl bg-leaf-50 text-leaf flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-leaf">{completedToday.length}</p>
            <span className="text-[11px] font-bold text-leaf-700">({stats.completionRate}%)</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-leaf-600 truncate">Absensi tercatat</p>
        </div>

        {/* Stat 4: Rata-rata Waktu Tunggu */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-ink/5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-sky-700 uppercase tracking-wider">Rata-Rata Tunggu</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-sky">{stats.avgWaitTime}</p>
            <span className="text-[11px] font-bold text-sky-700">Mnt / Siswa</span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-leaf-600 truncate">✓ Standar tertib</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RESPONSIVE SUB-SECTION TAB CONTROLS (NO OVERFLOW ON MOBILE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-white rounded-2xl border border-ink/10 shadow-2xs">
        <button
          onClick={() => setActiveTab("LIVE")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "LIVE"
              ? "bg-sky text-white shadow-md shadow-sky/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Car size={15} />
            <span>1. Papan Antrian Live</span>
          </div>
          {waitingQueue.length > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "LIVE" ? "bg-white/20 text-white" : "bg-sky text-white"
              }`}
            >
              {waitingQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "HISTORY"
              ? "bg-leaf-600 text-white shadow-md shadow-leaf/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={15} />
            <span>2. Riwayat &amp; Rekapitulasi</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "HISTORY" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
            }`}
          >
            {historyList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("TV_DISPLAY")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "TV_DISPLAY"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Tv size={15} />
            <span>3. Layar TV Lobby &amp; SOP</span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE ANTRIAN PENJEMPUTAN */}
      {/* ========================================================================= */}
      {activeTab === "LIVE" && (
        <div className="space-y-5 sm:space-y-6">
          {/* Quick Hardware Scanner Status Bar */}
          <div className="bg-gradient-to-r from-sky-50 via-cloud to-sky-50/50 p-4 rounded-2xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky text-white flex items-center justify-center shrink-0 shadow-sm">
                <QrCode size={18} />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-ink">Scanner Hardware Aktif</p>
                <p className="text-[11px] text-ink-400">
                  Gunakan Barcode Scanner gerbang atau klik tombol untuk input manual.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => {
                  setRecentScanResult(null);
                  setShowScannerModal(true);
                }}
                className="h-9 px-3.5 rounded-xl bg-white border border-sky/20 text-sky hover:bg-sky-50 font-bold text-xs shadow-2xs"
              >
                <Plus size={14} className="mr-1" /> Input / Scan Siswa
              </Button>
            </div>
          </div>

          {/* Active Queue List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Antrian Saat Ini</h3>
                <span className="text-[11px] font-bold bg-cloud text-ink-400 px-2.5 py-0.5 rounded-full border border-ink/5">
                  Urutan Masuk
                </span>
              </div>
              <p className="text-xs text-ink-400 font-medium">
                {waitingQueue.length} Siswa Menunggu
              </p>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-ink/5 shadow-2xs space-y-2.5">
                <div className="w-14 h-14 rounded-2xl bg-leaf-50 text-leaf flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="font-display text-base sm:text-lg font-bold text-ink">Tidak Ada Antrian Aktif</h4>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  Semua siswa telah dijemput atau belum ada orang tua yang men-scan QR penjemputan.
                </p>
                <Button
                  onClick={() => setShowScannerModal(true)}
                  variant="outline"
                  className="rounded-xl font-bold text-xs mt-1.5 h-9"
                >
                  <Plus size={13} className="mr-1" /> Mulai Scan Penjemputan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                {waitingQueue.map((item, idx) => {
                  const isCalled = item.status === "CALLED";
                  const scanTime = item.created_at
                    ? new Date(item.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between ${
                        isCalled
                          ? "border-sky ring-2 ring-sky/20 bg-gradient-to-b from-sky-50/40 to-white"
                          : "border-ink/5 hover:border-ink/15"
                      }`}
                    >
                      {/* Top Row: Queue Number & Badge */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center font-display font-black text-xs shadow-sm">
                              #{idx + 1}
                            </span>
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isCalled
                                  ? "bg-sky-100 text-sky-800 border-sky-200 animate-pulse"
                                  : "bg-gold-50 text-gold-700 border-gold-200"
                              }`}
                            >
                              {isCalled ? "📢 Dipanggil di TV" : "⏳ Menunggu"}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono font-bold text-ink-400 bg-cloud px-2 py-0.5 rounded-lg">
                            {scanTime}
                          </span>
                        </div>

                        {/* Student Details */}
                        <div className="flex items-start gap-3 pb-3 border-b border-ink/5">
                          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky border border-sky-100 flex items-center justify-center font-display font-black text-base shrink-0">
                            {item.students?.full_name?.substring(0, 2).toUpperCase() || "SW"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-sm sm:text-base text-ink truncate">
                              {item.students?.full_name}
                            </h4>
                            <p className="text-xs font-semibold text-sky-700 mt-0.5">{item.className}</p>
                            <p className="text-[11px] text-ink-400 font-mono mt-0.5">
                              NIS: {item.students?.nis || "-"}
                            </p>
                          </div>
                        </div>

                        {/* Picker Information */}
                        <div className="py-2.5 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-ink-400 text-[11px]">Penjemput:</span>
                            <span className="font-bold text-ink text-xs">{item.picked_by_name || "Orang Tua"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-ink-400 text-[11px]">Hubungan:</span>
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[10px]">
                              {item.picked_by_relation || "Orang Tua"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-2.5 border-t border-ink/5 flex items-center gap-2">
                        <Button
                          onClick={() => handleCallStudent(item.id)}
                          variant="outline"
                          size="sm"
                          className={`flex-1 h-9 rounded-xl text-xs font-bold border-sky/30 text-sky hover:bg-sky-50 ${
                            isCalled ? "bg-sky-50" : ""
                          }`}
                        >
                          <Volume2 size={13} className="mr-1" />
                          {isCalled ? "Panggil Ulang" : "Panggil ke TV"}
                        </Button>

                        <Button
                          onClick={() => handleConfirmFinish(item.id, item.student_id)}
                          size="sm"
                          className="flex-1 h-9 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white text-xs font-bold shadow-2xs"
                        >
                          <Check size={13} className="mr-1" /> Selesai
                        </Button>

                        <button
                          onClick={() => handleCancelQueue(item.id)}
                          className="w-9 h-9 rounded-xl bg-cloud hover:bg-coral-50 hover:text-coral text-ink-300 flex items-center justify-center transition shrink-0"
                          title="Batalkan Antrian"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT & REKAPITULASI (HARIAN / MINGGUAN / BULANAN) */}
      {/* ========================================================================= */}
      {activeTab === "HISTORY" && (
        <div className="space-y-5 sm:space-y-6">
          {/* Filter & Export Toolbar */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-ink/5 shadow-2xs space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Period Selector Tabs */}
              <div className="grid grid-cols-3 bg-cloud rounded-xl p-1 border border-ink/5 w-full sm:w-fit">
                <button
                  onClick={() => setHistoryPeriod("DAILY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    historyPeriod === "DAILY" ? "bg-white text-ink shadow-2xs" : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setHistoryPeriod("WEEKLY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    historyPeriod === "WEEKLY" ? "bg-white text-ink shadow-2xs" : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setHistoryPeriod("MONTHLY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    historyPeriod === "MONTHLY" ? "bg-white text-ink shadow-2xs" : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Bulanan
                </button>
              </div>

              {/* Action: Export CSV */}
              <Button
                onClick={handleExportCSV}
                className="h-10 px-4 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs shadow-2xs w-full sm:w-auto justify-center"
              >
                <FileSpreadsheet size={14} className="mr-1.5" /> Export Rekapitulasi (CSV)
              </Button>
            </div>

            {/* Search & Class Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-ink/5">
              <div className="sm:col-span-2 relative">
                <Search size={15} className="absolute left-3.5 top-3 text-ink-300" />
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari nama siswa, NIS, atau penjemput..."
                  className="pl-9 h-10 rounded-xl bg-cloud border-ink/10 text-xs"
                />
              </div>

              <div>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-cloud border border-ink/10 text-xs font-bold text-ink outline-none"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || `Kelas ${c.grade}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* History List Content */}
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="py-16 text-center text-ink-300 font-medium bg-white rounded-3xl border border-ink/5">
                <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Memuat riwayat penjemputan...
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-16 text-center text-ink-400 text-xs bg-white rounded-3xl border border-ink/5 p-6">
                Tidak ada data riwayat penjemputan untuk filter ini.
              </div>
            ) : (
              <div className="space-y-4">
                {/* ========================================================= */}
                {/* 2A. MOBILE VIEW: HISTORY CARDS LIST */}
                {/* ========================================================= */}
                <div className="space-y-3 md:hidden">
                  {paginatedHistoryList.map((row) => {
                    const isPickedUp = row.status === "PICKED_UP";
                    const isCancelled = row.status === "CANCELLED";

                    return (
                      <div
                        key={row.id}
                        className="p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm text-ink leading-tight">{row.students?.full_name || "-"}</p>
                            <p className="text-[11px] text-ink-400 font-mono mt-0.5">NIS: {row.students?.nis || "-"}</p>
                          </div>
                          <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px] shrink-0">
                            {row.className || "-"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-ink-400 py-1 border-y border-ink/5">
                          <span>
                            Penjemput: <strong className="text-ink">{row.picked_by_name || "-"}</strong>
                          </span>
                          <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md text-[10px]">
                            {row.picked_by_relation || "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="text-[11px] text-ink-400">
                            <span>{row.pickup_date || "-"}</span>
                            {row.waitMinutes !== null && row.waitMinutes !== undefined && (
                              <span className="font-bold text-ink ml-1.5 bg-cloud px-1.5 py-0.5 rounded text-[10px]">
                                ⏱ {row.waitMinutes} mnt
                              </span>
                            )}
                          </div>

                          {isPickedUp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-leaf-700 bg-leaf-50 px-2.5 py-0.5 rounded-full border border-leaf-200">
                              ✓ Selesai
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-coral-600 bg-coral-50 px-2.5 py-0.5 rounded-full border border-coral-200">
                              Dibatalkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
                              Menunggu
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ========================================================= */}
                {/* 2B. DESKTOP VIEW: FULL HISTORY DATA TABLE */}
                {/* ========================================================= */}
                <div className="hidden md:block bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
                  <div className="p-5 pb-3.5 border-b border-ink/5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-ink">Catatan Riwayat Penjemputan</h3>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Menampilkan {historyList.length} catatan penjemputan {historyPeriod.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cloud text-ink-400 uppercase tracking-wider font-bold text-[10px] border-b border-ink/5">
                        <tr>
                          <th className="py-3.5 px-6">Tanggal &amp; Waktu</th>
                          <th className="py-3.5 px-6">Nama Siswa</th>
                          <th className="py-3.5 px-6">Kelas</th>
                          <th className="py-3.5 px-6">Penjemput &amp; Relasi</th>
                          <th className="py-3.5 px-6 text-center">Durasi Tunggu</th>
                          <th className="py-3.5 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/5 font-medium text-ink">
                        {paginatedHistoryList.map((row) => (
                          <tr key={row.id} className="hover:bg-cloud/50 transition">
                            <td className="py-4 px-6">
                              <p className="font-bold text-ink">{row.pickup_date || "-"}</p>
                              <p className="text-[11px] text-ink-400 font-mono mt-0.5">
                                Scan:{" "}
                                {row.created_at
                                  ? new Date(row.created_at).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                                {row.picked_up_at && (
                                  <span>
                                    {" "}• Selesai:{" "}
                                    {new Date(row.picked_up_at).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </p>
                            </td>

                            <td className="py-4 px-6">
                              <p className="font-bold text-ink text-sm">{row.students?.full_name || "-"}</p>
                              <p className="text-[11px] text-ink-400 font-mono">NIS: {row.students?.nis || "-"}</p>
                            </td>

                            <td className="py-4 px-6">
                              <span className="font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                                {row.className || "-"}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <p className="font-bold text-ink">{row.picked_by_name || "-"}</p>
                              <p className="text-[11px] text-purple-700 font-semibold">{row.picked_by_relation || "-"}</p>
                            </td>

                            <td className="py-4 px-6 text-center">
                              {row.waitMinutes !== null && row.waitMinutes !== undefined ? (
                                <span className="font-bold font-mono text-ink bg-cloud px-2.5 py-1 rounded-md border border-ink/5">
                                  {row.waitMinutes} mnt
                                </span>
                              ) : (
                                <span className="text-ink-300">-</span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-center">
                              {row.status === "PICKED_UP" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-leaf-700 bg-leaf-50 px-2.5 py-0.5 rounded-full border border-leaf-200">
                                  ✓ Selesai
                                </span>
                              ) : row.status === "CANCELLED" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-coral-600 bg-coral-50 px-2.5 py-0.5 rounded-full border border-coral-200">
                                  Dibatalkan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
                                  Menunggu
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 3. PAGINATION & SHORT VIEW (10/20/50/100) */}
                {/* ========================================================= */}
                <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400 font-medium">Tampilkan:</span>
                      <select
                        value={historyPageSize}
                        onChange={(e) => setHistoryPageSize(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-sky text-xs"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-ink-400 font-medium">data</span>
                    </div>

                    <span className="text-ink-400">
                      Menampilkan{" "}
                      <strong className="text-ink">
                        {historyList.length === 0
                          ? 0
                          : (historyCurrentPage - 1) * historyPageSize + 1}
                        -
                        {Math.min(
                          historyCurrentPage * historyPageSize,
                          historyList.length
                        )}
                      </strong>{" "}
                      dari <strong className="text-ink">{historyList.length}</strong> data
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyCurrentPage <= 1}
                      onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                    >
                      <ChevronLeft size={14} className="mr-1" /> Prev
                    </Button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (historyTotalPages > 5 && historyCurrentPage > 3) {
                          pageNum = historyCurrentPage - 2 + i;
                          if (pageNum > historyTotalPages) {
                            pageNum = historyTotalPages - (4 - i);
                          }
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setHistoryCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                              historyCurrentPage === pageNum
                                ? "bg-sky text-white shadow-2xs"
                                : "text-ink-400 hover:bg-cloud hover:text-ink"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyCurrentPage >= historyTotalPages}
                      onClick={() => setHistoryCurrentPage((p) => Math.min(historyTotalPages, p + 1))}
                      className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                    >
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LAYAR TV LOBBY & SOP PENJEMPUTAN */}
      {/* ========================================================================= */}
      {activeTab === "TV_DISPLAY" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* TV Display Preview Box */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 border border-ink/5 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-ink/5">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Layar Monitor Lobby (TV Display)</h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Tampilan layar penuh interaktif untuk memanggil siswa di lobby sekolah
                </p>
              </div>
              <Link href="/penjemputan-app" target="_blank">
                <Button className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md">
                  <ExternalLink size={13} className="mr-1.5" /> Buka Layar TV
                </Button>
              </Link>
            </div>

            {/* Mockup Frame */}
            <div className="bg-ink rounded-2xl p-5 text-white aspect-video relative overflow-hidden flex flex-col justify-between shadow-xl border-2 border-ink">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky flex items-center justify-center font-display font-black text-xs">
                    J
                  </div>
                  <div>
                    <p className="font-bold text-[11px] tracking-wider">JACOS LOBBY DISPLAY</p>
                    <p className="text-[9px] text-white/40">Papan Panggilan Siswa</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-gold">LOKET 1</span>
              </div>

              <div className="text-center py-4">
                <span className="text-[9px] font-bold text-gold uppercase tracking-widest bg-gold/20 px-2.5 py-0.5 rounded-full border border-gold/30">
                  Sedang Dipanggil
                </span>
                <h4 className="font-display text-2xl sm:text-3xl font-black text-white mt-2">
                  {waitingQueue[0]?.students?.full_name?.split(" ")[0] || "Contoh Siswa"}
                </h4>
                <p className="text-xs text-white/70 mt-0.5">
                  Kelas {waitingQueue[0]?.className || "Grade 1"} • Dijemput oleh{" "}
                  {waitingQueue[0]?.picked_by_name || "Orang Tua"}
                </p>
              </div>

              <div className="text-[9px] text-white/30 text-center">
                Sistem Terhubung Real-Time ke Barcode Scanner Gerbang &amp; Portal Orang Tua
              </div>
            </div>
          </div>

          {/* Operational SOP for Security */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">Panduan SOP Security</h4>
                  <p className="text-[11px] text-ink-400">Standard Operating Procedure</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-cloud border border-ink/5 space-y-0.5">
                  <p className="font-bold text-ink flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky text-white flex items-center justify-center text-[9px]">
                      1
                    </span>
                    Scan QR Orang Tua
                  </p>
                  <p className="text-ink-400 leading-relaxed pl-5 text-[11px]">
                    Arahkan scanner ke QR Code di aplikasi orang tua saat tiba di gerbang.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cloud border border-ink/5 space-y-0.5">
                  <p className="font-bold text-ink flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky text-white flex items-center justify-center text-[9px]">
                      2
                    </span>
                    Panggilan Otomatis ke TV
                  </p>
                  <p className="text-ink-400 leading-relaxed pl-5 text-[11px]">
                    Nama siswa akan muncul di papan antrian TV lobby untuk segera bersiap.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cloud border border-ink/5 space-y-0.5">
                  <p className="font-bold text-ink flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-leaf-600 text-white flex items-center justify-center text-[9px]">
                      3
                    </span>
                    Serah Terima &amp; Konfirmasi
                  </p>
                  <p className="text-ink-400 leading-relaxed pl-5 text-[11px]">
                    Setelah siswa diserahkan ke penjemput sah, klik <strong>Selesai</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
