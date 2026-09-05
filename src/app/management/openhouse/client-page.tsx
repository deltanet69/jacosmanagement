'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  MoreVertical,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Trash2,
  Edit,
  Phone,
  HeartHandshake,
  Check,
  ChevronRight,
  Send,
  Loader2,
  X,
  Eye,
  Info,
  CalendarDays,
  Tag,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getOpenHouseRegistrations,
  updateLeadStatusAndNotes,
  createManualOpenHouseRegistration,
  deleteOpenHouseRegistration,
  sendFollowUpEmail,
  toggleOpenHouseEventStatus,
  type OpenHouseLead,
  type OpenHouseStats,
  type OpenHouseSetting,
} from './actions';

const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  NEW_LEAD: {
    label: 'Lead Baru',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    desc: 'Pendaftar baru masuk, belum dihubungi',
  },
  CONFIRMED_ATTENDING: {
    label: 'Siap Hadir',
    bg: 'bg-leaf-50',
    text: 'text-leaf-700',
    border: 'border-leaf-200',
    desc: 'Konfirmasi siap datang ke lokasi',
  },
  ATTENDED: {
    label: 'Hadir di Lokasi',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    desc: 'Peserta telah hadir saat Open House',
  },
  FOLLOW_UP_PROGRESS: {
    label: 'Proses Follow-Up',
    bg: 'bg-gold-50',
    text: 'text-gold-700',
    border: 'border-gold-200',
    desc: 'Sedang berkomunikasi intensif via WA/Email',
  },
  CONVERTED_TO_APPLICANT: {
    label: 'Daftar Siswa Baru',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Berhasil mendaftar ke formulir admisi JACOS',
  },
  NOT_INTERESTED: {
    label: 'Batal / Tidak Berminat',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    desc: 'Berhalangan hadir atau belum berminat',
  },
};

