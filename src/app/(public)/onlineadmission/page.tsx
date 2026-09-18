"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  CreditCard,
  FileCheck2,
  FileText,
  Landmark,
  LockKeyhole,
  Phone,
  School,
  ShieldCheck,
  UploadCloud,
  X,
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

const REGISTRATION_FEE = "Rp 1.000.000";
const BNI_ACCOUNT = "2332334216";
const WHATSAPP_URL = "https://wa.me/6282140000477";

export default function PublicAdmissionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [program, setProgram] = useState("PRIMARY_SCHOOL");
  const [gender, setGender] = useState("Laki-laki");
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherEmail, setFatherEmail] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [motherEmail, setMotherEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank BNI");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    registrationNo: string;
    studentName: string;
    parentName: string;
  } | null>(null);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    return () => {
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    };
  }, [paymentProofPreview]);

  const clearError = () => setError(null);

  const handleCopyRekening = async () => {
    try {
      await navigator.clipboard.writeText(BNI_ACCOUNT);
      setCopiedRekening(true);
      window.setTimeout(() => setCopiedRekening(false), 2000);
    } catch {
      setError("Nomor rekening belum dapat disalin. Silakan salin secara manual.");
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const isAccepted = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAccepted) {
      setError("Gunakan berkas JPG, PNG, atau PDF untuk bukti pembayaran.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas bukti pembayaran maksimal 5 MB.");
      return;
    }

    clearError();
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    setPaymentProofFile(file);
    setPaymentProofPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const handleRemoveFile = () => {
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    if (!studentName.trim() || !fatherName.trim() || !fatherPhone.trim() || !fatherEmail.trim() || !motherName.trim() || !motherPhone.trim() || !motherEmail.trim()) {
      setError("Lengkapi data calon siswa dan kontak kedua orang tua terlebih dahulu.");
      return;
    }
    if (!/^\d{9,}$/.test(fatherPhone.trim()) || !/^\d{9,}$/.test(motherPhone.trim())) {
      setError("Nomor WhatsApp harus berupa angka, minimal 9 digit.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fatherEmail.trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(motherEmail.trim())) {
      setError("Masukkan alamat email ayah dan ibu yang valid.");
      return;
    }
    if (!paymentProofFile) {
      setError(`Unggah bukti pembayaran ${REGISTRATION_FEE} sebelum mengirim pendaftaran.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("studentName", studentName);
      formData.append("program", program);
      formData.append("gender", gender);
      formData.append("fatherName", fatherName);
      formData.append("fatherPhone", fatherPhone);
      formData.append("fatherEmail", fatherEmail);
      formData.append("motherName", motherName);
      formData.append("motherPhone", motherPhone);
      formData.append("motherEmail", motherEmail);
      formData.append("paymentMethod", paymentMethod);
      formData.append("paymentProof", paymentProofFile);

      const result = await submitPublicAdmission(formData);
      if (!result.success || !result.registrationNo) {
        setError(result.message || "Pendaftaran belum dapat dikirim. Silakan coba lagi.");
        return;
      }

      setSubmittedResult({
        registrationNo: result.registrationNo,
        studentName: result.studentName,
        parentName: result.parentName || fatherName || motherName,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Terjadi kendala saat mengirim data. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentInstruction = paymentMethod === "QRIS"
    ? "Scan QRIS resmi JACOS, lalu unggah tangkapan layar pembayaran berhasil."
    : "Transfer ke rekening resmi JACOS, lalu unggah bukti transfer yang jelas.";

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f5f8ff] font-sans text-ink selection:bg-sky/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,_#dce9ff_0%,_#f5f8ff_65%)]" />

      <header className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/30">
            <Image src="/publicjacos/logo.png" alt="JACOS" width={125} height={30} priority className="h-auto w-[116px] sm:w-[135px]" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/30">
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke Beranda</span><span className="sm:hidden">Beranda</span>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-white shadow-sm transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/30">
              <Phone className="size-3.5" />
              <span className="hidden sm:inline">Butuh Bantuan?</span><span className="sm:hidden">Bantuan</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-14">
        {submittedResult ? (
          <SuccessPanel result={submittedResult} />
        ) : (
          <>
            <section className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky shadow-sm">
                <ShieldCheck className="size-3.5" /> Penerimaan Siswa Baru 2026/2027
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
                Mulai pendaftaran ananda<br className="hidden sm:block" /> dengan tenang.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Isi data awal, lakukan pembayaran formulir, lalu unggah buktinya. Tim Admisi akan mengirim formulir lengkap setelah pembayaran terverifikasi.
              </p>
            </section>

            <section className="mx-auto mt-8 grid max-w-7xl grid-cols-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:mt-10">
              {[
                ["1", "Data awal", "± 2 menit"],
                ["2", "Pembayaran", REGISTRATION_FEE],
                ["3", "Verifikasi", "Link formulir lengkap"],
              ].map(([number, title, detail]) => (
                <div key={number} className="min-w-0 rounded-xl px-2 py-2.5 text-center sm:px-4">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-sky text-lg font-extrabold text-white mb-4">{number}</div>
                  <p className="mt-1.5 truncate text-[13px] font-extrabold text-ink sm:text-sm">{title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-sm">{detail}</p>
                </div>
              ))}
            </section>

            <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <form onSubmit={handleSubmit} className="order-2 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/[0.04] sm:p-8 lg:order-1">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky">Formulir awal</p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">Data pendaftaran</h2>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-[11px] font-bold text-leaf-600"><LockKeyhole className="size-3.5" /> Data terlindungi</div>
                </div>

                <FormSection number="01" icon={<School className="size-4" />} title="Data calon siswa" description="Gunakan nama sesuai akta kelahiran.">
                  <div>
                    <Label htmlFor="student-name" className="field-label">Nama lengkap siswa <Required /></Label>
                    <Input id="student-name" value={studentName} onChange={(event) => { setStudentName(event.target.value); clearError(); }} placeholder="Contoh: Aisyah Putri Pratama" autoComplete="name" required className="field-input" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="field-label">Jenjang pendidikan <Required /></Label>
                      <Select value={program} onValueChange={(value) => { setProgram(value || "PRIMARY_SCHOOL"); clearError(); }}>
                        <SelectTrigger className="field-input w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESCHOOL">Preschool (PG / TK A)</SelectItem>
                          <SelectItem value="KINDERGARTEN">Kindergarten (TK B)</SelectItem>
                          <SelectItem value="PRIMARY_SCHOOL">Primary School (SD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span className="field-label">Jenis kelamin <Required /></span>
                      <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-2">
                        <ChoiceRadio id="gender-male" value="Laki-laki" label="Laki-laki" selected={gender === "Laki-laki"} />
                        <ChoiceRadio id="gender-female" value="Perempuan" label="Perempuan" selected={gender === "Perempuan"} />
                      </RadioGroup>
                    </div>
                  </div>
                </FormSection>

                <FormSection number="02" icon={<FileCheck2 className="size-4" />} title="Kontak orang tua" description="Link formulir lengkap dikirim ke email ini.">
                  <div className="space-y-6">
                    {/* Data Ayah */}
                    <div>
                      <div className="mb-3 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-700">Data Ayah</h3>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-1 mb-4">
                        <div>
                          <Label htmlFor="father-name" className="field-label">Nama lengkap ayah <Required /></Label>
                          <Input id="father-name" value={fatherName} onChange={(event) => { setFatherName(event.target.value); clearError(); }} placeholder="Nama lengkap ayah" autoComplete="name" required className="field-input" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="father-phone" className="field-label">Nomor WhatsApp Ayah <Required /></Label>
                          <Input id="father-phone" type="tel" inputMode="numeric" autoComplete="tel" value={fatherPhone} onChange={(event) => { setFatherPhone(event.target.value.replace(/\D/g, "")); clearError(); }} placeholder="08123456789" required className="field-input" />
                        </div>
                        <div>
                          <Label htmlFor="father-email" className="field-label">Email aktif Ayah <Required /></Label>
                          <Input id="father-email" type="email" autoComplete="email" value={fatherEmail} onChange={(event) => { setFatherEmail(event.target.value); clearError(); }} placeholder="nama@email.com" required className="field-input" />
                        </div>
                      </div>
                    </div>

                    {/* Data Ibu */}
                    <div>
                      <div className="mb-3 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-700">Data Ibu</h3>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-1 mb-4">
                        <div>
                          <Label htmlFor="mother-name" className="field-label">Nama lengkap ibu <Required /></Label>
                          <Input id="mother-name" value={motherName} onChange={(event) => { setMotherName(event.target.value); clearError(); }} placeholder="Nama lengkap ibu" autoComplete="name" required className="field-input" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="mother-phone" className="field-label">Nomor WhatsApp Ibu <Required /></Label>
                          <Input id="mother-phone" type="tel" inputMode="numeric" autoComplete="tel" value={motherPhone} onChange={(event) => { setMotherPhone(event.target.value.replace(/\D/g, "")); clearError(); }} placeholder="08123456789" required className="field-input" />
                        </div>
                        <div>
                          <Label htmlFor="mother-email" className="field-label">Email aktif Ibu <Required /></Label>
                          <Input id="mother-email" type="email" autoComplete="email" value={motherEmail} onChange={(event) => { setMotherEmail(event.target.value); clearError(); }} placeholder="nama@email.com" required className="field-input" />
                        </div>
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection number="03" icon={<CreditCard className="size-4" />} title="Pembayaran formulir" description="Pilih metode, selesaikan pembayaran, lalu unggah buktinya.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PaymentOption value="Transfer Bank BNI" currentValue={paymentMethod} onChange={setPaymentMethod} title="Transfer Bank BNI" detail="Rekening resmi JACOS" icon={<Landmark className="size-5" />} />
                    <PaymentOption value="QRIS" currentValue={paymentMethod} onChange={setPaymentMethod} title="QRIS JACOS" detail="Scan QR resmi sekolah" icon={<CreditCard className="size-5" />} />
                  </div>

                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-sky-700">Biaya formulir</p>
                        <p className="mt-1 font-display text-2xl font-extrabold text-ink">{REGISTRATION_FEE}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sky shadow-sm">Wajib dibayar</span>
                    </div>
                    <div className="mt-3 border-t border-sky-100 pt-3">
                      {paymentMethod === "Transfer Bank BNI" ? (
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div><p className="text-xs font-bold text-ink">BNI {BNI_ACCOUNT}</p><p className="mt-0.5 text-[11px] text-slate-500">a.n. Yayasan Cahaya Pembangunan Global Indonesia</p></div>
                          <button type="button" onClick={handleCopyRekening} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2.5 text-[11px] font-bold text-sky transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/30">
                            {copiedRekening ? <Check className="size-3.5 text-leaf" /> : <Copy className="size-3.5" />}{copiedRekening ? "Tersalin" : "Salin rekening"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-600">Gunakan QRIS resmi sekolah untuk nominal tepat.</p><Link href="/publicjacos/finance/qr.png" target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-sky hover:underline">Buka QRIS <ChevronRight className="size-3.5" /></Link></div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-600">{paymentInstruction}</p>
                    <Label htmlFor="payment-proof" className="field-label">Bukti pembayaran <Required /></Label>
                    <input ref={fileInputRef} id="payment-proof" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(event) => handleFileChange(event.target.files?.[0] || null)} className="sr-only" />
                    {!paymentProofFile ? (
                      <label htmlFor="payment-proof" className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 text-center transition hover:border-sky hover:bg-sky-50/60 focus-within:border-sky focus-within:ring-3 focus-within:ring-sky/20">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition group-hover:bg-sky group-hover:text-white"><UploadCloud className="size-5" /></span>
                        <span className="mt-2 text-sm font-bold text-ink">Pilih bukti pembayaran</span>
                        <span className="mt-1 text-[11px] text-slate-500">JPG, PNG, atau PDF · maksimal 5 MB</span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          {paymentProofPreview ? <Image src={paymentProofPreview} alt="Pratinjau bukti pembayaran" width={44} height={44} unoptimized className="size-11 rounded-xl border border-leaf-100 object-cover" /> : <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-leaf shadow-sm"><FileText className="size-5" /></span>}
                          <div className="min-w-0"><p className="truncate text-xs font-extrabold text-ink">{paymentProofFile.name}</p><p className="mt-0.5 text-[11px] text-leaf-600">Siap diunggah · {(paymentProofFile.size / 1024).toFixed(1)} KB</p></div>
                        </div>
                        <button type="button" onClick={handleRemoveFile} aria-label="Hapus bukti pembayaran" className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-coral focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral/20"><X className="size-4" /></button>
                      </div>
                    )}
                  </div>
                </FormSection>

                {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mt-6 flex scroll-mt-24 items-start gap-2.5 rounded-2xl border border-coral-100 bg-coral-50 p-4 text-sm font-semibold text-coral-600 outline-none"><CircleHelp className="mt-0.5 size-4 shrink-0" />{error}</div>}

                <div className="mt-7 border-t border-slate-100 pt-6">
                  <Button type="submit" disabled={isSubmitting || !paymentProofFile} className="h-13 w-full rounded-2xl bg-sky px-5 text-sm font-extrabold text-white shadow-lg shadow-sky/20 transition hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:text-base">
                    {isSubmitting ? "Mengirim pendaftaran..." : <>Kirim pendaftaran awal <ArrowRight className="ml-1 size-4" /></>}
                  </Button>
                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Dengan mengirim formulir ini, Bapak/Ibu menyatakan data yang diberikan benar. Pembayaran akan diverifikasi oleh Tim Admisi JACOS.</p>
                </div>
              </form>

              <aside className="order-1 space-y-4 lg:sticky lg:top-6 lg:order-2">
                <div className="overflow-hidden rounded-[1.5rem] bg-ink p-6 text-white shadow-xl shadow-ink/15">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold"><ShieldCheck className="size-5" /></div>
                  <h2 className="mt-5 font-display text-xl font-extrabold">Pendaftaran awal, tanpa ribet.</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Data ini cukup untuk memulai proses. Dokumen lengkap menyusul setelah pembayaran dicek.</p>
                  <ol className="mt-6 space-y-4">
                    {["Isi data calon siswa dan kontak orang tua.", "Bayar biaya formulir melalui BNI atau QRIS.", "Unggah bukti, lalu tunggu verifikasi kami."].map((text, index) => <li key={text} className="flex gap-3 text-xs leading-5 text-slate-200"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky text-[10px] font-extrabold text-white">{index + 1}</span>{text}</li>)}
                  </ol>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-extrabold text-ink">Ada pertanyaan sebelum mulai?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Tim Admisi siap bantu via WhatsApp pada jam kerja.</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-3 text-xs font-extrabold text-green-700 transition hover:bg-green-100"><Phone className="size-3.5" /> Hubungi Tim Admisi</a>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <style jsx global>{`
        .field-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #16233D;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .field-input {
          height: 3rem;
          border-color: rgb(226 232 240 / 0.9);
          border-radius: 0.75rem;
          background: rgb(248 250 252 / 0.8);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .field-input:focus-visible {
          border-color: #2F6FED;
        }
        .field-help {
          margin-top: 0.375rem;
          color: #94A3B8;
          font-size: 0.6875rem;
          line-height: 1rem;
        }
      `}</style>
    </div>
  );
}

function Required() { return <span aria-hidden="true" className="text-coral">*</span>; }

function FormSection({ number, icon, title, description, children }: { number: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="mt-8"><div className="mb-5 flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky">{icon}</span><div><p className="text-[10px] font-extrabold tracking-[0.14em] text-sky">BAGIAN {number}</p><h3 className="mt-0.5 text-sm font-extrabold text-ink">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{description}</p></div></div><div className="space-y-4">{children}</div></section>;
}

function ChoiceRadio({ id, value, label, selected }: { id: string; value: string; label: string; selected: boolean }) {
  return <Label htmlFor={id} className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${selected ? "border-sky bg-sky-50 text-sky" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}><RadioGroupItem id={id} value={value} />{label}</Label>;
}

function PaymentOption({ value, currentValue, onChange, title, detail, icon }: { value: string; currentValue: string; onChange: (value: string) => void; title: string; detail: string; icon: React.ReactNode }) {
  const selected = value === currentValue;
  return <button type="button" onClick={() => onChange(value)} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/30 ${selected ? "border-sky bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-sky text-white" : "bg-slate-100 text-slate-500"}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-ink">{title}</span><span className="mt-0.5 block text-[11px] text-slate-500">{detail}</span></span><span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-sky bg-sky text-white" : "border-slate-300"}`}>{selected && <Check className="size-3" />}</span></button>;
}

function SuccessPanel({ result }: { result: { registrationNo: string; studentName: string; parentName: string } }) {
  return (
    <section className="mx-auto max-w-2xl py-6 sm:py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-900/[0.05] sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-leaf-50 text-leaf">
          <CheckCircle2 className="size-8" />
        </span>
        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-leaf-600">Pendaftaran berhasil dikirim</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Terima kasih, Bapak/Ibu {result.parentName}.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Data awal untuk <strong className="text-ink">{result.studentName}</strong> sudah kami terima. Bukti pembayaran masuk ke antrean verifikasi Tim Admisi.</p>
        
        <div className="mt-7 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-semibold text-sky-800">
          Aplikasi pendaftaran akan diproses oleh admin dalam waktu 2x24 jam (Hari Kerja).
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor registrasi</span>
            <span className="font-mono text-sm font-extrabold text-sky">{result.registrationNo}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status pembayaran</span>
            <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-extrabold text-gold-600">Menunggu verifikasi</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-ink p-5 text-left text-white">
          <p className="text-xs font-extrabold">Langkah berikutnya</p>
          <ol className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
            <li>1. Tim Admisi memeriksa pembayaran dan bukti transfer.</li>
            <li>2. Link formulir lengkap dikirim ke email terdaftar.</li>
            <li>3. WhatsApp digunakan sebagai pengingat proses berikutnya.</li>
          </ol>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Halo Admin JACOS, pendaftaran ananda ${result.studentName} dengan nomor ${result.registrationNo} sudah kami kirim.`)}`} target="_blank" rel="noreferrer" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-extrabold text-white transition hover:bg-green-600"><Phone className="size-4" /> Konfirmasi WhatsApp</a>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Kembali ke Beranda</Link>
        </div>
      </div>
    </section>
  );
}
