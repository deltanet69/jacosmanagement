"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
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
  User,
  ChevronRight,
} from 'lucide-react';
import { uploadJacosAgreement } from '@/app/parent-portal/actions';
import { PickupQRModal } from '@/components/parent-portal/PickupQRModal';

interface DashboardClientProps {
  student: any;
  parentName: string;
  applicantId: string | null;
  agreementDoc: any;
  announcements: any[];
  status: string;
}

export default function DashboardClient({
  student,
  parentName,
  applicantId,
  agreementDoc,
  announcements,
  status,
}: DashboardClientProps) {
  const [showQR, setShowQR] = useState(false);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

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
      if (!res.success) throw new Error((res as any).message);
      window.location.reload();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Gagal mengupload dokumen: " + err.message);
    } finally {
      setUploadingAgreement(false);
    }
  };

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

  const isAgreementApproved = agreementDoc && (agreementDoc.verification === 'VERIFIED' || agreementDoc.status === 'VERIFIED');
  const isAgreementPending = agreementDoc && (agreementDoc.verification === 'PENDING' || agreementDoc.verification === 'REVIEWING' || agreementDoc.status === 'PENDING' || agreementDoc.status === 'WAITING_VERIFICATION');
  const isAgreementRejected = agreementDoc && (agreementDoc.verification === 'REJECTED' || agreementDoc.status === 'REJECTED');

  const renderAgreementOverlay = () => (
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
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    required
                    onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-ink-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky hover:file:bg-sky-100 transition cursor-pointer bg-white border border-ink/10 rounded-xl"
                  />
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

  const studentName = student?.full_name || 'Siswa JACOS';
  const className = Array.isArray(student?.school_classes)
    ? student?.school_classes[0]?.name
    : student?.school_classes?.name || 'Grade 1';

  return (
    <>
      {!isAgreementApproved && renderAgreementOverlay()}

      <div className={`space-y-8 pb-12 ${!isAgreementApproved ? 'pointer-events-none opacity-50 blur-sm h-[calc(100vh-80px)] overflow-hidden' : ''}`}>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">Ringkasan Aktivitas</h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">Pantau absensi, penjemputan, dan kegiatan harian siswa.</p>
        </div>

        {/* Featured Card: Penjemputan */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-7 text-white shadow-xl shadow-purple-600/15">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 translate-y-1/2 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3 border border-white/10 shadow-xs">
              <ShieldCheck size={14} className="text-purple-200" />
              <span>PENJEMPUTAN DIGITAL JACOS</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
              Siap Menjemput Siswa Hari Ini?
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-xl mb-6">
              Tampilkan QR Code kepada petugas security saat tiba di gerbang penjemputan.
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowQR(true)}
                className="h-12 px-6 bg-white text-purple-950 hover:bg-purple-50 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-initial transition active:scale-95 border-none"
              >
                <Sparkles size={16} className="text-purple-600" />
                Generate QR Code
              </Button>
              <Link href="/parent-portal/penjemputan">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition active:scale-95 shrink-0"
                  title="Buka Halaman Penjemputan"
                >
                  <ExternalLink size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2x2 Quick Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          <Link href="/parent-portal/classroom" className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">KEHADIRAN</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky">
                <CalendarCheck size={18} />
              </div>
            </div>
            <div className="my-2 sm:my-3">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-sky tracking-tight">98%</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-leaf-600">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>Tepat Waktu</span>
            </div>
          </Link>

          <Link href="/parent-portal/finance" className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">SPP BULANAN</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Receipt size={18} />
              </div>
            </div>
            <div className="my-2 sm:my-3">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-leaf-600 tracking-tight">Lunas</p>
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-ink-400">Bulan September</p>
          </Link>

          <Link href="/parent-portal/tabungan" className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">TABUNGAN</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PiggyBank size={18} />
              </div>
            </div>
            <div className="my-2 sm:my-3">
              <p className="font-display text-base sm:text-xl font-extrabold text-ink tracking-tight">Rp 1.450.000</p>
            </div>
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-emerald-600 group-hover:underline">
              <span>Tabungan Aktif</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link href="/parent-portal/profil-siswa" className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">PROFIL SISWA</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <User size={18} />
              </div>
            </div>
            <div className="my-2 sm:my-3">
              <p className="font-display text-base sm:text-xl font-extrabold text-ink tracking-tight truncate" title={studentName}>
                {studentName}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-sky group-hover:underline">
              <span>{className}</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>

        {/* Informasi Sekolah */}
        <div className="bg-white rounded-[2rem] shadow-xs border border-ink/5 p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ink/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky">
                <Megaphone size={18} />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Informasi Sekolah</h2>
            </div>
            <Link href="/parent-portal/informasi" className="text-xs font-bold text-sky hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-cloud/50 rounded-2xl border border-ink/5">
                <p className="text-xs text-ink-400 font-semibold">Belum ada informasi terbaru dari sekolah.</p>
              </div>
            ) : (
              announcements.slice(0, 3).map((item: any, idx: number) => {
                const cleanSnippet = item.content
                  ? item.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
                  : '';
                const excerpt = cleanSnippet.length > 120 ? cleanSnippet.substring(0, 120) + '...' : cleanSnippet;
                const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <Link
                    key={item.id}
                    href="/parent-portal/informasi"
                    className={`block p-4 sm:p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-xs ${
                      idx === 0
                        ? 'bg-sky-50/60 border-sky/20 hover:border-sky/40'
                        : 'bg-cloud/40 border-ink/5 hover:bg-white hover:border-ink/15'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${idx === 0 ? 'bg-sky-100 text-sky-700' : 'bg-white text-ink-500 border border-ink/10'}`}>
                        <Megaphone size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <h3 className="font-bold text-ink text-sm sm:text-base leading-snug truncate">{item.title}</h3>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            item.target_type === 'GENERAL'
                              ? 'bg-sky-100/80 text-sky-800 border-sky-200'
                              : 'bg-coral-100/80 text-coral-800 border-coral-200'
                          }`}>
                            {item.target_type === 'GENERAL' ? 'Umum' : 'Khusus Kelas'}
                          </span>
                        </div>
                        {excerpt && (
                          <p className="text-xs font-medium text-ink-500 mt-1 leading-relaxed line-clamp-2">{excerpt}</p>
                        )}
                        <span className="text-[11px] font-semibold text-ink-400 mt-2 block">
                          {formattedDate} • {item.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <PickupQRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          student={student}
          parentName={parentName}
          showLinkToFullPage={true}
        />
      </div>
    </>
  );
}
