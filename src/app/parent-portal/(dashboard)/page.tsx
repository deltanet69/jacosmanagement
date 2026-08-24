"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { createBrowserClient } from '@supabase/ssr';
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
  XCircle
} from 'lucide-react';
import { uploadJacosAgreement, getParentDashboardData } from '@/app/parent-portal/actions';

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStatusAndStudent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        // Refresh session untuk mendapatkan user_metadata terbaru
        await supabase.auth.refreshSession();
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const user = freshSession?.user || session.user;
        const userEmail = user.email;
        const studentIdFromMeta = user.user_metadata?.student_id;

        const applicantIdFromMeta = user.user_metadata?.applicant_id;

        let resolvedStatus = 'Approved'; // default: biarkan masuk
        
        // Fetch data via server action to bypass RLS on documents table
        const { applicantData, applicantId: resolvedApplicantId, studentId } = await getParentDashboardData(
          applicantIdFromMeta || null, 
          userEmail || null, 
          studentIdFromMeta || null
        );
        
        let applicantId = resolvedApplicantId;
        let resolvedStudentId = studentId;

        // 4. Set state berdasarkan data yang ditemukan
        if (applicantData) {
          if (applicantData.documents) {
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

        // 2. Load student data
        let loadedStudent = null;
        if (resolvedStudentId) {
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, nis, school_classes(name)')
            .eq('id', resolvedStudentId)
            .maybeSingle();

          if (studentData) loadedStudent = studentData;
        }

        if (!loadedStudent) {
          loadedStudent = {
            id: resolvedStudentId || 'student-demo',
            full_name: user.user_metadata?.student_name || 'Ananda Siswa JACOS',
            school_classes: [{ name: 'Grade 1 - Al-Fatih' }]
          };
        }

        setStudent(loadedStudent);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatusAndStudent();
  }, [supabase]);

  // Auto reload QR every 30 seconds for security when modal is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR) {
      interval = setInterval(() => {
        setQrKey(Date.now());
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showQR]);

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

      // Reload page to reflect changes
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
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-8 text-center space-y-4">
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
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-8 text-center space-y-4">
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

  // Enum verification yang valid: PENDING, REJECTED, VERIFIED
  const isAgreementApproved = agreementDoc && agreementDoc.verification === 'VERIFIED';
  const isAgreementPending = agreementDoc && (agreementDoc.verification === 'PENDING' || agreementDoc.verification === 'REVIEWING');
  const isAgreementRejected = agreementDoc && agreementDoc.verification === 'REJECTED';

  // Modal Dokumen Agreement
  const renderAgreementOverlay = () => {
    return (
      <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-ink/10 p-6 md:p-8 space-y-6">
            
            <div className="text-center space-y-3">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border ${isAgreementPending ? 'bg-sun-50 border-sun/20' : 'bg-sky-50 border-sky/20'}`}>
                {isAgreementPending 
                  ? <Clock size={36} className="text-sun" />
                  : <ShieldCheck size={36} className="text-sky" />
                }
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">
                {isAgreementPending ? 'Dokumen Sedang Ditinjau' : 'Verifikasi Declaration Agreements'}
              </h2>
              <p className="text-ink-400 text-sm md:text-base px-4">
                {isAgreementPending
                  ? 'Dokumen Declaration Agreements Anda telah kami terima dan sedang dalam proses verifikasi oleh tim Admin. Anda akan mendapat notifikasi setelah disetujui.'
                  : 'Untuk membuka seluruh fitur Parent Portal, Anda perlu mengunduh, menandatangani, dan mengunggah kembali dokumen persetujuan (Declaration Agreements).'
                }
              </p>
            </div>

            {/* Case 1: Belum ada dokumen atau dokumen ditolak — tampilkan form upload */}
            {(!agreementDoc || isAgreementRejected) ? (
              <div className="space-y-6">
                
                {isAgreementRejected && (
                  <div className="bg-coral-50 border border-coral-200 rounded-2xl p-4 flex gap-3">
                    <XCircle className="text-coral shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-coral-700 text-sm mb-1">Dokumen Anda Ditolak</p>
                      <p className="text-xs text-coral-600 font-medium">Catatan Admin: {agreementDoc.review_note || "Silakan upload ulang dengan benar."}</p>
                    </div>
                  </div>
                )}

                <div className="bg-cloud p-6 rounded-2xl border border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-md mb-1">1. Unduh Dokumen</h3>
                    <p className="text-sm text-ink-400">Silakan unduh dokumen PDF ini, lalu cetak dan berikan tanda tangan basah serta Materai 10.000.</p>
                  </div>
                  <a 
                    href="/publicjacos/agreements/PD_LETTER_JACOS.pdf" 
                    download
                    target="_blank"
                    className="h-10 px-6 bg-white border border-sky/20 hover:border-sky text-sky font-bold text-sm rounded-xl flex items-center gap-2 whitespace-nowrap shadow-sm transition"
                  >
                    <ExternalLink size={16} /> Unduh PDF
                  </a>
                </div>

                <div className="bg-cloud p-6 rounded-2xl border border-ink/5">
                  <h3 className="font-bold text-md mb-1">2. Unggah Dokumen</h3>
                  <p className="text-sm text-ink-400 mb-4">Scan atau foto dokumen yang sudah ditandatangani beserta materai dengan jelas.</p>
                  <form onSubmit={handleAgreementUpload} className="space-y-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        required
                        onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-ink-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky hover:file:bg-sky-100 transition cursor-pointer bg-white border border-ink/10 rounded-xl" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-sky hover:bg-sky-600 text-white font-bold h-12 rounded-xl"
                      disabled={uploadingAgreement || !agreementFile}
                    >
                      {uploadingAgreement ? 'Mengunggah...' : 'Unggah Dokumen'}
                    </Button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="bg-sun-50 border border-sun-200 rounded-2xl p-6 text-center space-y-3">
                <Clock className="mx-auto text-sun" size={32} />
                <h3 className="font-bold text-sun-700 text-lg">Dokumen Sedang Ditinjau</h3>
                <p className="text-sm text-sun-600">
                  Terima kasih, dokumen persetujuan Anda telah kami terima dan sedang dalam proses verifikasi oleh Admin. Harap periksa kembali beberapa saat lagi.
                </p>
                <div className="pt-4">
                  <Button variant="outline" className="border-sun-300 text-sun-700 hover:bg-sun-100" onClick={() => window.location.reload()}>
                    Refresh Status
                  </Button>
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
      
      <div className={`space-y-8 pb-12 ${!isAgreementApproved ? 'pointer-events-none opacity-50 blur-sm h-[calc(100vh-80px)] overflow-hidden' : ''}`}>
        {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Ringkasan Aktivitas</h1>
          <p className="text-ink-400 mt-1">Selamat datang di Parent Portal JACOS Islamic School.</p>
        </div>
        <Link href="/parent-portal/penjemputan">
          <Button variant="outline" className="rounded-2xl border-ink/10 font-bold text-xs gap-2 hover:bg-cloud">
            <Car size={16} className="text-purple-600" />
            Fitur Penjemputan Lengkap
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ink/5 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-2 text-ink-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CalendarCheck size={16} className="text-sky" /> Kehadiran Siswa
            </div>
            <p className="font-display text-4xl font-extrabold text-sky">98%</p>
            <p className="text-xs font-semibold text-leaf-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} /> Hadir Tepat Waktu Bulan Ini
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <CalendarCheck size={28} />
          </div>
        </div>

        {/* Integrated Pickup QR Card (Direct Action) */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-md shadow-purple-600/10 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <span className="text-[11px] font-bold text-purple-200 uppercase tracking-widest block mb-1 flex items-center gap-1">
                <ShieldCheck size={14} /> QR Penjemputan
              </span>
              <h3 className="font-display text-xl font-bold">Jemput {studentName.split(' ')[0]}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
          </div>

          <div className="relative z-10 flex gap-2 pt-2">
            <Button 
              onClick={handleOpenQRModal}
              className="flex-1 h-11 bg-white text-purple-900 hover:bg-purple-50 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95"
            >
              <Sparkles size={16} className="mr-1.5 text-purple-600" />
              Generate QR Code
            </Button>
            <Link href="/parent-portal/penjemputan">
              <Button 
                size="icon"
                variant="secondary"
                className="w-11 h-11 bg-white/20 hover:bg-white/30 text-white rounded-xl border-none backdrop-blur-sm"
                title="Buka Halaman Penjemputan"
              >
                <ExternalLink size={18} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Finance Overview Card */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ink/5 flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-2 text-ink-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Receipt size={16} className="text-gold-600" /> Tagihan SPP
            </div>
            <p className="font-display text-2xl font-extrabold text-ink">Lunas</p>
            <p className="text-xs font-semibold text-ink-400 mt-1">Periode September 2026</p>
          </div>
          <Link href="/parent-portal/finance">
            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-sky hover:bg-sky-50">
              Rincian <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Information Feed & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Information Section */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-ink/5 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Megaphone size={20} className="text-sky-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-ink">Informasi & Pengumuman</h2>
            </div>
            <Link href="/parent-portal/informasi">
              <span className="text-xs font-bold text-sky hover:underline flex items-center gap-1">
                Semua <ArrowRight size={12} />
              </span>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky/20 flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 text-sky-700 font-bold">
                📢
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sky-950 text-base">Kegiatan Field Trip Minggu Depan</h3>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-100/70 px-2.5 py-0.5 rounded-full">
                    Khusus Kelas
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-sky-900 mt-1 leading-relaxed">
                  Harap mempersiapkan bekal dan seragam olahraga untuk kegiatan field trip yang akan dilaksanakan pada hari Rabu di Taman Safari Indonesia.
                </p>
                <span className="text-[11px] font-semibold text-sky-600 mt-3 block">14 Agustus 2026</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cloud/50 border border-ink/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-ink text-sm">Pemberitahuan Libur Nasional</h4>
                <p className="text-xs text-ink-400 mt-0.5">Kegiatan belajar daring dalam rangka HUT RI</p>
              </div>
              <span className="text-xs font-bold text-ink-300">16 Agu</span>
            </div>
          </div>
        </div>

        {/* Quick Student Identity */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-ink/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ink/5">
              <div className="w-10 h-10 rounded-xl bg-leaf-50 flex items-center justify-center text-leaf-600 font-bold">
                🎓
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Profil Siswa</h3>
                <p className="text-xs text-ink-400 font-medium">{className}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-400 font-medium">Nama Lengkap:</span>
                <span className="font-bold text-ink text-right">{studentName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-400 font-medium">NIS:</span>
                <span className="font-bold text-ink">{student?.nis || '202601001'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-400 font-medium">Status Penjemputan:</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Siap Dijemput
                </span>
              </div>
            </div>

            <Link href="/parent-portal/profil-siswa" className="block mt-6">
              <Button variant="outline" className="w-full rounded-xl border-ink/10 font-bold text-xs text-ink-500 hover:text-ink">
                Lihat Profil & Kartu Pelajar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Full QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-ink/5">
              <div className="text-left">
                <h3 className="font-display text-xl font-bold text-ink">QR Code Penjemputan</h3>
                <p className="text-xs text-ink-400 font-medium">Tunjukkan kode ini kepada security saat menjemput.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Car size={20} />
              </div>
            </div>

            {/* Picker Selection Tabs */}
            <form onSubmit={handleGenerateQRSubmit} className="space-y-5 text-left mb-6">
              <div>
                <Label className="text-xs font-bold text-ink-400 uppercase tracking-wider block mb-2">
                  Siapa yang Menjemput?
                </Label>
                <RadioGroup value={pickerType} onValueChange={setPickerType} className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setPickerType('parent')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      pickerType === 'parent' ? 'border-purple-600 bg-purple-50/60' : 'border-ink/10 hover:border-purple-300'
                    }`}
                  >
                    <UserCircle size={24} className={`mb-1 ${pickerType === 'parent' ? 'text-purple-600' : 'text-ink-300'}`} />
                    <span className={`font-bold text-xs ${pickerType === 'parent' ? 'text-purple-900' : 'text-ink-500'}`}>
                      Orang Tua
                    </span>
                  </div>

                  <div 
                    onClick={() => setPickerType('other')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      pickerType === 'other' ? 'border-purple-600 bg-purple-50/60' : 'border-ink/10 hover:border-purple-300'
                    }`}
                  >
                    <Users size={24} className={`mb-1 ${pickerType === 'other' ? 'text-purple-600' : 'text-ink-300'}`} />
                    <span className={`font-bold text-xs ${pickerType === 'other' ? 'text-purple-900' : 'text-ink-500'}`}>
                      Utusan / Supir
                    </span>
                  </div>
                </RadioGroup>
              </div>

              {pickerType === 'other' && (
                <div className="space-y-3 p-4 bg-cloud/60 rounded-2xl border border-ink/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <Label htmlFor="modalPickerName" className="text-xs font-bold text-ink-600">Nama Penjemput</Label>
                    <Input 
                      id="modalPickerName"
                      placeholder="Contoh: Pak Budi (Supir)" 
                      value={pickerName}
                      onChange={(e) => setPickerName(e.target.value)}
                      className="h-10 bg-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modalPickerRole" className="text-xs font-bold text-ink-600">Tanggung Jawab / Relasi</Label>
                    <Input 
                      id="modalPickerRole"
                      placeholder="Contoh: Supir Pribadi / Paman" 
                      value={pickerRole}
                      onChange={(e) => setPickerRole(e.target.value)}
                      className="h-10 bg-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* QR Display */}
            <div className="bg-cloud p-4 rounded-[1.5rem] flex justify-center mb-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />
              <QRCodeSVG 
                value={qrPayload} 
                size={200}
                level="H"
                includeMargin={true}
                className="rounded-xl"
              />
            </div>

            {/* Information Pill */}
            <div className="bg-purple-50 rounded-2xl p-3.5 text-left mb-6 border border-purple-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Siswa: {studentName}</span>
                <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                  <Clock size={12} /> Auto-reload 30s
                </span>
              </div>
              <p className="font-bold text-purple-900 text-sm">
                Penjemput: {pickerType === 'parent' ? 'Orang Tua / Wali' : (pickerName || 'Utusan Belum Diisi')}
              </p>
              <p className="text-xs font-medium text-purple-600">
                Status: {pickerType === 'parent' ? 'Wali Utama' : (pickerRole || 'Utusan')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link href="/parent-portal/penjemputan" onClick={() => setShowQR(false)} className="block">
                <Button 
                  variant="outline"
                  className="w-full h-11 rounded-xl font-bold text-xs text-purple-700 border-purple-200 hover:bg-purple-50 gap-2"
                >
                  <Car size={15} /> Buka Halaman Penjemputan Lengkap
                </Button>
              </Link>
              <Button 
                onClick={() => setShowQR(false)}
                className="w-full h-11 bg-ink text-white hover:bg-ink-700 rounded-xl font-bold text-xs"
              >
                Tutup
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
    </>
  );
}