export default function OpenHouseClient({
  initialRegistrations = [],
  initialStats = {
    total: 0,
    confirmed: 0,
    attended: 0,
    kindergarten: 0,
    primary: 0,
    converted: 0,
    followUpProgress: 0,
  },
  initialSetting = {
    id: 'default',
    is_active: true,
    inactive_message: '',
    event_title: 'JACOS OPEN HOUSE 2026',
    event_dates: '',
    updated_at: '',
  },
}: {
  initialRegistrations?: OpenHouseLead[];
  initialStats?: OpenHouseStats;
  initialSetting?: OpenHouseSetting;
}) {
  const [registrations, setRegistrations] = useState<OpenHouseLead[]>(initialRegistrations);
  const [stats, setStats] = useState<OpenHouseStats>(initialStats);
  const [setting, setSetting] = useState<OpenHouseSetting>(initialSetting);

  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Detail
  const [selectedLead, setSelectedLead] = useState<OpenHouseLead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<OpenHouseLead | null>(null);

  // Follow-up edit state
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Email form state
  const [emailCustomMessage, setEmailCustomMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    parent_name: '',
    whatsapp: '',
    email: '',
    child_name: '',
    child_age: 5,
    target_program: 'Primary School',
    entry_year: '2026',
    interest_attendance: 'Ya',
    attendance_date: 'Sabtu, 29 Agustus 2026',
    attendance_session: 'Session 1 (08.30 - 10.00)',
    source_info: 'Walk-in On Spot',
    topics_of_interest: ['Kurikulum & Metode Belajar'],
    admission_consultation: 'Ya',
    lead_status: 'ATTENDED',
    follow_up_notes: 'Pendaftaran langsung di lokasi open house',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Reload Data helper
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getOpenHouseRegistrations();
      setRegistrations(res.registrations);
      setStats(res.stats);
      setSetting(res.setting);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Event Toggle ON / OFF
  const handleToggleEventStatus = async (checked: boolean) => {
    setIsTogglingStatus(true);
    try {
      const res = await toggleOpenHouseEventStatus(checked);
      setSetting(res.setting);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return registrations.filter((lead) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        lead.child_name?.toLowerCase().includes(q) ||
        lead.parent_name?.toLowerCase().includes(q) ||
        lead.ticket_code?.toLowerCase().includes(q) ||
        lead.whatsapp?.includes(q) ||
        lead.email?.toLowerCase().includes(q);

      // Status
      const matchStatus = statusFilter === 'ALL' || lead.lead_status === statusFilter;

      // Program
      const matchProgram =
        programFilter === 'ALL' ||
        lead.target_program?.toLowerCase().includes(programFilter.toLowerCase());

      // Date
      const matchDate = dateFilter === 'ALL' || lead.attendance_date?.includes(dateFilter);

      return matchSearch && matchStatus && matchProgram && matchDate;
    });
  }, [registrations, searchQuery, statusFilter, programFilter, dateFilter]);

  // Paginated Leads
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;

  // Open Detail
  const handleOpenDetail = (lead: OpenHouseLead) => {
    setSelectedLead(lead);
    setEditStatus(lead.lead_status || 'NEW_LEAD');
    setEditNotes(lead.follow_up_notes || '');
    setDetailModalOpen(true);
  };

  // Save Notes & Status
  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    try {
      await updateLeadStatusAndNotes({
        id: selectedLead.id,
        leadStatus: editStatus,
        followUpNotes: editNotes,
      });
      // Update local state
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === selectedLead.id
            ? { ...r, lead_status: editStatus, follow_up_notes: editNotes, last_contacted_at: new Date().toISOString() }
            : r
        )
      );
      setSelectedLead((prev) =>
        prev ? { ...prev, lead_status: editStatus, follow_up_notes: editNotes } : null
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Send WhatsApp Action
  const handleWhatsAppFollowUp = (lead: OpenHouseLead) => {
    let cleanWa = lead.whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1);
    if (cleanWa.startsWith('8')) cleanWa = '62' + cleanWa;

    const topicsText = lead.topics_of_interest?.length
      ? `mengenai ${lead.topics_of_interest.slice(0, 2).join(' & ')}`
      : 'informasi program unggulan & kurikulum';

    const message = `Assalamu'alaikum Wr. Wb. Ayah/Bunda ${lead.parent_name},\n\nPerkenalkan kami dari Tim Admission Jakarta Cosmopolite Islamic School (JACOS).\n\nTerima kasih atas pendaftaran ananda ${lead.child_name} pada acara JACOS Open House (${lead.target_program}) dengan Kode Tiket: *${lead.ticket_code}*.\n\nApakah ada hal yang dapat kami bantu ${topicsText}? Kami juga dapat menjadwalkan konsultasi tatap muka khusus dengan pimpinan akademik JACOS.\n\nTerima kasih. Wassalamu'alaikum Wr. Wb.`;

    const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Send Email Action
  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await sendFollowUpEmail({
        leadId: selectedLead.id,
        recipientEmail: selectedLead.email,
        parentName: selectedLead.parent_name,
        childName: selectedLead.child_name,
        targetProgram: selectedLead.target_program,
        ticketCode: selectedLead.ticket_code,
        customMessage: emailCustomMessage,
      });

      if (res.success) {
        setEmailFeedback('Email follow-up resmi berhasil dikirim ke orang tua!');
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailFeedback(null);
          setEmailCustomMessage('');
        }, 1800);
        loadData();
      } else {
        setEmailFeedback(res.message || 'Gagal mengirim email.');
      }
    } catch (err) {
      setEmailFeedback('Terjadi kesalahan koneksi server.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Submit Manual Form
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const res = await createManualOpenHouseRegistration(manualForm);
      if (res.success) {
        setManualModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Delete Lead
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      await deleteOpenHouseRegistration(leadToDelete.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== leadToDelete.id));
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!registrations.length) return;

    const headers = [
      'Kode Tiket',
      'Nama Orang Tua',
      'Nomor WhatsApp',
      'Email',
      'Nama Anak',
      'Usia Anak',
      'Jenjang Minat',
      'Tahun Masuk',
      'Status Kehadiran',
      'Tanggal Kehadiran',
      'Sesi Waktu',
      'Sumber Info',
      'Topik Minat',
      'Konsultasi Tim',
      'Status Follow-Up',
      'Catatan Follow-Up',
      'Waktu Daftar',
    ];

    const rows = registrations.map((r) => [
      `"${r.ticket_code}"`,
      `"${r.parent_name}"`,
      `"${r.whatsapp}"`,
      `"${r.email}"`,
      `"${r.child_name}"`,
      `"${r.child_age || ''}"`,
      `"${r.target_program}"`,
      `"${r.entry_year}"`,
      `"${r.interest_attendance}"`,
      `"${r.attendance_date || ''}"`,
      `"${r.attendance_session || ''}"`,
      `"${r.source_info || ''}"`,
      `"${(r.topics_of_interest || []).join(', ')}"`,
      `"${r.admission_consultation || ''}"`,
      `"${r.lead_status || ''}"`,
      `"${(r.follow_up_notes || '').replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JACOS_Open_House_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20 font-body">
      {/* 1. TOP HEADER & EVENT STATUS CONTROL */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/10 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-300">
              JACOS Management Portal
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Data Pendaftaran & Leads Open House
          </h1>
          <p className="text-ink-400 text-sm mt-1">
            Kelola, analisa, dan tindak lanjuti calon wali murid yang mendaftar melalui form publik Open House.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Toggle Event Switch */}
          <div className="flex items-center gap-3 bg-cloud px-4 py-2.5 rounded-2xl border border-ink/10 shrink-0">
            <div className="text-right">
              <p className="text-xs font-bold text-ink">Status Event Open House</p>
              <p className={`text-[11px] font-semibold ${setting.is_active ? 'text-leaf-600' : 'text-coral-600'}`}>
                {setting.is_active ? '🟢 Form Publik Aktif' : '🔴 Form Publik Ditutup'}
              </p>
            </div>
            <Switch
              checked={setting.is_active}
              disabled={isTogglingStatus}
              onCheckedChange={handleToggleEventStatus}
              className="data-[state=checked]:bg-leaf"
            />
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2 rounded-2xl border-ink/10 font-bold text-ink hover:bg-cloud h-11 px-4 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky" />
            <span className="text-xs sm:text-sm">Export CSV</span>
          </Button>

          <Button
            onClick={() => setManualModalOpen(true)}
            className="flex items-center gap-2 bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl shadow-sm h-11 px-5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Tambah Manual</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mb-3 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Total Pendaftar</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-ink mt-0.5">{stats.total}</p>
          <p className="text-[11px] text-ink-400 mt-1">Seluruh prospek masuk</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mb-3 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Siap Hadir</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-leaf-600 mt-0.5">{stats.confirmed}</p>
          <p className="text-[11px] text-ink-400 mt-1">Konfirmasi hadir fisik</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mb-3 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Kindergarten</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-gold-600 mt-0.5">{stats.kindergarten}</p>
          <p className="text-[11px] text-ink-400 mt-1">Peminat Playgroup/TK</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Primary School</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-sky mt-0.5">{stats.primary}</p>
          <p className="text-[11px] text-ink-400 mt-1">Peminat Sekolah Dasar</p>
        </div>

        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-3xl p-5 border border-ink/10 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <p className="text-xs text-ink-300 font-semibold uppercase tracking-wider">Terkonversi Admisi</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-purple-600 mt-0.5">{stats.converted}</p>
          <p className="text-[11px] text-ink-400 mt-1">Lanjut daftar siswa baru</p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input
              type="text"
              placeholder="Cari nama anak, nama orang tua, tiket, no WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-4 rounded-2xl bg-cloud border border-ink/5 text-sm font-semibold text-ink outline-none focus:border-sky cursor-pointer"
          >
            <option value="ALL">Semua Status Follow-Up</option>
            <option value="NEW_LEAD">Lead Baru</option>
            <option value="CONFIRMED_ATTENDING">Siap Hadir</option>
            <option value="ATTENDED">Hadir di Lokasi</option>
            <option value="FOLLOW_UP_PROGRESS">Proses Follow-Up</option>
            <option value="CONVERTED_TO_APPLICANT">Daftar Siswa Baru</option>
            <option value="NOT_INTERESTED">Batal / Tidak Berminat</option>
          </select>

          {/* Program Filter */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="h-12 px-4 rounded-2xl bg-cloud border border-ink/5 text-sm font-semibold text-ink outline-none focus:border-sky cursor-pointer"
          >
            <option value="ALL">Semua Jenjang</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Primary School">Primary School</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-12 px-4 rounded-2xl bg-cloud border border-ink/5 text-sm font-semibold text-ink outline-none focus:border-sky cursor-pointer"
          >
            <option value="ALL">Semua Jadwal</option>
            <option value="29 Agustus">Sabtu, 29 Agustus 2026</option>
            <option value="30 Agustus">Ahad, 30 Agustus 2026</option>
          </select>
        </div>
      </div>

      {/* 4. TABLE SECTION */}
      <div className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Daftar Partisipan Open House</h2>
            <p className="text-xs text-ink-300">Menampilkan {filteredLeads.length} data pendaftar</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-ink-300 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky" />
            <p className="text-sm font-medium">Memuat data leads Open House...</p>
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-12 text-center text-ink-300 space-y-2">
            <p className="font-bold text-base text-ink">Belum ada data pendaftar yang cocok</p>
            <p className="text-xs text-ink-400">Silakan sesuaikan kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cloud text-ink-300 text-xs font-bold uppercase tracking-wider border-b border-ink/5">
                <tr>
                  <th className="py-4 px-6">Calon Siswa & Jenjang</th>
                  <th className="py-4 px-6">Orang Tua / Wali</th>
                  <th className="py-4 px-6">Jadwal Kehadiran</th>
                  <th className="py-4 px-6">Minat & Konsultasi</th>
                  <th className="py-4 px-6">Status Follow-Up</th>
                  <th className="py-4 px-6 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {paginatedLeads.map((lead) => {
                  const statusInfo = LEAD_STATUS_CONFIG[lead.lead_status] || LEAD_STATUS_CONFIG.NEW_LEAD;

                  return (
                    <tr key={lead.id} className="hover:bg-cloud/50 transition-colors">
                      {/* 1. Child Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {lead.target_program?.toLowerCase().includes('kindergarten') ? '🧸' : '🎓'}
                          </div>
                          <div>
                            <p className="font-bold text-ink text-sm flex items-center gap-2">
                              {lead.child_name}
                              {lead.child_age ? (
                                <span className="text-[11px] font-normal text-ink-400">({lead.child_age} Thn)</span>
                              ) : null}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  lead.target_program?.toLowerCase().includes('kindergarten')
                                    ? 'bg-gold-50 text-gold-700'
                                    : 'bg-sky-50 text-sky-700'
                                }`}
                              >
                                {lead.target_program}
                              </span>
                              <span className="text-[11px] text-ink-300">• Masuk {lead.entry_year}</span>
                            </div>
                            <span className="font-mono text-[10px] text-ink-300 block mt-0.5">
                              {lead.ticket_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Parent Info */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-ink text-sm">{lead.parent_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-ink-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-leaf-600" />
                          <span>{lead.whatsapp}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-400 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-sky" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      </td>

                      {/* 3. Schedule */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <Calendar className="w-3.5 h-3.5 text-gold-600" />
                            <span>{lead.attendance_date || 'Belum dipilih'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-ink-400">
                            <Clock className="w-3.5 h-3.5 text-sky" />
                            <span>{lead.attendance_session || 'Sesi 1'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Consultation & Topics */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              lead.admission_consultation === 'Ya'
                                ? 'bg-leaf-50 text-leaf-700'
                                : lead.admission_consultation === 'Mungkin'
                                ? 'bg-gold-50 text-gold-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Konsultasi: {lead.admission_consultation || 'Ya'}
                          </span>
                          <p className="text-[11px] text-ink-400 truncate max-w-[160px]" title={(lead.topics_of_interest || []).join(', ')}>
                            {(lead.topics_of_interest || []).length} Topik Diminati
                          </p>
                        </div>
                      </td>

                      {/* 5. Lead Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* 6. Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Follow up WhatsApp */}
                          <button
                            type="button"
                            title="Chat Follow-Up WhatsApp"
                            onClick={() => handleWhatsAppFollowUp(lead)}
                            className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Follow up Email */}
                          <button
                            type="button"
                            title="Kirim Email Follow-Up Resmi"
                            onClick={() => {
                              setSelectedLead(lead);
                              setEmailCustomMessage('');
                              setEmailFeedback(null);
                              setEmailModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-xl bg-sky-50 text-sky hover:bg-sky hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* View Detail */}
                          <button
                            type="button"
                            title="Lihat Detail & Catatan"
                            onClick={() => handleOpenDetail(lead)}
                            className="w-8 h-8 rounded-xl bg-cloud text-ink-400 hover:bg-ink hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Hapus"
                            onClick={() => {
                              setLeadToDelete(lead);
                              setDeleteModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-xl bg-coral-50 text-coral hover:bg-coral hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-ink/5 flex items-center justify-between text-xs text-ink-400">
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 text-xs cursor-pointer"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl h-8 text-xs cursor-pointer"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL DETAIL DATA & CATATAN FOLLOW-UP */}
      {/* ============================================================ */}
      {detailModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-sky uppercase tracking-wider">
                  Kode Tiket: {selectedLead.ticket_code}
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">
                  Detail Partisipan Open House
                </h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-ink flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-cloud border border-slate-100">
                <span className="text-xs text-ink-300 font-semibold block mb-1">Calon Siswa</span>
                <p className="font-bold text-ink text-base">
                  {selectedLead.child_name}{' '}
                  {selectedLead.child_age ? `(${selectedLead.child_age} Tahun)` : ''}
                </p>
                <p className="text-xs text-sky font-semibold mt-0.5">
                  {selectedLead.target_program} • Rencana {selectedLead.entry_year}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cloud border border-slate-100">
                <span className="text-xs text-ink-300 font-semibold block mb-1">Orang Tua / Wali</span>
                <p className="font-bold text-ink text-base">{selectedLead.parent_name}</p>
                <p className="text-xs text-ink-400 mt-0.5">WA: {selectedLead.whatsapp}</p>
                <p className="text-xs text-ink-400">Email: {selectedLead.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-cloud border border-slate-100">
                <span className="text-xs text-ink-300 font-semibold block mb-1">Jadwal & Sesi Kehadiran</span>
                <p className="font-bold text-ink">{selectedLead.attendance_date}</p>
                <p className="text-xs text-gold-600 font-semibold mt-0.5">{selectedLead.attendance_session}</p>
                <p className="text-xs text-ink-400 mt-1">Minat Hadir: <strong>{selectedLead.interest_attendance}</strong></p>
              </div>

              <div className="p-4 rounded-2xl bg-cloud border border-slate-100">
                <span className="text-xs text-ink-300 font-semibold block mb-1">Konsultasi Pribadi & Sumber</span>
                <p className="font-bold text-ink">Konsultasi: {selectedLead.admission_consultation}</p>
                <p className="text-xs text-ink-400 mt-0.5">Sumber Info: {selectedLead.source_info}</p>
              </div>
            </div>

            {/* Topics of Interest Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Topik yang Paling Ingin Diketahui:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedLead.topics_of_interest || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow-up Status Update Section */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="font-display text-base font-bold text-ink">Manajemen Status & Catatan Tim Admission</h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-400">Ubah Status Prospek Lead:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white font-semibold text-sm outline-none focus:border-sky"
                >
                  <option value="NEW_LEAD">Lead Baru</option>
                  <option value="CONFIRMED_ATTENDING">Siap Hadir (Confirmed)</option>
                  <option value="ATTENDED">Hadir di Lokasi Open House</option>
                  <option value="FOLLOW_UP_PROGRESS">Proses Follow-Up (Chat/Call)</option>
                  <option value="CONVERTED_TO_APPLICANT">Daftar Siswa Baru (Converted)</option>
                  <option value="NOT_INTERESTED">Batal / Tidak Berminat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-400">Catatan Follow-Up Staf:</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Tulis ringkasan hasil chat/call dengan orang tua..."
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-sky resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => handleWhatsAppFollowUp(selectedLead)}
                    className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Follow-Up WhatsApp</span>
                  </Button>
                </div>

                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="h-10 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingNotes ? 'Menyimpan...' : 'Simpan Status & Catatan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL EMAIL FOLLOW-UP RESEND */}
      {/* ============================================================ */}
      {emailModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">Kirim Email Follow-Up Resmi</h3>
                <p className="text-xs text-ink-400 mt-0.5">Kepada: {selectedLead.parent_name} ({selectedLead.email})</p>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-ink flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 text-xs text-sky-800 space-y-1">
                <p className="font-bold">Template Email Resmi JACOS Admission</p>
                <p>Email akan memuat header branding JACOS, informasi tiket Open House, penawaran promo pendaftaran, dan tombol direct WA admission.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-400">Pesan Tambahan Khusus (Opsional):</label>
                <textarea
                  rows={4}
                  value={emailCustomMessage}
                  onChange={(e) => setEmailCustomMessage(e.target.value)}
                  placeholder="Contoh: Kami telah menyiapkan penawaran khusus potongan biaya formulir bagi ananda jika mendaftar minggu ini..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-sky resize-none"
                />
              </div>

              {emailFeedback && (
                <p className={`text-xs font-semibold ${emailFeedback.includes('berhasil') ? 'text-leaf-600' : 'text-coral-600'}`}>
                  {emailFeedback}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-xl h-11 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingEmail}
                  className="rounded-xl bg-sky hover:bg-sky-600 text-white font-bold h-11 text-xs flex items-center gap-2 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Sekarang</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL INPUT PENDAFTARAN MANUAL */}
      {/* ============================================================ */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">Input Pendaftar Manual / On-Spot</h3>
                <p className="text-xs text-ink-400 mt-0.5">Untuk tamu walk-in atau pendaftaran via telepon.</p>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-ink flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Nama Orang Tua *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.parent_name}
                    onChange={(e) => setManualForm({ ...manualForm, parent_name: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={manualForm.whatsapp}
                    onChange={(e) => setManualForm({ ...manualForm, whatsapp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Email Aktif *</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Nama Ananda *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.child_name}
                    onChange={(e) => setManualForm({ ...manualForm, child_name: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Jenjang Minat</label>
                  <select
                    value={manualForm.target_program}
                    onChange={(e) => setManualForm({ ...manualForm, target_program: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  >
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Primary School">Primary School</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-400">Tahun Masuk</label>
                  <select
                    value={manualForm.entry_year}
                    onChange={(e) => setManualForm({ ...manualForm, entry_year: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 outline-none focus:border-sky text-sm"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManualModalOpen(false)}
                  className="rounded-xl h-11 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="rounded-xl bg-sky hover:bg-sky-600 text-white font-bold h-11 text-xs cursor-pointer"
                >
                  {isSubmittingManual ? 'Menyimpan...' : 'Simpan Pendaftar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. MODAL DELETE CONFIRMATION */}
      {/* ============================================================ */}
      {deleteModalOpen && leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-display text-lg font-bold text-ink">Hapus Data Pendaftar?</h3>
              <p className="text-xs text-ink-400">
                Data pendaftar ananda <strong>{leadToDelete.child_name}</strong> ({leadToDelete.ticket_code}) akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 rounded-2xl h-11 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-2xl bg-coral hover:bg-coral-600 text-white font-bold h-11 text-xs cursor-pointer"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
