"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  School,
  Phone,
  HelpCircle,
  Copy,
  Check,
  Building2,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitPublicAdmission } from "./actions";

const REGISTRATION_FEE = 1_000_000;

export default function PublicAdmissionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedRekening, setCopiedRekening] = useState(false);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [program, setProgram] = useState("PRIMARY_SCHOOL");
  const [gender, setGender] = useState("Laki-laki");
  const [parentRelation, setParentRelation] = useState("Ayah");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank BNI");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  // Success State
  const [submittedResult, setSubmittedResult] = useState<{
    registrationNo: string;
    studentName: string;
    parentName: string;
  } | null>(null);

  const handleCopyRekening = () => {
    navigator.clipboard?.writeText("2332334216");
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas bukti transfer maksimal 5 MB.");
      return;
    }

    setError(null);
    setPaymentProofFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPaymentProofPreview(url);
    } else {
      setPaymentProofPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!studentName.trim() || !parentName.trim() || !parentPhone.trim() || !parentEmail.trim()) {
      setError("Harap lengkapi semua kolom data siswa dan orang tua.");
      return;
    }

    const digitRegex = /^\d+$/;
    if (parentPhone.trim().length < 9 || !digitRegex.test(parentPhone.trim())) {
      setError("Nomor WhatsApp harus berupa angka minimal 9 digit.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail.trim())) {
      setError("Format email orang tua tidak valid.");
      return;
    }

    if (!paymentProofFile) {
      setError("Wajib mengunggah bukti transfer biaya pendaftaran Rp 1.000.000.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("studentName", studentName);
    formData.append("program", program);
    formData.append("gender", gender);
    formData.append("parentRelation", parentRelation);
    formData.append("parentName", parentName);
    formData.append("parentPhone", parentPhone);
    formData.append("parentEmail", parentEmail);
    formData.append("paymentMethod", paymentMethod);
    formData.append("paymentProof", paymentProofFile);

    const res = await submitPublicAdmission(formData);
    setIsSubmitting(false);

    if (res.success && res.registrationNo) {
      setSubmittedResult({
        registrationNo: res.registrationNo,
        studentName: res.studentName,
        parentName: res.parentName,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.message || "Gagal mengirim formulir pendaftaran.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-ink selection:bg-sky/20 selection:text-sky relative overflow-hidden font-sans pb-24">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-sky/15 via-sky/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] bg-gold/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[550px] h-[550px] bg-leaf/10 blur-[130px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={135}
              height={36}
              style={{ width: "auto", height: "auto" }}
              className="dark:hidden object-contain"
              priority
            />
            <Image
              src="/publicjacos/logoputih.png"
              alt="JACOS Logo"
              width={135}
              height={36}
              style={{ width: "auto", height: "auto" }}
              className="hidden dark:block object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white transition active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>

            <a
              href="https://wa.me/6282140000477"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold border border-green-200 hover:bg-green-100 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Bantuan WA Admisi
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
        {submittedResult ? (
          /* SUCCESS STATE */
          <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-sky-950/5 p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-leaf-50 text-leaf-600 border border-leaf-200 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-extrabold uppercase tracking-wider">
                  Pendaftaran Berhasil Dikirim
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                  Bukti Pembayaran Diterima
                </h1>
                <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                  Terima kasih Bapak/Ibu <strong className="text-ink">{submittedResult.parentName}</strong>. Berkas pendaftaran awal dan bukti transfer biaya pendaftaran untuk ananda <strong className="text-ink">{submittedResult.studentName}</strong> telah berhasil kami terima dalam sistem.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Nomor Registrasi</span>
                  <span className="font-mono font-extrabold text-sky text-sm">{submittedResult.registrationNo}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Status Pembayaran</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    Menunggu Verifikasi Admin
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Biaya Registrasi</span>
                  <span className="font-bold text-ink">Rp 1.000.000</span>
                </div>
              </div>

              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 text-left space-y-2">
                <p className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky" /> Tahapan Selanjutnya
                </p>
                <ol className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Tim Admisi JACOS akan memverifikasi mutasi bank dan bukti transfer Anda.</li>
                  <li>Setelah diverifikasi, sistem akan otomatis mengirimkan <strong>email balasan yang memuat Tautan (Link) Formulir Pendaftaran Lengkap</strong> ke email Anda.</li>
                  <li>Admin juga akan mengirimkan link pendaftaran via WhatsApp sebagai pengingat.</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/6282140000477?text=${encodeURIComponent(
                    `Halo Admin JACOS, saya sudah mengirim pendaftaran online untuk ananda ${submittedResult.studentName} dengan No. Registrasi ${submittedResult.registrationNo}. Mohon verifikasi pembayaran kami.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-sm shadow-md transition active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4" />
                  Konfirmasi via WhatsApp
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition active:scale-[0.98]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* FORM & OVERVIEW GRID */
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Narrative & Payment Instruction (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 text-sky text-xs font-extrabold border border-sky-100 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Online Admission 2026/2027
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                  Pendaftaran Online Calon Siswa JACOS
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Lengkapi data singkat calon peserta didik dan unggah bukti transfer pendaftaran. Tim admisi kami akan memverifikasi dan menerbitkan tautan formulir pendaftaran eksklusif ananda.
                </p>
              </div>

              {/* Rekening Pembayaran Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center border border-gold-200/60">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink">Rekening Resmi Sekolah</h3>
                      <p className="text-[11px] text-slate-400">Biaya Pendaftaran Rp 1.000.000</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-full border border-gold-200">
                    Bank BNI
                  </span>
                </div>

                {/* BNI Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Nomor Rekening BNI</span>
                    <button
                      type="button"
                      onClick={handleCopyRekening}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky hover:text-sky-700 transition"
                    >
                      {copiedRekening ? <Check className="w-3 h-3 text-leaf-600" /> : <Copy className="w-3 h-3" />}
                      {copiedRekening ? "Tersalin!" : "Salin No. Rek"}
                    </button>
                  </div>
                  <p className="font-mono text-xl font-extrabold text-ink tracking-wide">
                    2332334216
                  </p>
                  <p className="text-xs text-slate-500">
                    Atas Nama: <strong className="text-ink">Yayasan Cahaya Pembangunan Global Indonesia</strong>
                  </p>
                </div>

                {/* QRIS Option */}
                <div className="flex items-center justify-between p-3.5 bg-cloud/50 rounded-2xl border border-ink/5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky" />
                    <span className="text-xs font-bold text-ink">Mendukung Pembayaran QRIS</span>
                  </div>
                  <Link
                    href="/publicjacos/finance/qr.png"
                    target="_blank"
                    className="text-xs font-bold text-sky hover:underline"
                  >
                    Buka QRIS &rarr;
                  </Link>
                </div>
              </div>

              {/* 4 Steps Roadmap */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Alur Proses Pendaftaran
                </h3>
                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Isi Data &amp; Unggah Bukti Bayar</p>
                      <p className="text-[11px] text-slate-500">Lengkapi formulir di samping dan lampirkan bukti transfer Rp 1.000.000.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Verifikasi &amp; Link Unik Pendaftaran</p>
                      <p className="text-[11px] text-slate-500">Admin memvalidasi pembayaran dan mengirim tautan formulir pendaftaran lengkap via email &amp; WA.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Pengisian Formulir Lengkap</p>
                      <p className="text-[11px] text-slate-500">Orang tua mengisi biodata lengkap dan mengunggah dokumen persyaratan.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Approval &amp; Akses Parent Portal</p>
                      <p className="text-[11px] text-slate-500">Setelah disetujui, orang tua menerima kredensial akun Parent Portal dan mengunggah Declaration Letter.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Form (7 Cols) */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-sky-950/5 p-6 sm:p-10 space-y-8"
              >
                {/* Section 1: Data Calon Siswa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky flex items-center justify-center">
                      <School className="w-4 h-4" />
                    </div>
                    <h2 className="font-display font-extrabold text-base text-ink">
                      1. Data Calon Siswa
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="block text-xs font-bold mb-1.5 text-ink">
                        Nama Lengkap Siswa <span className="text-coral">*</span>
                      </Label>
                      <Input
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Nama lengkap sesuai Akta Kelahiran"
                        className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 focus-visible:border-sky text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Jenjang Pendidikan <span className="text-coral">*</span>
                        </Label>
                        <Select value={program} onValueChange={(val) => setProgram(val || "PRIMARY_SCHOOL")}>
                          <SelectTrigger className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 text-sm font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESCHOOL">Preschool (PG / TK A)</SelectItem>
                            <SelectItem value="KINDERGARTEN">Kindergarten (TK B)</SelectItem>
                            <SelectItem value="PRIMARY_SCHOOL">Primary School (SD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Jenis Kelamin <span className="text-coral">*</span>
                        </Label>
                        <RadioGroup
                          value={gender}
                          onValueChange={setGender}
                          className="flex gap-4 h-12 items-center px-4 rounded-2xl bg-cloud/60 border border-slate-200/80"
                        >
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="Laki-laki" />
                            <span className="text-xs font-bold">Laki-laki</span>
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="Perempuan" />
                            <span className="text-xs font-bold">Perempuan</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Data Orang Tua */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <h2 className="font-display font-extrabold text-base text-ink">
                      2. Data Orang Tua / Wali
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Hubungan <span className="text-coral">*</span>
                        </Label>
                        <Select value={parentRelation} onValueChange={(val) => setParentRelation(val || "Ayah")}>
                          <SelectTrigger className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 text-sm font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ayah">Ayah</SelectItem>
                            <SelectItem value="Ibu">Ibu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Nama Lengkap Orang Tua <span className="text-coral">*</span>
                        </Label>
                        <Input
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder={`Nama lengkap ${parentRelation}`}
                          className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 focus-visible:border-sky text-sm font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Nomor WhatsApp <span className="text-coral">*</span>
                        </Label>
                        <Input
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 focus-visible:border-sky text-sm font-medium"
                          required
                        />
                      </div>

                      <div>
                        <Label className="block text-xs font-bold mb-1.5 text-ink">
                          Alamat Email Aktif <span className="text-coral">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="email@domain.com"
                          className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 focus-visible:border-sky text-sm font-medium"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Pembayaran & Bukti Transfer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h2 className="font-display font-extrabold text-base text-ink">
                      3. Pembayaran &amp; Bukti Transfer
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gold-50/70 border border-gold-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-gold-700 uppercase tracking-wider block">
                          Biaya Formulir Pendaftaran
                        </span>
                        <p className="font-display text-2xl font-extrabold text-ink">
                          Rp 1.000.000
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gold-800 bg-white px-3 py-1 rounded-full border border-gold-200 shadow-2xs">
                        Wajib
                      </span>
                    </div>

                    <div>
                      <Label className="block text-xs font-bold mb-1.5 text-ink">
                        Metode Pembayaran yang Digunakan
                      </Label>
                      <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "Transfer Bank BNI")}>
                        <SelectTrigger className="h-12 rounded-2xl bg-cloud/60 border-slate-200/80 text-sm font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Transfer Bank BNI">Transfer Bank BNI (No. Rek 2332334216)</SelectItem>
                          <SelectItem value="QRIS">QRIS Yayasan JACOS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* File Upload Dropzone */}
                    <div>
                      <Label className="block text-xs font-bold mb-1.5 text-ink">
                        Unggah Bukti Transfer <span className="text-coral">*</span>
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      {!paymentProofFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 hover:border-sky hover:bg-sky-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-sky-100 group-hover:text-sky transition flex items-center justify-center">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink">
                              Klik untuk pilih berkas bukti transfer
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Format JPG, PNG, atau PDF (Maksimal 5 MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {paymentProofPreview ? (
                              <Image
                                src={paymentProofPreview}
                                alt="Preview"
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate">
                                {paymentProofFile.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {(paymentProofFile.size / 1024).toFixed(1)} KB • Siap diunggah
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 rounded-xl text-slate-400 hover:text-coral hover:bg-coral-50 transition"
                            title="Hapus berkas"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 rounded-2xl bg-coral-50 border border-coral-200 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-coral-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !paymentProofFile}
                    className={`w-full h-13 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition active:scale-[0.98] ${
                      paymentProofFile
                        ? "bg-sky hover:bg-sky-600 text-white shadow-sky/20 cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {isSubmitting ? (
                      "Mengunggah & Mengirim Data..."
                    ) : (
                      <>
                        Kirim Pendaftaran &amp; Bukti Transfer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  {!paymentProofFile && (
                    <p className="text-center text-[11px] text-slate-400 mt-2">
                      * Tombol kirim akan aktif setelah Anda melampirkan berkas bukti transfer.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
