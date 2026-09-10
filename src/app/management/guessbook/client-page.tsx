"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  QrCode,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  Printer,
  Copy,
  Check,
  Building2,
  Baby,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  Compass,
  FileSpreadsheet,
} from "lucide-react";
import {
  updateGuestbookFollowUp,
  createManualGuestbookEntry,
  deleteGuestbookEntry,
  sendGuestbookFollowUpEmail,
  type GuestbookEntry,
  type GuestbookStats,
} from "./actions";

interface GuestbookClientProps {
  initialEntries: GuestbookEntry[];
  initialStats: GuestbookStats;
}

export default function GuestbookClient({
  initialEntries,
  initialStats,
}: GuestbookClientProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [stats, setStats] = useState<GuestbookStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  // Modals state
  const [selectedEntry, setSelectedEntry] = useState<GuestbookEntry | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Operations state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    parent_name: "",
    whatsapp: "",
    email: "",
    address_detail: "",
    child_name: "",
    child_age: undefined as number | undefined,
    target_grade: "Kindergarten",
    visit_purpose: "school visit / school tour",
    other_purpose: "",
    notes: "",
  });
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return entries.filter((item) => {
      // Search
      const searchMatch =
        searchTerm === "" ||
        item.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.child_name && item.child_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.whatsapp.includes(searchTerm) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.address_detail && item.address_detail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.visit_purpose && item.visit_purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.visit_code && item.visit_code.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "BELUM" && (item.follow_up_status === "BELUM_FOLLOW_UP" || !item.follow_up_status)) ||
        (statusFilter === "SUDAH" && item.follow_up_status === "SUDAH_FOLLOW_UP");

      // Purpose / Grade
      const gradeMatch =
        gradeFilter === "ALL" ||
        (item.target_grade && item.target_grade.toLowerCase().includes(gradeFilter.toLowerCase())) ||
        (item.visit_purpose && item.visit_purpose.toLowerCase().includes(gradeFilter.toLowerCase()));

      // Date
      let dateMatch = true;
      if (dateFilter === "TODAY") {
        dateMatch = item.visit_date === todayStr || Boolean(item.created_at && item.created_at.startsWith(todayStr));
      } else if (dateFilter === "WEEK") {
        const itemDate = new Date(item.visit_date || item.created_at).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        dateMatch = itemDate >= sevenDaysAgo;
      }

      return searchMatch && statusMatch && gradeMatch && dateMatch;
    });
  }, [entries, searchTerm, statusFilter, gradeFilter, dateFilter]);

  // Recalculate stats helper
  const refreshStats = (currentList: GuestbookEntry[]) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setStats({
      total: currentList.length,
      today: currentList.filter((r) => r.visit_date === todayStr || (r.created_at && r.created_at.startsWith(todayStr))).length,
      unfollowed: currentList.filter((r) => r.follow_up_status === "BELUM_FOLLOW_UP" || !r.follow_up_status).length,
      followed: currentList.filter((r) => r.follow_up_status === "SUDAH_FOLLOW_UP").length,
      kindergarten: currentList.filter((r) => r.target_grade?.toLowerCase().includes("kindergarten") || r.target_grade?.toLowerCase().includes("tk") || r.target_grade?.toLowerCase().includes("pre-school")).length,
      primary: currentList.filter((r) => r.target_grade?.toLowerCase().includes("primary") || r.target_grade?.toLowerCase().includes("sd")).length,
    });
  };

  // Toggle Follow-up Status
  const handleToggleStatus = async (entry: GuestbookEntry, newStatus: "BELUM_FOLLOW_UP" | "SUDAH_FOLLOW_UP", customNotes?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateGuestbookFollowUp({
        id: entry.id,
        followUpStatus: newStatus,
        followUpNotes: customNotes !== undefined ? customNotes : entry.follow_up_notes,
      });

      if (res.success) {
        const updatedList = entries.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                follow_up_status: newStatus,
                follow_up_notes: customNotes !== undefined ? customNotes : item.follow_up_notes,
                followed_up_at: newStatus === "SUDAH_FOLLOW_UP" ? new Date().toISOString() : null,
                followed_up_by: "Admin Admisi",
              }
            : item
        );
        setEntries(updatedList);
        refreshStats(updatedList);
        if (selectedEntry && selectedEntry.id === entry.id) {
          setSelectedEntry({
            ...selectedEntry,
            follow_up_status: newStatus,
            follow_up_notes: customNotes !== undefined ? customNotes : selectedEntry.follow_up_notes,
            followed_up_at: newStatus === "SUDAH_FOLLOW_UP" ? new Date().toISOString() : null,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete Entry
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data buku tamu ini?")) return;
    try {
      const res = await deleteGuestbookEntry(id);
      if (res.success) {
        const updated = entries.filter((e) => e.id !== id);
        setEntries(updated);
        refreshStats(updated);
        if (selectedEntry?.id === id) setSelectedEntry(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredEntries.map((item, index) => ({
      No: index + 1,
      "Kode Kunjungan": item.visit_code,
      "Tanggal Kunjungan": item.visit_date,
      "Waktu": item.visit_time,
      "Nama Tamu": item.parent_name,
      "No Telepon / WhatsApp": item.whatsapp,
      "Email": item.email,
      "Tujuan Kunjungan": item.visit_purpose || "-",
      "Nama Siswa": item.child_name && item.child_name !== "-" ? item.child_name : "-",
      "Jenjang Siswa": item.target_grade && item.target_grade !== "-" ? item.target_grade : "-",
      "Alamat": item.address_detail,
      "Catatan Tamu": item.notes || "-",
      "Status Follow-Up": item.follow_up_status === "SUDAH_FOLLOW_UP" ? "Sudah Di-Follow Up" : "Belum Di-Follow Up",
      "Catatan Staf": item.follow_up_notes || "-",
      "Waktu Follow-Up": item.followed_up_at ? new Date(item.followed_up_at).toLocaleString("id-ID") : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Tamu JACOS");
    XLSX.writeFile(workbook, `Rekap_Buku_Tamu_JACOS_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Submit Manual Walk-in Entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.parent_name || !manualForm.whatsapp) return;

    setIsSavingManual(true);
    try {
      const isParentStudent = manualForm.visit_purpose === "parent / student matters";
      const finalPurpose = manualForm.visit_purpose === "Others..." && manualForm.other_purpose ? `Others: ${manualForm.other_purpose}` : manualForm.visit_purpose;

      const res = await createManualGuestbookEntry({
        parent_name: manualForm.parent_name,
        whatsapp: manualForm.whatsapp,
        email: manualForm.email,
        address_detail: manualForm.address_detail || "Kampus JACOS (Walk-in)",
        child_name: isParentStudent && manualForm.child_name ? manualForm.child_name : "-",
        child_age: isParentStudent && manualForm.child_age ? Number(manualForm.child_age) : null,
        target_grade: isParentStudent && manualForm.target_grade ? manualForm.target_grade : "-",
        visit_purpose: finalPurpose,
        source_info: "Walk-in On Spot",
        notes: manualForm.notes || null,
        province_id: null,
        province_name: null,
        regency_id: null,
        regency_name: null,
        district_id: null,
        district_name: null,
        village_id: null,
        village_name: null,
        postal_code: null,
        visit_date: new Date().toISOString().split("T")[0],
        visit_time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        follow_up_status: "SUDAH_FOLLOW_UP",
        follow_up_notes: "Walk-in langsung dilayani resepsionis",
        followed_up_by: "Staf Resepsionis",
      });

      if (res.success && res.entry) {
        const updated = [res.entry, ...entries];
        setEntries(updated);
        refreshStats(updated);
        setShowAddModal(false);
        setManualForm({
          parent_name: "",
          whatsapp: "",
          email: "",
          address_detail: "",
          child_name: "",
          child_age: undefined,
          target_grade: "Kindergarten",
          visit_purpose: "school visit / school tour",
          other_purpose: "",
          notes: "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Send Follow Up Email
  const handleSendEmail = async () => {
    if (!selectedEntry || !selectedEntry.email) return;

    setIsSendingEmail(true);
    try {
      const res = await sendGuestbookFollowUpEmail({
        entryId: selectedEntry.id,
        recipientEmail: selectedEntry.email,
        parentName: selectedEntry.parent_name,
        childName: selectedEntry.child_name || "-",
        targetGrade: selectedEntry.target_grade || "-",
        visitCode: selectedEntry.visit_code,
        customMessage: emailCustomMessage,
      });

      if (res.success) {
        alert("Email tindak lanjut berhasil dikirimkan!");
        setShowEmailModal(false);
        setEmailCustomMessage("");
        const updatedList = entries.map((item) =>
          item.id === selectedEntry.id
            ? { ...item, follow_up_status: "SUDAH_FOLLOW_UP" }
            : item
        );
        setEntries(updatedList);
        refreshStats(updatedList);
      } else {
        alert(res.message || "Gagal mengirim email.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengirim email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Build WhatsApp Follow-up URL
  const getWhatsAppFollowUpUrl = (entry: GuestbookEntry) => {
    let cleanWa = entry.whatsapp.replace(/[^0-9]/g, "");
    if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
    else if (cleanWa.startsWith("8")) cleanWa = "62" + cleanWa;

    const hasStudent = entry.child_name && entry.child_name !== "-";
    const studentLine = hasStudent
      ? ` terkait ananda tercinta *${entry.child_name}* (Jenjang: *${entry.target_grade}*)`
      : ` untuk keperluan *${entry.visit_purpose}*`;

    const msg = `Assalamu'alaikum Wr. Wb. Bapak/Ibu *${entry.parent_name}*,\n\nTerima kasih atas kunjungan Anda di kampus *Jakarta Cosmopolite Islamic School (JACOS)*${studentLine} (Kode Kunjungan: *${entry.visit_code}*).\n\nPerkenalkan saya dari Tim Admission & Resepsionis JACOS. Apakah ada informasi yang dapat kami bantu tindak lanjuti kembali?\n\nTerima kasih, salam hangat dari JACOS! 🌸`;

    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
  };

  // Copy Guestbook Public Link
  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://admission.jacos.id";
    navigator.clipboard.writeText(`${origin}/guessbook`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-300 mb-1">
            <Link href="/management" className="hover:text-sky transition">
              Dashboard
            </Link>
            <ChevronRight size={14} />
            <span className="text-sky font-bold">Buku Tamu (Guestbook)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight flex items-center gap-2.5">
            <Users className="text-sky" size={28} />
            Rekap Buku Tamu Kunjungan JACOS
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-0.5">
            Data calon wali murid & ananda yang berkunjung ke sekolah untuk konsultasi dan school tour.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-ink/10 text-ink hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <QrCode size={16} className="text-sky" />
            <span>QR Resepsionis</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-ink/10 text-leaf-600 hover:bg-leaf-50 text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <FileSpreadsheet size={16} />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky/20 transition"
          >
            <Plus size={16} />
            <span>+ Catat Tamu Walk-in</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tamu */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">Total Tamu</p>
            <p className="text-xl sm:text-2xl font-black text-ink">{stats.total}</p>
          </div>
        </div>

        {/* Kunjungan Hari Ini */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">Kunjungan Hari Ini</p>
            <p className="text-xl sm:text-2xl font-black text-gold-600">{stats.today}</p>
          </div>
        </div>

        {/* Belum Follow Up */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral flex items-center justify-center shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">Belum Follow Up</p>
            <p className="text-xl sm:text-2xl font-black text-coral">{stats.unfollowed}</p>
          </div>
        </div>

        {/* Sudah Follow Up */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-leaf-50 text-leaf flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">Sudah Di-Follow Up</p>
            <p className="text-xl sm:text-2xl font-black text-leaf">{stats.followed}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={17} />
            <input
              type="text"
              placeholder="Cari nama orang tua, nama anak, no WhatsApp, alamat, atau kode tiket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cloud border border-ink/10 focus:bg-white focus:border-sky focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm text-ink outline-hidden transition"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-cloud border border-ink/10 text-xs font-bold text-ink outline-hidden focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM">Belum Follow Up ({stats.unfollowed})</option>
              <option value="SUDAH">Sudah Follow Up ({stats.followed})</option>
            </select>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-cloud border border-ink/10 text-xs font-bold text-ink outline-hidden focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="Kindergarten">Kindergarten / TK</option>
              <option value="Primary">Primary / SD</option>
              <option value="Toddler">Toddler</option>
              <option value="Middle">Middle School / SMP</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-cloud border border-ink/10 text-xs font-bold text-ink outline-hidden focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Tanggal</option>
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">7 Hari Terakhir</option>
            </select>
          </div>
        </div>

        {/* Counter Info Bar */}
        <div className="flex items-center justify-between text-xs text-ink-300 pt-2 border-t border-ink/5">
          <span>
            Menampilkan <strong className="text-ink">{filteredEntries.length}</strong> dari{" "}
            <strong className="text-ink">{entries.length}</strong> data tamu
          </span>
          {(searchTerm || statusFilter !== "ALL" || gradeFilter !== "ALL" || dateFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setGradeFilter("ALL");
                setDateFilter("ALL");
              }}
              className="text-sky hover:underline font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Cards List */}
      <div className="bg-white rounded-3xl border border-ink/5 shadow-xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky flex items-center justify-center mx-auto">
              <Users size={28} />
            </div>
            <h3 className="text-base font-bold text-ink">Tidak ada data buku tamu yang cocok</h3>
            <p className="text-xs text-ink-400 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter status kunjungan di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-cloud/50 text-[11px] uppercase tracking-wider font-bold text-ink-300">
                  <th className="py-3.5 px-4 sm:px-6">Tamu & Tujuan Kunjungan</th>
                  <th className="py-3.5 px-4">Kontak (WhatsApp/Email)</th>
                  <th className="py-3.5 px-4">Alamat</th>
                  <th className="py-3.5 px-4">Waktu Kunjungan</th>
                  <th className="py-3.5 px-4">Status Follow Up</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 text-xs sm:text-sm">
                {filteredEntries.map((item) => {
                  const isFollowed = item.follow_up_status === "SUDAH_FOLLOW_UP";
                  const hasStudent = item.child_name && item.child_name !== "-";

                  return (
                    <tr key={item.id} className="hover:bg-cloud/40 transition">
                      {/* Tamu & Keperluan */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{item.parent_name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cloud border border-ink/10 text-ink-300">
                              {item.visit_code}
                            </span>
                          </div>
                          
                          {/* Purpose Badge */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md capitalize">
                              {item.visit_purpose || "Kunjungan"}
                            </span>

                            {hasStudent && (
                              <div className="inline-flex items-center gap-1 text-[11px] text-coral-700 bg-coral-50 border border-coral-100 px-2 py-0.5 rounded-md font-medium">
                                <Baby size={12} className="text-coral shrink-0" />
                                <span>{item.child_name}</span>
                                {item.target_grade && item.target_grade !== "-" && (
                                  <span className="font-bold">({item.target_grade})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          <a
                            href={getWhatsAppFollowUpUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-leaf hover:underline"
                          >
                            <Phone size={13} />
                            <span>{item.whatsapp}</span>
                          </a>
                          <div className="text-ink-300 text-[11px] truncate max-w-[180px]">
                            {item.email}
                          </div>
                        </div>
                      </td>

                      {/* Alamat */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-1.5 text-xs text-ink-400 max-w-[220px]">
                          <MapPin size={14} className="text-coral shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.address_detail}</span>
                        </div>
                      </td>

                      {/* Waktu Kunjungan */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-ink">{item.visit_date}</p>
                          <p className="text-ink-300 text-[11px]">{item.visit_time || "09:00 WIB"}</p>
                        </div>
                      </td>

                      {/* Status Follow Up */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(
                              item,
                              isFollowed ? "BELUM_FOLLOW_UP" : "SUDAH_FOLLOW_UP"
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                            isFollowed
                              ? "bg-leaf-50 text-leaf-600 border border-leaf-200 hover:bg-leaf-100"
                              : "bg-coral-50 text-coral-600 border border-coral-200 hover:bg-coral-100"
                          }`}
                        >
                          {isFollowed ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Sudah Follow Up</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={13} />
                              <span>Belum Follow Up</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEntry(item);
                              setAdminNotes(item.follow_up_notes || "");
                            }}
                            className="p-2 rounded-xl bg-sky-50 text-sky hover:bg-sky-100 transition"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye size={16} />
                          </button>

                          <a
                            href={getWhatsAppFollowUpUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white transition"
                            title="Chat WhatsApp Tamu"
                          >
                            <MessageSquare size={16} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-xl bg-cloud text-ink-300 hover:bg-coral-50 hover:text-coral transition"
                            title="Hapus Data"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: DETAIL GUESTBOOK DRAWER/MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-ink/10 shadow-2xl overflow-hidden my-8">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-sky to-sky-700 text-white p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-gold-100">
                  Detail Kunjungan Buku Tamu
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-1">
                  {selectedEntry.parent_name}
                </h3>
                <p className="text-xs text-sky-100">
                  Kode: {selectedEntry.visit_code} • Keperluan: {selectedEntry.visit_purpose}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Data Tamu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-1">
                  <span className="text-[11px] font-bold text-ink-300 uppercase">Nama Lengkap Tamu</span>
                  <p className="text-sm font-bold text-ink">{selectedEntry.parent_name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-1">
                  <span className="text-[11px] font-bold text-ink-300 uppercase">No. Telepon / WhatsApp</span>
                  <p className="text-sm font-bold text-leaf">{selectedEntry.whatsapp}</p>
                </div>

                <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-1">
                  <span className="text-[11px] font-bold text-ink-300 uppercase">Alamat Email</span>
                  <p className="text-sm font-bold text-sky truncate">{selectedEntry.email}</p>
                </div>

                <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-1">
                  <span className="text-[11px] font-bold text-ink-300 uppercase">Tujuan Kunjungan</span>
                  <p className="text-sm font-bold text-ink capitalize">{selectedEntry.visit_purpose || "-"}</p>
                </div>
              </div>

              {/* 2. Data Siswa jika ada */}
              {selectedEntry.child_name && selectedEntry.child_name !== "-" && (
                <div className="p-4 rounded-2xl bg-coral-50/70 border border-coral-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-coral-700">
                    <Baby size={15} />
                    <span>Informasi Siswa Terkait (Parent / Student Matters)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-ink-300 text-[10px] block">Nama Lengkap Siswa:</span>
                      <strong className="text-ink text-sm">{selectedEntry.child_name}</strong>
                    </div>
                    <div>
                      <span className="text-ink-300 text-[10px] block">Jenjang Pendidikan:</span>
                      <strong className="text-coral-700 text-sm">{selectedEntry.target_grade}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Alamat Domisili */}
              <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-coral">
                  <MapPin size={15} />
                  <span>Alamat Tamu</span>
                </div>
                <p className="text-xs text-ink font-medium leading-relaxed">
                  {selectedEntry.address_detail}
                </p>
              </div>

              {/* 4. Detail Kunjungan */}
              <div className="p-4 rounded-2xl bg-cloud border border-ink/5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-gold-600">
                  <Calendar size={15} />
                  <span>Waktu Kunjungan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-ink-300 text-[11px] block">Hari & Waktu:</span>
                    <strong className="text-ink">
                      {selectedEntry.visit_date} • {selectedEntry.visit_time || "09:00 WIB"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink-300 text-[11px] block">Catatan Tambahan:</span>
                    <p className="text-ink italic">{selectedEntry.notes || "Tidak ada catatan khusus."}</p>
                  </div>
                </div>
              </div>

              {/* 4. Update Follow Up Status & Notes Form */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    Status Follow Up Staf Admisi
                  </span>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      selectedEntry.follow_up_status === "SUDAH_FOLLOW_UP"
                        ? "bg-leaf text-white"
                        : "bg-coral text-white"
                    }`}
                  >
                    {selectedEntry.follow_up_status === "SUDAH_FOLLOW_UP"
                      ? "Sudah Di-Follow Up"
                      : "Belum Di-Follow Up"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink">Catatan Tindak Lanjut Admin:</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Sudah dihubungi via WA, orang tua tertarik mendaftar trial class Sabtu depan..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs text-ink outline-hidden focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-ink-300">
                    {selectedEntry.followed_up_at
                      ? `Terakhir di-update: ${new Date(selectedEntry.followed_up_at).toLocaleString("id-ID")}`
                      : "Belum pernah di-follow up"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleToggleStatus(selectedEntry, "BELUM_FOLLOW_UP", adminNotes)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-coral-200 text-coral-600 hover:bg-coral-50 text-xs font-bold transition disabled:opacity-50"
                    >
                      Tandai Belum Selesai
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleToggleStatus(selectedEntry, "SUDAH_FOLLOW_UP", adminNotes)}
                      className="px-4 py-1.5 rounded-xl bg-leaf hover:bg-leaf-600 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      {isUpdatingStatus ? "Menyimpan..." : "Simpan & Tandai Selesai"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Follow Up Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={getWhatsAppFollowUpUrl(selectedEntry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1fbd58] text-white font-bold text-xs sm:text-sm shadow-md transition"
                >
                  <MessageSquare size={16} />
                  <span>Kirim Pesan WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md transition"
                >
                  <Mail size={16} />
                  <span>Kirim Email Resmi JACOS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QR CODE MEJA RESEPSIONIS */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-ink/10 shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky px-3 py-1 rounded-full text-xs font-bold">
              <QrCode size={14} className="text-sky" />
              Meja Resepsionis JACOS
            </div>

            <h3 className="text-xl font-black text-ink">
              Scan QR Buku Tamu Kunjungan
            </h3>
            <p className="text-xs text-ink-400">
              Pajang QR Code ini di meja resepsionis atau berikan kepada calon wali murid untuk scan langsung menggunakan smartphone.
            </p>

            {/* QR Card Frame */}
            <div className="bg-cloud p-6 rounded-3xl border border-ink/10 inline-block shadow-inner">
              <QRCodeSVG
                value={typeof window !== "undefined" ? `${window.location.origin}/guessbook` : "https://admission.jacos.id/guessbook"}
                size={200}
                level="H"
                includeMargin={false}
              />
              <p className="mt-3 text-[11px] font-mono text-ink-300 font-bold">
                admission.jacos.id/guessbook
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky hover:bg-sky-600 text-white font-bold text-xs transition"
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? "Link Berhasil Disalin!" : "Salin Link Form Buku Tamu"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-cloud hover:bg-slate-100 text-ink font-semibold text-xs transition border border-ink/10"
              >
                <Printer size={16} />
                <span>Cetak Stand Card Meja Resepsionis</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-full text-xs text-ink-300 hover:text-ink font-semibold py-1.5 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH TAMU MANUAL (WALK-IN) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-ink/10 shadow-2xl overflow-hidden my-8">
            <div className="bg-sky text-white p-5 sm:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">+ Catat Tamu Walk-in On Spot</h3>
                <p className="text-xs text-sky-100">Pencatatan langsung oleh staf resepsionis</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-ink">Nama Lengkap Tamu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bunda Ratna Dewi / Bapak Hendra"
                  value={manualForm.parent_name}
                  onChange={(e) => setManualForm({ ...manualForm, parent_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-ink">No Telepon / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={manualForm.whatsapp}
                    onChange={(e) => setManualForm({ ...manualForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-ink">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ratna.dewi@gmail.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-ink">Tujuan Kunjungan (Purpose of Visit) *</label>
                <select
                  value={manualForm.visit_purpose}
                  onChange={(e) => setManualForm({ ...manualForm, visit_purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden cursor-pointer"
                >
                  <option value="school visit / school tour">School Visit / School Tour</option>
                  <option value="admission / registration">Admission / Registration</option>
                  <option value="parent / student matters">Parent / Student Matters</option>
                  <option value="meeting / business">Meeting / Business</option>
                  <option value="Others...">Others...</option>
                </select>
              </div>

              {manualForm.visit_purpose === "Others..." && (
                <div className="space-y-1 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900">Keterangan Tujuan Lainnya *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sebutkan keperluan kunjungan..."
                    value={manualForm.other_purpose}
                    onChange={(e) => setManualForm({ ...manualForm, other_purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-xs text-ink outline-hidden"
                  />
                </div>
              )}

              {/* Conditional Student fields for parent/student matters */}
              {manualForm.visit_purpose === "parent / student matters" && (
                <div className="p-3.5 bg-coral-50/70 border border-coral-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-coral-700 block">Informasi Siswa (Parent / Student Matters)</span>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-ink">Nama Lengkap Siswa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Fatih Ibrahim"
                      value={manualForm.child_name}
                      onChange={(e) => setManualForm({ ...manualForm, child_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-coral-200 text-xs text-ink outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-ink">Jenjang Siswa (Student Grade) *</label>
                    <select
                      value={manualForm.target_grade}
                      onChange={(e) => setManualForm({ ...manualForm, target_grade: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-coral-200 text-xs text-ink outline-hidden cursor-pointer"
                    >
                      <option value="Pre-school">Pre-school</option>
                      <option value="Kindergarten">Kindergarten</option>
                      <option value="Primary school">Primary school</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-ink">Alamat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Duren Sawit, Jakarta Timur"
                  value={manualForm.address_detail}
                  onChange={(e) => setManualForm({ ...manualForm, address_detail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-ink">Catatan Kunjungan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Kebutuhan khusus atau topik konsultasi..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-cloud text-ink font-bold text-xs hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2.5 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {isSavingManual ? "Menyimpan..." : "Simpan Data Tamu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SEND FOLLOW-UP EMAIL */}
      {showEmailModal && selectedEntry && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-ink/10 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Kirim Email Follow-Up</h3>
                  <p className="text-[11px] text-ink-300">Penerima: {selectedEntry.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-lg bg-cloud text-ink-300 hover:text-ink transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">Pesan Tambahan Personal (Opsional):</label>
              <textarea
                rows={4}
                placeholder="Tuliskan pesan khusus untuk orang tua, misal: Berikut kami lampirkan booklet biaya pendaftaran dan voucher potongan khusus kunjungan..."
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cloud border border-ink/10 text-xs text-ink focus:bg-white focus:border-sky outline-hidden"
              />
            </div>

            <div className="bg-sky-50 rounded-2xl p-3 text-[11px] text-sky-700 space-y-1">
              <p className="font-bold">✨ Otomatisasi:</p>
              <p>
                Email resmi bertema JACOS akan dikirim langsung via Resend dan status tamu akan otomatis berubah menjadi <strong>Sudah Follow Up</strong>.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2.5 rounded-xl bg-cloud text-ink font-bold text-xs hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={handleSendEmail}
                className="px-5 py-2.5 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kirim Email Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
