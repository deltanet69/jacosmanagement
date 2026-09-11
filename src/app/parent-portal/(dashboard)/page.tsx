"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { createParentClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { 
  Car, 
  UserCircle, 
  Users, 
  CheckCircle2, 
  CalendarCheck, 
  Megaphone, 
  Receipt, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  XCircle,
  PiggyBank,
  BookOpen,
  User,
  ChevronRight,
  RefreshCcw,
  X
} from 'lucide-react';
import { uploadJacosAgreement, getParentDashboardData, getParentAnnouncements } from '@/app/parent-portal/actions';

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // QR Generator Modal States
  const [showQR, setShowQR] = useState(false);
  const [qrKey, setQrKey] = useState(Date.now());
  const [pickerType, setPickerType] = useState('parent');
  const [pickerName, setPickerName] = useState('');
  const [pickerRole, setPickerRole] = useState('');
  
  // Agreement States
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [agreementDoc, setAgreementDoc] = useState<any>(null);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const supabase = createParentClient();

  useEffect(() => {
    const fetchStatusAndStudent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        const user = session.user;
        const userEmail = user.email;
        const studentIdFromMeta = user.user_metadata?.student_id;
        const applicantIdFromMeta = user.user_metadata?.applicant_id;

        // Fetch dashboard metadata and announcements in parallel
        const [dashboardRes, annRes] = await Promise.all([
          getParentDashboardData(
            applicantIdFromMeta || null, 
            userEmail || null, 
            studentIdFromMeta || null
          ),
          getParentAnnouncements(),
        ]);

        if (annRes.success && annRes.data) {
          setAnnouncements(annRes.data);
        }

        const { applicantData, applicantId: resolvedApplicantId, studentId } = dashboardRes;
        let applicantId = resolvedApplicantId;
        let resolvedStudentId = studentId;
        let resolvedStatus = 'Approved';

        if (applicantData) {
          if (applicantData.doc_jacos_agreement) {
            setAgreementDoc({
              file_path: applicantData.doc_jacos_agreement,
              status: applicantData.doc_jacos_agreement_status || 'PENDING',
              verification: applicantData.doc_jacos_agreement_status || 'PENDING',
              review_note: applicantData.doc_jacos_agreement_note || null,
            });
          } else if (applicantData.documents) {
            const agreement = applicantData.documents.find((d: any) => d.type === 'JACOS_AGREEMENT');
            if (agreement) {
              setAgreementDoc(agreement);
            }
          }

          if (applicantData.status === 'ENROLLED' || applicantData.student_record_id) {
            resolvedStatus = 'Approved';
            if (!resolvedStudentId && applicantData.student_record_id) {
              resolvedStudentId = applicantData.student_record_id;
            }
          } else if (applicantData.status === 'REJECTED') {
            resolvedStatus = 'Rejected';
          } else {
            resolvedStatus = 'Waiting for approval';
          }
        } else if (studentIdFromMeta) {
          resolvedStatus = 'Approved';
        }

        setStatus(resolvedStatus);
        setApplicantId(applicantId);

        let loadedStudent = null;
        if (resolvedStudentId) {
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, nis, nisn, school_classes(name, grade)')
            .eq('id', resolvedStudentId)
            .maybeSingle();

          if (studentData) loadedStudent = studentData;
        }

        if (!loadedStudent && userEmail) {
          const { data: guardians } = await supabase
            .from('guardians')
            .select('applicant_id, applicants(student_record_id)')
            .ilike('email', userEmail)
            .limit(1);

          const studentRecordId = (guardians?.[0] as any)?.applicants?.student_record_id;
          if (studentRecordId) {
            const { data: studentData } = await supabase
              .from('students')
              .select('id, full_name, nis, nisn, school_classes(name, grade)')
              .eq('id', studentRecordId)
              .maybeSingle();

            if (studentData) loadedStudent = studentData;
          }
        }

        if (!loadedStudent) {
          const { data: firstStudent } = await supabase
            .from('students')
            .select('id, full_name, nis, nisn, school_classes(name, grade)')
            .eq('is_active', true)
            .order('full_name', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstStudent) {
            loadedStudent = firstStudent;
          }
        }

        setStudent(loadedStudent);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatusAndStudent();

    const channel = supabase
      .channel("realtime_dashboard_announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const res = await getParentAnnouncements();
          if (res.success && res.data) {
            setAnnouncements(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleOpenQRModal = () => {
    setQrKey(Date.now());
    setShowQR(true);
  };

  const handleGenerateQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickerType === 'other' && (!pickerName.trim() || !pickerRole.trim())) {
      alert("Harap lengkapi nama dan peran penjemput.");
      return;
    }
    setQrKey(Date.now());
  };

  const handleAgreementUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementFile) return;
    if (!applicantId) {
      alert("Tidak dapat mengunggah dokumen: Data pendaftaran tidak ditemukan. Silakan hubungi admin.");
      return;
    }

    setUploadingAgreement(true);
    try {
      const formData = new FormData();
      formData.append("file", agreementFile);
      
      const res = await uploadJacosAgreement(applicantId, formData);
      if (!res.success) {
        throw new Error(res.message);
      }

      window.location.reload();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Gagal mengupload dokumen: " + err.message);
    } finally {
      setUploadingAgreement(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky border-t-transparent rounded-full animate-spin"></div>
          <p className="text-ink-400 font-bold text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'Waiting for approval') {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-6 sm:p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-ink">Menunggu Persetujuan</h2>
          <p className="text-ink-400 text-sm">
            Pendaftaran Anda sedang ditinjau oleh staf admin kami. Kami akan memberi tahu Anda setelah disetujui.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'Rejected') {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-6 sm:p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-coral">Pendaftaran Ditolak</h2>
          <p className="text-ink-400 text-sm">
            Mohon maaf, pendaftaran Anda ditolak. Silakan hubungi admin sekolah untuk informasi lebih lanjut.
          </p>
          <a href="https://wa.me/628123456789" target="_blank" rel="noreferrer" className="block mt-4">
            <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-sm">
              Hubungi Admin via WhatsApp
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const isAgreementApproved = agreementDoc && (agreementDoc.verification === 'VERIFIED' || agreementDoc.status === 'VERIFIED');
  const isAgreementPending = agreementDoc && (agreementDoc.verification === 'PENDING' || agreementDoc.verification === 'REVIEWING' || agreementDoc.status === 'PENDING' || agreementDoc.status === 'WAITING_VERIFICATION');
  const isAgreementRejected = agreementDoc && (agreementDoc.verification === 'REJECTED' || agreementDoc.status === 'REJECTED');

  const renderAgreementOverlay = () => {
    return (
      <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-ink/10 p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border ${isAgreementPending ? 'bg-sun-50 border-sun/20' : 'bg-sky-50 border-sky/20'}`}>
                {isAgreementPending 
                  ? <Clock size={32} className="text-sun" />
                  : <ShieldCheck size={32} className="text-sky" />
                }
              </div>
              <h2 className="font-display text-xl md:text-3xl font-bold text-ink">
                {isAgreementPending ? 'Dokumen Sedang Ditinjau' : 'Verifikasi Declaration Agreements'}
              </h2>
              <p className="text-ink-400 text-xs sm:text-sm px-2">
                {isAgreementPending
                  ? 'Dokumen Declaration Agreements Anda telah kami terima dan sedang dalam proses verifikasi oleh tim Admin.'
                  : 'Untuk membuka seluruh fitur Parent Portal, Anda perlu mengunduh, menandatangani, dan mengunggah kembali dokumen persetujuan.'
                }
              </p>
            </div>

            {(!agreementDoc || isAgreementRejected) && (
              <div className="space-y-4">
                {isAgreementRejected && (
                  <div className="bg-coral-50 border border-coral-200 rounded-2xl p-4 flex gap-3">
                    <XCircle className="text-coral shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-coral-700 text-sm mb-0.5">Dokumen Anda Ditolak</p>
                      <p className="text-xs text-coral-600 font-medium">{agreementDoc.review_note || "Silakan upload ulang dengan benar."}</p>
                    </div>
                  </div>
                )}

                <div className="bg-cloud p-4 sm:p-5 rounded-2xl border border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm mb-0.5">1. Unduh Dokumen</h3>
                    <p className="text-xs text-ink-400">Unduh dokumen PDF, cetak dan beri tanda tangan + Materai.</p>
                  </div>
                  <a 
                    href="/publicjacos/agreements/PD_LETTER_JACOS.pdf" 
                    download
                    target="_blank"
                    className="h-9 px-4 bg-white border border-sky/20 hover:border-sky text-sky font-bold text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-2xs transition"
                  >
                    <ExternalLink size={14} /> Unduh PDF
                  </a>
                </div>

                <div className="bg-cloud p-4 sm:p-5 rounded-2xl border border-ink/5">
                  <h3 className="font-bold text-sm mb-1">2. Unggah Dokumen</h3>
                  <p className="text-xs text-ink-400 mb-3">Foto/scan dokumen yang sudah ditandatangani dengan jelas.</p>
                  <form onSubmit={handleAgreementUpload} className="space-y-3">
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      required
                      onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-ink-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky file:text-white hover:file:bg-sky-600 file:cursor-pointer"
                    />
                    <Button 
                      type="submit" 
                      disabled={uploadingAgreement || !agreementFile}
                      className="w-full h-11 bg-sky hover:bg-sky-600 rounded-xl font-bold text-xs shadow-sm"
                    >
                      {uploadingAgreement ? 'Mengunggah...' : 'Kirim Dokumen'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const studentName = student?.full_name || 'Siswa JACOS';
  const className = Array.isArray(student?.school_classes) 
    ? student?.school_classes[0]?.name 
    : student?.school_classes?.name || 'Grade 1';

  const qrPayload = JSON.stringify({
    studentId: student?.id || 'student-demo',
    timestamp: qrKey,
    picker: pickerType === 'parent' ? 'Orang Tua' : pickerName || 'Utusan',
    role: pickerType === 'parent' ? 'Orang Tua / Wali Utama' : pickerRole || 'Utusan Penjemput'
  });

  return (
    <>
      {!isAgreementApproved && renderAgreementOverlay()}
      
      <div className={`space-y-5 sm:space-y-6 ${!isAgreementApproved ? 'pointer-events-none opacity-50 blur-sm h-[calc(100vh-80px)] overflow-hidden' : ''}`}>
        
        {/* Welcome Header (Compact on mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink">Ringkasan Aktivitas</h1>
            <p className="text-ink-400 text-xs sm:text-sm mt-0.5">Pantau absensi, penjemputan, dan kegiatan harian siswa.</p>
          </div>
          
          <Link href="/parent-portal/penjemputan" className="hidden sm:inline-block">
            <Button variant="outline" size="sm" className="rounded-xl border-ink/10 font-bold text-xs gap-1.5 hover:bg-cloud">
              <Car size={15} className="text-purple-600" />
              Sistem Penjemputan Lengkap
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>

        {/* HERO SECTION: Penjemputan Quick Action Banner */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-600 p-5 sm:p-6 rounded-3xl text-white shadow-md shadow-purple-600/10 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10.5px] font-extrabold text-purple-200 uppercase tracking-wider inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                <ShieldCheck size={13} /> Penjemputan Digital JACOS
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                Siap Menjemput {studentName.split(' ')[0]} Hari Ini?
              </h2>
              <p className="text-xs text-purple-100 font-medium">
                Tampilkan QR Code kepada petugas security saat tiba di gerbang penjemputan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              <Button 
                onClick={handleOpenQRModal}
                className="flex-1 sm:flex-none h-10 sm:h-11 bg-white text-purple-900 hover:bg-purple-50 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 px-4"
              >
                <Sparkles size={15} className="mr-1.5 text-purple-600" />
                Generate QR Code
              </Button>
              <Link href="/parent-portal/penjemputan">
                <Button 
                  size="icon"
                  variant="secondary"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/30 text-white rounded-xl border-none backdrop-blur-sm shrink-0"
                  title="Buka Halaman Penjemputan"
                >
                  <ExternalLink size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Metrics Grid (Compact for mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Attendance Metric */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-ink/5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider truncate">Kehadiran</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <CalendarCheck size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-sky">98%</p>
              <p className="text-[10.5px] font-semibold text-leaf-600 mt-0.5 flex items-center gap-1 truncate">
                <CheckCircle2 size={11} className="shrink-0" /> Tepat Waktu
              </p>
            </div>
          </div>

          {/* Finance Status Metric */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-ink/5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider truncate">SPP Bulanan</span>
              <div className="w-7 h-7 rounded-lg bg-gold-50 flex items-center justify-center text-gold-600 shrink-0">
                <Receipt size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600">Lunas</p>
              <p className="text-[10.5px] font-medium text-ink-400 mt-0.5 truncate">
                Bulan September
              </p>
            </div>
          </div>

          {/* Tabungan Shortcut Metric */}
          <Link 
            href="/parent-portal/tabungan" 
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-ink/5 flex flex-col justify-between hover:border-emerald-200 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider truncate group-hover:text-emerald-700">Tabungan</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <PiggyBank size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-display text-lg sm:text-2xl font-extrabold text-ink truncate">Rp 1.450.000</p>
              <p className="text-[10.5px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
                <span>Tabungan Aktif</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </Link>

          {/* Student Profile Shortcut Metric */}
          <Link 
            href="/parent-portal/profil-siswa" 
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-ink/5 flex flex-col justify-between hover:border-sky-200 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider truncate group-hover:text-sky">Profil Siswa</span>
              <div className="w-7 h-7 rounded-lg bg-leaf-50 flex items-center justify-center text-leaf-600 shrink-0">
                <User size={15} />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-display text-sm sm:text-base font-bold text-ink truncate">{studentName}</p>
              <p className="text-[10.5px] font-semibold text-sky mt-0.5 flex items-center gap-0.5">
                <span>{className}</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </Link>
        </div>

        {/* Main Grid: Information Feed & Classroom Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Information Section (Compact Feed) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xs border border-ink/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                  <Megaphone size={16} />
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-ink">Informasi Sekolah</h2>
              </div>
              <Link href="/parent-portal/informasi">
                <span className="text-xs font-bold text-sky hover:underline flex items-center gap-1">
                  Lihat Semua <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-6 text-center bg-cloud/50 rounded-2xl border border-ink/5">
                  <p className="text-xs text-ink-400 font-semibold">Belum ada informasi terbaru dari sekolah.</p>
                </div>
              ) : (
                announcements.slice(0, 2).map((item: any) => {
                  const cleanSnippet = item.content
                    ? item.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
                    : '';
                  const excerpt = cleanSnippet.length > 100 ? cleanSnippet.substring(0, 100) + '...' : cleanSnippet;
                  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <Link
                      key={item.id}
                      href="/parent-portal/informasi"
                      className="block p-3.5 sm:p-4 rounded-2xl border border-ink/5 bg-cloud/30 hover:bg-sky-50/40 hover:border-sky/20 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center shrink-0 text-sky font-bold text-xs mt-0.5">
                          <Megaphone size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-ink text-xs sm:text-sm truncate">
                              {item.title}
                            </h3>
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md shrink-0">
                              {item.category || 'Umum'}
                            </span>
                          </div>
                          {excerpt && (
                            <p className="text-[11.5px] font-medium text-ink-400 mt-1 line-clamp-1 leading-relaxed">
                              {excerpt}
                            </p>
                          )}
                          <span className="text-[10px] font-semibold text-ink-300 mt-1.5 block">
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Classroom Card */}
          <div className="bg-white rounded-3xl shadow-2xs border border-ink/5 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600 shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <h3 className="font-display text-base font-bold text-ink">Classroom Hari Ini</h3>
                </div>
                <Link href="/parent-portal/classroom">
                  <span className="text-xs font-bold text-sky hover:underline">Jadwal</span>
                </Link>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-cloud/50 rounded-2xl border border-ink/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] font-bold text-sky-600">08:00 - 09:30</p>
                    <p className="text-xs font-bold text-ink mt-0.5">Matematika</p>
                    <p className="text-[10px] text-ink-400">Ust. Ahmad</p>
                  </div>
                  <span className="text-[10px] font-bold text-leaf bg-leaf-50 px-2 py-0.5 rounded-full border border-leaf-100">
                    Selesai
                  </span>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky/15 flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] font-bold text-sky-700">09:45 - 11:15</p>
                    <p className="text-xs font-bold text-ink mt-0.5">Bahasa Indonesia</p>
                    <p className="text-[10px] text-ink-400">Ms. Sarah</p>
                  </div>
                  <span className="text-[10px] font-bold text-sky bg-sky-100 px-2 py-0.5 rounded-full">
                    Sedang Berlangsung
                  </span>
                </div>
              </div>
            </div>

            <Link href="/parent-portal/classroom" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full rounded-xl border-ink/10 font-bold text-xs text-ink-500 hover:text-ink">
                Buka Seluruh Jadwal & Absensi
              </Button>
            </Link>
          </div>
        </div>

        {/* QR Code Modal Dialog */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink/5">
                <div className="text-left">
                  <h3 className="font-display text-lg font-bold text-ink">QR Penjemputan</h3>
                  <p className="text-[11px] text-ink-400">Tunjukkan kode ini ke security.</p>
                </div>
                <button 
                  onClick={() => setShowQR(false)} 
                  className="w-8 h-8 rounded-xl bg-cloud flex items-center justify-center text-ink-400 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>

              {/* QR Code Canvas */}
              <div className="bg-cloud p-4 rounded-2xl border border-ink/5 inline-block mx-auto mb-4">
                <QRCodeSVG value={qrPayload} size={180} level="M" />
              </div>

              <div className="space-y-1 mb-4 text-xs">
                <p className="font-bold text-ink">{studentName}</p>
                <p className="text-ink-400">{className} • NIS: {student?.nis || '202601001'}</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setQrKey(Date.now())}
                  variant="outline" 
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  <RefreshCcw size={13} className="mr-1" />
                  Perbarui QR
                </Button>
                <Button 
                  onClick={() => setShowQR(false)}
                  className="flex-1 bg-sky hover:bg-sky-600 rounded-xl text-xs font-bold"
                >
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
