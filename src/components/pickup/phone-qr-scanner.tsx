"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Megaphone,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  QrCode,
  Smartphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPickupQueue,
  searchStudentsForPickup,
  callPickupStudent,
  confirmPickup,
} from "@/app/management/absensi/actions";

// Sound synthesis helper
function playFeedbackSound(type: "success" | "chime" | "error" = "success") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "success" || type === "chime") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // ignore
  }
}

interface PhoneQRScannerProps {
  onQueueUpdated?: () => void;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export default function PhoneQRScanner({
  onQueueUpdated,
  onClose,
  isStandalonePage = false,
}: PhoneQRScannerProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [cameraState, setCameraState] = useState<"starting" | "running" | "error" | "paused">("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Camera controls
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan states
  const [recentScan, setRecentScan] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    className?: string;
    picker?: string;
    relation?: string;
    time?: string;
    queueId?: string;
    studentId?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual search states
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualPicker, setManualPicker] = useState("");
  const [manualRelation, setManualRelation] = useState("Orang Tua");
  const [isSearching, setIsSearching] = useState(false);

  const qrRegionId = useRef(`phone-qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop camera:", err);
      }
    }
  }, []);

  // Process decoded QR text
  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Prevent duplicate scan within 2.5 seconds
      if (
        decodedText === lastScannedTextRef.current &&
        now - lastScannedTimeRef.current < 2500
      ) {
        return;
      }

      lastScannedTextRef.current = decodedText;
      lastScannedTimeRef.current = now;

      // Haptic feedback for mobile phone
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setIsProcessing(true);

      let targetStudentId = decodedText.trim();
      let pickerName = "Orang Tua/Wali";
      let relation = "Orang Tua";

      try {
        if (decodedText.trim().startsWith("{")) {
          const parsed = JSON.parse(decodedText.trim());
          if (parsed.studentId) targetStudentId = parsed.studentId;
          if (parsed.picker) pickerName = parsed.picker;
          if (parsed.role) relation = parsed.role;
        } else if (decodedText.trim().startsWith("pickup:")) {
          const parts = decodedText.trim().split(":");
          if (parts[1]) targetStudentId = parts[1];
        }
      } catch (err) {
        console.error("Error parsing QR payload:", err);
      }

      const res = await addPickupQueue(targetStudentId, pickerName, relation);

      if (soundEnabled) {
        playFeedbackSound(res.success ? "success" : "error");
      }

      if (res.success) {
        setRecentScan({
          success: true,
          message: res.message || "Ananda berhasil masuk antrian penjemputan!",
          studentName: (res as any).studentName,
          className: (res as any).className,
          picker: pickerName,
          relation: relation,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          queueId: res.queueId,
          studentId: targetStudentId,
        });
        onQueueUpdated?.();
      } else {
        setRecentScan({
          success: false,
          message: res.message || "Gagal memproses QR Penjemputan.",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      setIsProcessing(false);
    },
    [soundEnabled, onQueueUpdated]
  );

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setErrorMessage(null);

    try {
      await stopCamera();

      const html5QrCode = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras
      let cameraList: Array<{ id: string; label: string }> = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          cameraList = devices;
          setCameras(devices);
        }
      } catch (e) {
        // Fallback to environment
      }

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.72);
          return {
            width: Math.min(qrboxSize, 280),
            height: Math.min(qrboxSize, 280),
          };
        },
        aspectRatio: 1.0,
      };

      // Prefer back camera / environment
      let cameraSource: any = { facingMode: "environment" };
      if (cameraList.length > 0 && cameraList[selectedCameraIndex]) {
        cameraSource = cameraList[selectedCameraIndex].id;
      }

      await html5QrCode.start(
        cameraSource,
        qrConfig,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Ignore ongoing frame scanning errors
        }
      );

      setCameraState("running");

      // Check flashlight support
      try {
        const capabilities: any = html5QrCode.getRunningTrackCapabilities?.();
        if (capabilities && "torch" in capabilities) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraState("error");
      setErrorMessage(
        err?.message?.includes("NotAllowedError") || err?.name === "NotAllowedError"
          ? "Izin akses kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser HP Anda."
          : "Gagal menyalakan kamera. Pastikan browser mendukung kamera & tidak digunakan aplikasi lain."
      );
    }
  }, [qrRegionId, selectedCameraIndex, stopCamera, handleDecodedText]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle failed:", err);
    }
  };

  // Flip / Switch Camera
  const switchCamera = async () => {
    if (cameras.length <= 1) {
      // Toggle between facing modes if only 1 listed
      setSelectedCameraIndex((prev) => (prev === 0 ? 1 : 0));
    } else {
      setSelectedCameraIndex((prev) => (prev + 1) % cameras.length);
    }
  };

  // Lifecycle
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, selectedCameraIndex, startCamera, stopCamera]);

  // Manual Search Debounce
  useEffect(() => {
    if (manualQuery.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchStudentsForPickup(manualQuery);
          setSearchResults(results || []);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [manualQuery]);

  const handleManualAdd = async (student: any) => {
    setIsProcessing(true);
    const finalPicker = manualPicker.trim() || student.authorized_pickup_name || "Orang Tua/Wali";
    const res = await addPickupQueue(student.id, finalPicker, manualRelation);

    if (soundEnabled) {
      playFeedbackSound(res.success ? "success" : "error");
    }

    if (res.success) {
      setRecentScan({
        success: true,
        message: `Ananda ${student.full_name} masuk antrian!`,
        studentName: student.full_name,
        className: student.className,
        picker: finalPicker,
        relation: manualRelation,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        queueId: res.queueId,
        studentId: student.id,
      });
      setManualQuery("");
      setSearchResults([]);
      setManualPicker("");
      onQueueUpdated?.();
    } else {
      alert(res.message || "Gagal memasukkan siswa ke antrian.");
    }
    setIsProcessing(false);
  };

  const handleQuickCall = async (queueId: string) => {
    if (soundEnabled) playFeedbackSound("chime");
    await callPickupStudent(queueId);
    setRecentScan((prev) => (prev ? { ...prev, message: "Panggilan siswa sedang disuarakan!" } : null));
    onQueueUpdated?.();
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-ink rounded-[2rem] overflow-hidden border border-ink/10 shadow-2xl transition-all">
      {/* Top Header & Mode Tabs */}
      <div className="p-4 sm:p-5 border-b border-ink/5 bg-gradient-to-r from-sky-50/50 via-white to-purple-50/40 dark:from-ink dark:via-ink dark:to-ink flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky flex items-center justify-center text-white shadow-md shadow-sky/20">
              <Smartphone size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-ink dark:text-white leading-none">
                  Scan Penjemputan HP
                </h3>
                <span className="bg-leaf-50 text-leaf-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-leaf-200">
                  Live
                </span>
              </div>
              <p className="text-xs text-ink-400 dark:text-white/60 mt-0.5">
                Arahkan kamera HP ke QR Code penjemput
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
              className="w-9 h-9 rounded-xl text-ink-400 hover:text-sky hover:bg-sky-50 dark:hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-9 h-9 rounded-xl text-ink-400 hover:text-coral hover:bg-coral-50"
              >
                <X size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Playful Switcher Tabs */}
        <div className="grid grid-cols-2 bg-cloud dark:bg-white/5 rounded-2xl p-1 border border-ink/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "camera"
                ? "bg-sky text-white shadow-md shadow-sky/25 scale-[1.01]"
                : "text-ink-400 hover:text-ink dark:text-white/60 dark:hover:text-white"
            }`}
          >
            <Camera size={14} />
            <span>Kamera HP (Scan)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-sky text-white shadow-md shadow-sky/25 scale-[1.01]"
                : "text-ink-400 hover:text-ink dark:text-white/60 dark:hover:text-white"
            }`}
          >
            <Search size={14} />
            <span>Cari / Input Manual</span>
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 sm:p-6 space-y-4">
        {activeTab === "camera" ? (
          <div className="space-y-4">
            {/* Viewfinder Container */}
            <div className="relative w-full aspect-square max-h-[380px] bg-ink rounded-[2rem] overflow-hidden flex flex-col items-center justify-center border-4 border-ink shadow-inner">
              {/* HTML5 QR Container */}
              <div
                id={qrRegionId}
                className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
              />

              {/* Laser Line Animation & Viewfinder Overlay */}
              {cameraState === "running" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Subtle backdrop overlay */}
                  <div className="absolute inset-0 bg-ink/30"></div>

                  {/* Target Scanner Box */}
                  <div className="relative w-[72%] h-[72%] max-w-[260px] max-h-[260px] rounded-3xl border border-white/20 shadow-[0_0_0_9999px_rgba(22,35,61,0.45)]">
                    {/* Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky rounded-tl-xl"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky rounded-tr-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky rounded-bl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky rounded-br-xl"></div>

                    {/* Laser scanning bar */}
                    <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />

                    {/* Center crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <QrCode size={40} className="text-white animate-pulse" />
                    </div>
                  </div>

                  {/* Floating status pill */}
                  <div className="absolute bottom-4 bg-ink/80 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-white/15 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-leaf animate-ping" />
                    <span>Posisikan QR di dalam kotak</span>
                  </div>
                </div>
              )}

              {/* Camera State: Starting */}
              {cameraState === "starting" && (
                <div className="absolute inset-0 bg-ink flex flex-col items-center justify-center p-6 text-center text-white z-20">
                  <div className="w-12 h-12 rounded-2xl bg-sky/20 border border-sky/40 flex items-center justify-center text-sky mb-3 animate-spin">
                    <RefreshCw size={24} />
                  </div>
                  <p className="font-bold text-sm">Menghubungkan ke Kamera HP...</p>
                  <p className="text-white/50 text-xs mt-1">
                    Mohon tunggu atau izinkan akses kamera jika diminta
                  </p>
                </div>
              )}

              {/* Camera State: Error / Permission Denied */}
              {cameraState === "error" && (
                <div className="absolute inset-0 bg-ink flex flex-col items-center justify-center p-6 text-center text-white z-20">
                  <div className="w-12 h-12 rounded-2xl bg-coral/20 border border-coral/40 flex items-center justify-center text-coral mb-3">
                    <CameraOff size={24} />
                  </div>
                  <p className="font-bold text-sm text-coral">Kamera Tidak Aktif</p>
                  <p className="text-white/60 text-xs mt-1.5 max-w-xs leading-relaxed">
                    {errorMessage || "Pastikan browser diberi izin untuk mengakses kamera HP."}
                  </p>
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="mt-4 h-9 px-4 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs gap-1.5"
                  >
                    <RefreshCw size={14} /> Coba Lagi
                  </Button>
                </div>
              )}
            </div>

            {/* Camera Floating Controls Bar */}
            <div className="flex items-center justify-between gap-2 bg-cloud dark:bg-white/5 p-2 rounded-2xl border border-ink/5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="flex-1 h-9 rounded-xl text-xs font-bold border-ink/10 gap-1.5 bg-white dark:bg-ink hover:bg-sky-50"
              >
                <SwitchCamera size={14} className="text-sky" />
                <span>Balik Kamera</span>
              </Button>

              {hasTorch && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleTorch}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold border-ink/10 gap-1.5 ${
                    isTorchOn
                      ? "bg-gold text-white border-gold shadow-sm"
                      : "bg-white dark:bg-ink text-ink hover:bg-gold-50"
                  }`}
                >
                  {isTorchOn ? <Flashlight size={14} /> : <FlashlightOff size={14} />}
                  <span>{isTorchOn ? "Senter Nyala" : "Senter"}</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  lastScannedTextRef.current = "";
                  startCamera();
                }}
                className="h-9 px-3 rounded-xl text-xs font-bold border-ink/10 bg-white dark:bg-ink hover:bg-sky-50"
                title="Reset Scanner"
              >
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>
        ) : (
          /* MANUAL SEARCH TAB */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                <Search size={13} className="text-sky" />
                <span>Cari Nama Siswa / NIS</span>
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Ketik minimal 2 huruf nama siswa..."
                  className="h-11 rounded-xl text-sm bg-cloud dark:bg-white/5 border-ink/10 pl-4 pr-10"
                  autoFocus
                />
                {isSearching && (
                  <RefreshCw
                    size={16}
                    className="absolute right-3.5 top-3.5 text-sky animate-spin"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-ink-400 dark:text-white/60 mb-1 block">
                  Nama Penjemput
                </Label>
                <Input
                  type="text"
                  value={manualPicker}
                  onChange={(e) => setManualPicker(e.target.value)}
                  placeholder="Contoh: Ibu Sarah / Pak Joko"
                  className="h-9 rounded-xl text-xs bg-cloud dark:bg-white/5 border-ink/10"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-ink-400 dark:text-white/60 mb-1 block">
                  Hubungan / Peran
                </Label>
                <select
                  value={manualRelation}
                  onChange={(e) => setManualRelation(e.target.value)}
                  className="w-full h-9 rounded-xl text-xs bg-cloud dark:bg-white/5 border border-ink/10 px-3 font-semibold text-ink dark:text-white outline-none"
                >
                  <option value="Orang Tua">Orang Tua / Wali</option>
                  <option value="Supir Pribadi">Supir Pribadi</option>
                  <option value="Keluarga / Kerabat">Keluarga / Kerabat</option>
                  <option value="Antar Jemput Sekolah">Antar Jemput</option>
                </select>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-cloud dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-2xl border border-ink/5 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky font-bold flex items-center justify-center text-sm uppercase">
                        {student.full_name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-ink dark:text-white">
                          {student.full_name}
                        </p>
                        <p className="text-[11px] text-ink-400 dark:text-white/50">
                          {student.className} • NIS: {student.nis || "-"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleManualAdd(student)}
                      disabled={isProcessing}
                      className="h-8 px-3 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs gap-1 shadow-sm"
                    >
                      <UserCheck size={13} /> Jemput
                    </Button>
                  </div>
                ))
              ) : manualQuery.length >= 2 && !isSearching ? (
                <div className="text-center py-6 text-ink-300 text-xs">
                  Tidak ditemukan siswa dengan nama tersebut.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* SCAN RESULT POPUP / BADGE */}
        {recentScan && (
          <div
            className={`p-4 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 ${
              recentScan.success
                ? "bg-leaf-50 dark:bg-leaf-950/40 border-leaf-200 dark:border-leaf-800 text-leaf-900 dark:text-leaf-100"
                : "bg-coral-50 dark:bg-coral-950/40 border-coral-200 dark:border-coral-800 text-coral-900 dark:text-coral-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {recentScan.success ? (
                  <div className="w-8 h-8 rounded-full bg-leaf text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-xs sm:text-sm">
                    {recentScan.success ? "Berhasil Dipindai!" : "Scan Gagal"}
                  </p>
                  <p className="text-[11px] opacity-80">{recentScan.message}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRecentScan(null)}
                className="text-ink-400 hover:text-ink p-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Detailed Student & Picker Info */}
            {recentScan.success && (recentScan.studentName || recentScan.picker) && (
              <div className="mt-3 pt-3 border-t border-leaf-200/60 dark:border-leaf-800/60 grid grid-cols-2 gap-2 text-xs">
                {recentScan.studentName && (
                  <div className="bg-white/80 dark:bg-ink/50 p-2 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-leaf-700 dark:text-leaf-300">
                      Siswa
                    </p>
                    <p className="font-bold text-ink dark:text-white truncate">
                      {recentScan.studentName}
                    </p>
                    <p className="text-[10px] text-ink-400 dark:text-white/60">
                      {recentScan.className || "Siswa JACOS"}
                    </p>
                  </div>
                )}
                <div className="bg-white/80 dark:bg-ink/50 p-2 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-leaf-700 dark:text-leaf-300">
                    Penjemput
                  </p>
                  <p className="font-bold text-ink dark:text-white truncate">
                    {recentScan.picker || "Orang Tua"}
                  </p>
                  <p className="text-[10px] text-ink-400 dark:text-white/60">
                    {recentScan.relation || "Wali"}
                  </p>
                </div>
              </div>
            )}

            {/* Quick action button */}
            {recentScan.success && recentScan.queueId && (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleQuickCall(recentScan.queueId!)}
                  className="flex-1 h-9 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Megaphone size={14} /> Panggil Ananda
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRecentScan(null)}
                  className="h-9 px-3 rounded-xl border-leaf-300 text-leaf-900 bg-white dark:bg-ink text-xs font-bold"
                >
                  Scan Berikutnya
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
