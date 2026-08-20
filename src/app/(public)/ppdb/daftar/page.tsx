"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitApplicant } from "./actions";

export default function DaftarPPDB() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const stepLabels = [
    "Informasi Siswa",
    "Data Orang Tua",
    "Dokumen",
    "Review & Kirim",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationNo, setRegistrationNo] = useState("");
  const [waPreview, setWaPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);

  // Document upload states
  const [docUploaded, setDocUploaded] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    nisn: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki",
    category: "Siswa Baru",
    address: "",
    program: "Primary",
    // Parent data
    parentName: "",
    parentBirthPlace: "",
    parentBirthDate: "",
    parentJob: "",
    parentRelation: "ayah",
    parentEducation: "S1",
    parentAddress: "",
    phone: "",
    email: "",
    agreed: false,
  });

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const copyStudentAddress = (checked: boolean) => {
    if (checked) {
      updateForm("parentAddress", formData.address);
    } else {
      updateForm("parentAddress", "");
    }
  };

  const nextStep = async () => {
    if (currentStep === totalSteps) {
      if (!formData.agreed) {
        alert("Anda harus menyetujui pernyataan untuk melanjutkan.");
        return;
      }
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(formData));
      Object.entries(docFiles).forEach(([key, file]) => {
        formDataToSend.append(`file_${key}`, file);
      });

      const res = await submitApplicant(formDataToSend);
      setIsSubmitting(false);

      if (res.success) {
        setRegistrationNo(res.registrationNo!);
        setIsSuccess(true);
        window.scrollTo(0, 0);
      } else {
        alert(res.message);
      }
    } else {
      setCurrentStep((c) => c + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((c) => c - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docKey: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      let processedFile = file;
      if (file.type.startsWith("image/")) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          processedFile = await imageCompression(file, options);
        } catch (error) {
          console.error("Error compressing image:", error);
        }
      }
      setDocUploaded((prev) => ({ ...prev, [docKey]: processedFile.name }));
      setDocFiles((prev) => ({ ...prev, [docKey]: processedFile }));
    }
  };

  // VA number from registration no
  const vaNumber = registrationNo
    ? `88808 ${registrationNo.split("-")[1] || "2026"} ${registrationNo.split("-").pop()}`
    : "";

  const renderSidebar = () => (
    <aside className="hidden lg:flex w-80 bg-white border-r border-ink/10 flex-col px-8 py-10 shrink-0 min-h-screen">
      <div className="flex items-center gap-2.5 mb-14">
        <Image
          src="/publicjacos/logo.png"
          alt="JACOS Logo"
          width={140}
          height={40}
          className="dark:hidden object-contain"
        />
        <Image
          src="/publicjacos/logoputih.png"
          alt="JACOS Logo"
          width={140}
          height={40}
          className="hidden dark:block object-contain"
        />
      </div>
      {!isSuccess && (
        <div className="space-y-8 relative">
          <div
            className="absolute left-[19px] top-3 bottom-3 w-0.5"
            style={{
              background:
                "repeating-linear-gradient(180deg,#D3E3FF 0 8px, transparent 8px 16px)",
            }}
          />
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === currentStep;
            const isPast = step < currentStep;
            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className="flex items-start gap-4 relative text-left w-full group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition ${
                    isActive || isPast
                      ? "bg-sky text-white"
                      : "bg-white border-2 border-ink/15 text-ink-300 group-hover:border-sky/50"
                  }`}
                >
                  {isPast ? "✓" : step}
                </div>
                <div className="pt-2">
                  <p
                    className={`font-bold text-sm ${isActive || isPast ? "text-sky" : "text-ink-300"}`}
                  >
                    Langkah {step}
                  </p>
                  <p
                    className={`font-semibold ${isActive || isPast ? "text-ink" : "text-ink-300"}`}
                  >
                    {stepLabels[step - 1]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-auto bg-cloud rounded-3xl p-5">
        <p className="text-xs font-bold text-ink-400 mb-1">Butuh bantuan?</p>
        <p className="text-xs text-ink-300 leading-relaxed">
          WhatsApp 0821-4000-0477 atau email admission@jacos.id, setiap hari
          kerja.
        </p>
      </div>
    </aside>
  );

  // ======= CONFIRMATION / RECEIPT SCREEN =======
  if (isSuccess) {
    return (
      <div className="min-h-screen flex bg-cloud">
        {renderSidebar()}
        <div className="flex-1 overflow-y-auto flex">
          <main className="w-full max-w-xl px-6 sm:px-12 py-14 mx-auto">
            {/* Top checkmark */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-leaf mx-auto mb-5 flex items-center justify-center shadow-xl shadow-leaf/20">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold mb-1">
                Pendaftaran Berhasil Dikirim!
              </h1>
              <p className="text-ink-400 text-sm">
                Simpan atau screenshot halaman ini sebagai bukti pendaftaran.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden mb-5">
              {/* Card header */}
              <div className="bg-sky px-7 py-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-display text-white text-sm font-bold">
                  J
                </div>
                <div className="text-white">
                  <p className="font-display font-bold text-sm leading-none">
                    JACOS
                  </p>
                  <p className="text-[10px] text-white/70 font-semibold">
                    Jakarta Cosmopolite Islamic School
                  </p>
                </div>
                <span className="ml-auto font-mono text-[11px] text-white/80">
                  {registrationNo}
                </span>
              </div>

              {/* Card body */}
              <div className="p-7">
                <p className="text-xs font-bold text-ink-300 uppercase tracking-widest mb-4">
                  Data Pendaftaran
                </p>
                <dl className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Nama Anak</dt>
                    <dd className="font-bold text-right">{formData.fullName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Apply Kelas</dt>
                    <dd className="font-bold text-right">Primary School</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Nama Orang Tua</dt>
                    <dd className="font-bold text-right">
                      {formData.parentName}
                    </dd>
                  </div>
                </dl>

                {/* Payment box */}
                <div className="rounded-3xl bg-gold-50 border border-gold-100 p-5">
                  <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-3">
                    Biaya Pendaftaran
                  </p>
                  <p className="font-display text-3xl mb-4">Rp 500.000</p>

                  <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wide mb-1.5">
                    Bank Mandiri Virtual Account
                  </p>
                  <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-3">
                    <span className="font-mono font-bold text-sm tracking-wider">
                      {vaNumber}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          vaNumber.replace(/\s/g, "")
                        );
                      }}
                      className="text-xs font-bold text-sky shrink-0 hover:text-sky-700 transition"
                    >
                      Salin
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-coral-600 font-bold">
                    Bayar dalam 1x24 jam setelah pendaftaran
                  </div>
                </div>
              </div>
            </div>

            {/* Channel info */}
            <p className="text-center text-xs text-ink-300 mb-5">
              Konfirmasi ini juga terkirim ke WhatsApp &amp; Email yang Anda
              daftarkan
            </p>

            {/* Preview toggles */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  setWaPreview((v) => !v);
                  setEmailPreview(false);
                }}
                className="bg-white border border-ink/10 hover:bg-cloud font-bold text-xs py-3 rounded-full transition"
              >
                Lihat di WhatsApp
              </button>
              <button
                onClick={() => {
                  setEmailPreview((v) => !v);
                  setWaPreview(false);
                }}
                className="bg-white border border-ink/10 hover:bg-cloud font-bold text-xs py-3 rounded-full transition"
              >
                Lihat di Email
              </button>
            </div>

            {/* WA Preview */}
            {waPreview && (
              <div className="mb-6">
                <p className="text-xs font-bold text-ink-300 uppercase tracking-widest mb-3 text-center">
                  Tampilan Pesan WhatsApp
                </p>
                <div className="bg-[#E4DDD4] rounded-3xl p-5">
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[85%]">
                    <p className="font-bold text-sm text-leaf-600 mb-2">
                      JACOS Admission
                    </p>
                    <p className="text-sm leading-relaxed">
                      Assalamu&apos;alaikum, Bpk/Ibu{" "}
                      <b>{formData.parentName}</b>
                      <br />
                      <br />
                      Pendaftaran ananda <b>{formData.fullName}</b> untuk{" "}
                      <b>Primary School</b> JACOS telah kami terima.
                      <br />
                      <br />
                      Mohon selesaikan biaya pendaftaran:
                      <br />
                      Rp <b>500.000</b>
                      <br />
                      Mandiri VA: <b>{vaNumber}</b>
                      <br />
                      <br />
                      Terima kasih
                    </p>
                    <p className="text-[10px] text-ink-300 text-right mt-2">
                      ✓✓
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Preview */}
            {emailPreview && (
              <div className="mb-6">
                <p className="text-xs font-bold text-ink-300 uppercase tracking-widest mb-3 text-center">
                  Tampilan Email
                </p>
                <div className="bg-white rounded-3xl border border-ink/10 overflow-hidden">
                  <div className="px-5 py-3 border-b border-ink/8 text-xs text-ink-300">
                    <p>
                      <span className="font-bold text-ink">Dari:</span>{" "}
                      admission@jacos.id
                    </p>
                    <p>
                      <span className="font-bold text-ink">Subjek:</span>{" "}
                      Konfirmasi Pendaftaran &amp; Pembayaran — {registrationNo}
                    </p>
                  </div>
                  <div className="p-5 text-sm text-ink-400 leading-relaxed">
                    Yth. Bapak/Ibu <b className="text-ink">{formData.parentName}</b>,
                    <br />
                    <br />
                    Pendaftaran ananda{" "}
                    <b className="text-ink">{formData.fullName}</b> untuk{" "}
                    <b className="text-ink">Primary School</b> di JACOS telah
                    kami terima. Untuk melanjutkan proses seleksi, mohon
                    selesaikan pembayaran biaya pendaftaran sebesar{" "}
                    <b className="text-ink">Rp 500.000</b> ke{" "}
                    <b className="text-ink">
                      Bank Mandiri Virtual Account {vaNumber}
                    </b>{" "}
                    dalam 1x24 jam.
                    <br />
                    <br />
                    Hormat kami,
                    <br />
                    Tim Admission JACOS
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full text-center text-sm font-bold text-sky mt-2"
            >
              ← Daftar Siswa Lain
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ======= MULTI-STEP FORM =======
  return (
    <div className="min-h-screen flex bg-cloud">
      {renderSidebar()}

      <div className="flex-1 overflow-y-auto flex">
        <main className="w-full max-w-3xl px-6 sm:px-12 py-10 mx-auto min-h-screen flex flex-col justify-center">
          <div className="w-full">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold text-ink-300 mb-2">
                <span className="text-sky">
                  Langkah {currentStep} dari {totalSteps}
                </span>
                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white overflow-hidden shadow-inner">
                <div
                  className="h-full bg-sky rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* ===== STEP 1: INFORMASI SISWA ===== */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Informasi Siswa
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Ceritakan tentang ananda.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Isi sesuai dokumen resmi (akte lahir / KK) ya, Bapak/Ibu.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Nama Lengkap Anak
                      </Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => updateForm("fullName", e.target.value)}
                        placeholder="Contoh: Nayla Putri Ramadhani"
                        className="h-12 rounded-2xl bg-white border-ink/10"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tempat Lahir
                        </Label>
                        <Input
                          value={formData.birthPlace}
                          onChange={(e) =>
                            updateForm("birthPlace", e.target.value)
                          }
                          placeholder="Jakarta"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tanggal Lahir
                        </Label>
                        <Input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) =>
                            updateForm("birthDate", e.target.value)
                          }
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Jenis Kelamin
                      </Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(v) => updateForm("gender", v)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Laki-laki" />
                          <span className="text-sm font-semibold">
                            Laki-laki
                          </span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Perempuan" />
                          <span className="text-sm font-semibold">
                            Perempuan
                          </span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Kategori Pendaftaran
                      </Label>
                      <RadioGroup
                        value={formData.category}
                        onValueChange={(v) => updateForm("category", v)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Siswa Baru" />
                          <span className="text-sm font-semibold">
                            Siswa Baru
                          </span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Pindahan" />
                          <span className="text-sm font-semibold">
                            Pindahan
                          </span>
                        </Label>
                      </RadioGroup>
                    </div>

                    {/* NISN — only shown for Pindahan */}
                    {formData.category === "Pindahan" && (
                      <div className="animate-in fade-in duration-200">
                        <Label className="block text-sm font-bold mb-2">
                          NISN{" "}
                          <span className="text-ink-300 font-medium">
                            (dari sekolah asal)
                          </span>
                        </Label>
                        <Input
                          value={formData.nisn}
                          onChange={(e) => updateForm("nisn", e.target.value)}
                          placeholder="10 digit NISN"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                        <p className="text-xs text-ink-300 mt-2">
                          Wajib diisi untuk siswa pindahan — cek di buku rapor
                          atau ijazah sekolah asal.
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Alamat Lengkap Siswa
                      </Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        placeholder="Sesuai KK / tempat tinggal saat ini"
                        className="min-h-[100px] rounded-2xl bg-white border-ink/10 p-4"
                      />
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Apply untuk Sekolah
                      </Label>
                      <RadioGroup
                        value={formData.program}
                        onValueChange={(v) => updateForm("program", v)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-sky bg-sky-50 px-5 py-3.5 cursor-pointer">
                          <RadioGroupItem value="Primary" />
                          <span className="text-sm font-semibold">
                            Primary School
                          </span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 px-5 py-3.5 opacity-50 cursor-not-allowed">
                          <RadioGroupItem value="Kindergarten" disabled />
                          <span className="text-sm font-semibold">
                            Kindergarten{" "}
                            <span className="block text-[10px] font-medium text-ink-300">
                              Segera hadir
                            </span>
                          </span>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: DATA ORANG TUA ===== */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Data Orang Tua
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Data orang tua / wali.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Kontak utama yang akan kami hubungi terkait proses admisi.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Nama Lengkap Orang Tua / Wali
                      </Label>
                      <Input
                        value={formData.parentName}
                        onChange={(e) =>
                          updateForm("parentName", e.target.value)
                        }
                        placeholder="Contoh: Ahmad Ramadhan"
                        className="h-12 rounded-2xl bg-white border-ink/10"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tempat Lahir
                        </Label>
                        <Input
                          value={formData.parentBirthPlace}
                          onChange={(e) =>
                            updateForm("parentBirthPlace", e.target.value)
                          }
                          placeholder="Bandung"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tanggal Lahir
                        </Label>
                        <Input
                          type="date"
                          value={formData.parentBirthDate}
                          onChange={(e) =>
                            updateForm("parentBirthDate", e.target.value)
                          }
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Pekerjaan
                        </Label>
                        <Input
                          value={formData.parentJob}
                          onChange={(e) =>
                            updateForm("parentJob", e.target.value)
                          }
                          placeholder="Contoh: Wiraswasta"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Hubungan dengan Anak
                        </Label>
                        <Select
                          value={formData.parentRelation}
                          onValueChange={(v) => updateForm("parentRelation", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ayah">Ayah</SelectItem>
                            <SelectItem value="ibu">Ibu</SelectItem>
                            <SelectItem value="wali">Wali</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Pendidikan Terakhir
                      </Label>
                      <Select
                        value={formData.parentEducation}
                        onValueChange={(v) => updateForm("parentEducation", v)}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                          <SelectValue placeholder="Pilih pendidikan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="S1">S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="block text-sm font-bold">
                          Alamat Lengkap
                        </Label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-sky cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-sky w-3.5 h-3.5"
                            onChange={(e) =>
                              copyStudentAddress(e.target.checked)
                            }
                          />
                          Sama dengan alamat siswa
                        </label>
                      </div>
                      <Textarea
                        value={formData.parentAddress}
                        onChange={(e) =>
                          updateForm("parentAddress", e.target.value)
                        }
                        placeholder="Sesuai KTP / tempat tinggal saat ini"
                        className="min-h-[100px] rounded-2xl bg-white border-ink/10 p-4"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Nomor WhatsApp
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => updateForm("phone", e.target.value)}
                          placeholder="08xx-xxxx-xxxx"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateForm("email", e.target.value)}
                          placeholder="nama@email.com"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: DOKUMEN ===== */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Dokumen
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Unggah dokumen pendukung.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Format JPG, PNG, atau PDF — maksimal 5MB per file.
                  </p>

                  <div className="space-y-4">
                    {[
                      { key: "kk", title: "Kartu Keluarga (KK)" },
                      { key: "akte", title: "Akte Lahir" },
                      {
                        key: "foto4x3",
                        title: "Pas Foto 4x3",
                        desc: "Latar belakang polos, wajah menghadap depan",
                      },
                      {
                        key: "foto2x3",
                        title: "Pas Foto 2x3",
                        desc: "Latar belakang polos, wajah menghadap depan",
                      },
                    ].map((doc) => {
                      const uploaded = docUploaded[doc.key];
                      return (
                        <Label
                          key={doc.key}
                          className={`flex items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-5 cursor-pointer transition-all ${
                            uploaded
                              ? "border-leaf bg-leaf-50"
                              : "border-ink/15 bg-white hover:border-sky hover:bg-sky-50"
                          }`}
                        >
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, doc.key)}
                          />
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                              uploaded
                                ? "bg-leaf text-white"
                                : "bg-sky-50 text-sky"
                            }`}
                          >
                            {uploaded ? "✓" : "📄"}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{doc.title}</p>
                            <p
                              className={`text-xs font-normal mt-0.5 ${uploaded ? "text-leaf-600 font-semibold" : "text-ink-300"}`}
                            >
                              {uploaded
                                ? `${uploaded} — terunggah`
                                : doc.desc || "Belum diunggah"}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold shrink-0 ${uploaded ? "text-leaf-600" : "text-sky"}`}
                          >
                            {uploaded ? "Ganti" : "Pilih File"}
                          </span>
                        </Label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== STEP 4: REVIEW & KIRIM ===== */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Review & Kirim
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Periksa kembali datanya.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Pastikan semua data sudah benar sebelum dikirim ke tim
                    admisi JACOS.
                  </p>

                  <div className="space-y-4">
                    {/* Informasi Siswa */}
                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-sky">
                          Informasi Siswa
                        </p>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs font-bold text-ink-300 hover:text-sky"
                        >
                          Ubah
                        </button>
                      </div>
                      <dl className="text-sm space-y-1.5 text-ink-400">
                        <div className="flex justify-between">
                          <dt>Nama</dt>
                          <dd className="font-semibold text-ink">
                            {formData.fullName || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Tempat, Tgl Lahir</dt>
                          <dd className="font-semibold text-ink">
                            {formData.birthPlace || "-"},{" "}
                            {formData.birthDate
                              ? new Date(formData.birthDate).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Jenis Kelamin</dt>
                          <dd className="font-semibold text-ink">
                            {formData.gender}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Kategori</dt>
                          <dd className="font-semibold text-ink">
                            {formData.category}
                          </dd>
                        </div>
                        {formData.category === "Pindahan" && formData.nisn && (
                          <div className="flex justify-between">
                            <dt>NISN</dt>
                            <dd className="font-semibold text-ink">
                              {formData.nisn}
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt>Alamat</dt>
                          <dd className="font-semibold text-ink text-right max-w-[220px]">
                            {formData.address || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Program</dt>
                          <dd className="font-semibold text-ink">
                            Primary School
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Data Orang Tua */}
                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-sky">
                          Data Orang Tua
                        </p>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs font-bold text-ink-300 hover:text-sky"
                        >
                          Ubah
                        </button>
                      </div>
                      <dl className="text-sm space-y-1.5 text-ink-400">
                        <div className="flex justify-between">
                          <dt>Nama</dt>
                          <dd className="font-semibold text-ink">
                            {formData.parentName || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Tempat, Tgl Lahir</dt>
                          <dd className="font-semibold text-ink">
                            {formData.parentBirthPlace || "-"},{" "}
                            {formData.parentBirthDate
                              ? new Date(
                                  formData.parentBirthDate
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Pekerjaan</dt>
                          <dd className="font-semibold text-ink">
                            {formData.parentJob || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Pendidikan Terakhir</dt>
                          <dd className="font-semibold text-ink">
                            {formData.parentEducation}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Hubungan</dt>
                          <dd className="font-semibold text-ink capitalize">
                            {formData.parentRelation}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>WhatsApp</dt>
                          <dd className="font-semibold text-ink">
                            {formData.phone || "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Email</dt>
                          <dd className="font-semibold text-ink">
                            {formData.email || "-"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Dokumen */}
                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-sky">Dokumen</p>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs font-bold text-ink-300 hover:text-sky"
                        >
                          Ubah
                        </button>
                      </div>
                      <p className="text-sm text-ink-400">
                        {Object.keys(docUploaded).length} dari 4 dokumen
                        terunggah
                        {Object.keys(docUploaded).length < 4 && (
                          <span className="text-gold-600 font-semibold">
                            {" "}
                            — lengkapi sebelum mengirim.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Agreement */}
                    <Label className="flex items-start gap-3 pt-4 cursor-pointer">
                      <Checkbox
                        className="mt-0.5"
                        checked={formData.agreed}
                        onCheckedChange={(v) => updateForm("agreed", !!v)}
                      />
                      <span className="text-xs text-ink-400 leading-relaxed font-normal">
                        Saya menyatakan bahwa seluruh data &amp; dokumen yang
                        diberikan adalah benar dan dapat dipertanggungjawabkan.
                      </span>
                    </Label>
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className={`font-bold text-sm text-ink-400 px-4 sm:px-6 py-6 rounded-full hover:bg-ink/5 ${currentStep === 1 ? "invisible" : ""}`}
                >
                  ← Kembali
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="bg-sky hover:bg-sky-600 text-white font-bold text-sm px-6 sm:px-8 py-6 rounded-full shadow-lg shadow-sky/30 transition h-auto"
                >
                  {isSubmitting
                    ? "Memproses..."
                    : currentStep === totalSteps
                      ? "Kirim Pendaftaran"
                      : `Lanjut ke ${stepLabels[currentStep] || ""} →`}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
