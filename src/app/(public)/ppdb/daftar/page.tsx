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
  const totalSteps = 5;
  const stepLabels = [
    "Informasi Siswa",
    "Orang Tua & Wali",
    "Kontak & Penjemputan",
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
    // Student Info
    program: "Primary",
    fullName: "",
    preferredName: "",
    gender: "Laki-laki",
    birthPlace: "",
    birthDate: "",
    nik: "",
    nisn: "",
    religion: "Islam",
    nationality: "WNI",
    address: "",
    primaryLanguage: "Bahasa Indonesia",
    childOrder: "",
    previousSchool: "",
    bloodType: "O",
    allergiesSpecialNeeds: "",
    medicalHistory: "",
    category: "Siswa Baru",

    // Parent Data - Father
    fatherName: "",
    fatherNik: "",
    fatherJob: "",
    fatherPhone: "",
    fatherEmail: "",

    // Parent Data - Mother
    motherName: "",
    motherNik: "",
    motherJob: "",
    motherPhone: "",
    motherEmail: "",

    // Guardian
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",

    // Emergency Contact & Pick Up
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    dailyTransportation: "Antar-jemput sekolah",
    authorizedPickup: "",

    agreed: false,
    mediaConsent: false,
  });

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = async () => {
    if (currentStep === totalSteps) {
      if (!formData.agreed) {
        alert("Anda harus menyetujui pernyataan Kebenaran Data untuk melanjutkan.");
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

  // (VA number dihapus - pembayaran sudah dilakukan sebelum link form diberikan)

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
          {[1, 2, 3, 4, 5].map((step) => {
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
                Formulir Berhasil Dikirim!
              </h1>
              <p className="text-ink-400 text-sm">
                Terima kasih, data Anda telah kami terima.
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
                    <dt className="text-ink-400">Jenjang</dt>
                    <dd className="font-bold text-right">{formData.program} School</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Nama Ayah</dt>
                    <dd className="font-bold text-right">
                      {formData.fatherName || "-"}
                    </dd>
                  </div>
                </dl>

                {/* Info box — tanpa info pembayaran */}
                <div className="rounded-3xl bg-sky-50 border border-sky-100 p-5">
                  <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">
                    Langkah Selanjutnya
                  </p>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    Formulir pendaftaran Anda telah kami terima. Tim admin JACOS akan segera
                    memverifikasi seluruh data dan dokumen yang Anda lampirkan.
                  </p>
                  <p className="text-sm text-ink-400 leading-relaxed mt-3">
                    Anda akan menerima <strong className="text-ink">email konfirmasi</strong> beserta{" "}
                    <strong className="text-ink">akses login Portal Orang Tua</strong> setelah
                    proses verifikasi selesai.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-ink-300 mb-5">
              Konfirmasi juga akan dikirim ke email yang Anda daftarkan.
            </p>

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
                    Informasi Siswa / Student Information
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Online Admission
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Silakan isi data calon siswa (Child&apos;s Information).
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Jenjang Pendaftaran / Level Applying For
                      </Label>
                      <RadioGroup
                        value={formData.program}
                        onValueChange={(v) => updateForm("program", v)}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      >
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Preschool" />
                          <span className="text-sm font-semibold">Preschool</span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Kindergarten" />
                          <span className="text-sm font-semibold">Kindergarten</span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Primary" />
                          <span className="text-sm font-semibold">Primary School</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Nama Lengkap / Full Name
                        </Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => updateForm("fullName", e.target.value)}
                          placeholder="Sesuai Akte Lahir"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Nama Panggilan / Preferred Name
                        </Label>
                        <Input
                          value={formData.preferredName}
                          onChange={(e) => updateForm("preferredName", e.target.value)}
                          placeholder="Nama panggilan"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Jenis Kelamin / Gender
                        </Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(v) => updateForm("gender", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki / Male</SelectItem>
                            <SelectItem value="Perempuan">Perempuan / Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Anak Ke / Child Order
                        </Label>
                        <Input
                          value={formData.childOrder}
                          onChange={(e) => updateForm("childOrder", e.target.value)}
                          placeholder="Contoh: Anak ke 2 dari 5 bersaudara"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tempat Lahir / Birth Place
                        </Label>
                        <Input
                          value={formData.birthPlace}
                          onChange={(e) => updateForm("birthPlace", e.target.value)}
                          placeholder="Kota lahir"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tanggal Lahir / Birth Date
                        </Label>
                        <Input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => updateForm("birthDate", e.target.value)}
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          NIK (Sesuai KK) / National ID
                        </Label>
                        <Input
                          value={formData.nik}
                          onChange={(e) => updateForm("nik", e.target.value)}
                          placeholder="16 Digit NIK"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          NISN / Student ID (Jika ada)
                        </Label>
                        <Input
                          value={formData.nisn}
                          onChange={(e) => updateForm("nisn", e.target.value)}
                          placeholder="NISN"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Agama / Religion
                        </Label>
                        <Select
                          value={formData.religion}
                          onValueChange={(v) => updateForm("religion", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Islam">Islam</SelectItem>
                            <SelectItem value="Kristen">Kristen</SelectItem>
                            <SelectItem value="Katolik">Katolik</SelectItem>
                            <SelectItem value="Hindu">Hindu</SelectItem>
                            <SelectItem value="Buddha">Buddha</SelectItem>
                            <SelectItem value="Konghucu">Konghucu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Kewarganegaraan / Nationality
                        </Label>
                        <Input
                          value={formData.nationality}
                          onChange={(e) => updateForm("nationality", e.target.value)}
                          placeholder="WNI / WNA"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Alamat Rumah / Home Address
                      </Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        placeholder="Alamat lengkap"
                        className="min-h-[80px] rounded-2xl bg-white border-ink/10 p-4"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Bahasa Utama di Rumah / Primary Language
                        </Label>
                        <Select
                          value={formData.primaryLanguage}
                          onValueChange={(v) => updateForm("primaryLanguage", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Golongan Darah / Blood Type
                        </Label>
                        <Select
                          value={formData.bloodType}
                          onValueChange={(v) => updateForm("bloodType", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Asal Sekolah / Previous School (Jika ada)
                      </Label>
                      <Input
                        value={formData.previousSchool}
                        onChange={(e) => updateForm("previousSchool", e.target.value)}
                        placeholder="Nama sekolah asal"
                        className="h-12 rounded-2xl bg-white border-ink/10"
                      />
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Alergi & Kebutuhan Khusus / Allergies & Special Needs
                      </Label>
                      <Textarea
                        value={formData.allergiesSpecialNeeds}
                        onChange={(e) => updateForm("allergiesSpecialNeeds", e.target.value)}
                        placeholder="Tuliskan jika ada alergi atau kebutuhan khusus..."
                        className="min-h-[80px] rounded-2xl bg-white border-ink/10 p-4"
                      />
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Riwayat Penyakit / Medical History
                      </Label>
                      <Textarea
                        value={formData.medicalHistory}
                        onChange={(e) => updateForm("medicalHistory", e.target.value)}
                        placeholder="Tuliskan riwayat penyakit (jika ada)..."
                        className="min-h-[80px] rounded-2xl bg-white border-ink/10 p-4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: DATA ORANG TUA ===== */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Orang Tua & Wali / Parent & Guardian
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Informasi Orang Tua
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Mohon lengkapi data Ayah, Ibu, atau Wali.
                  </p>

                  <div className="space-y-8">
                    {/* FATHER INFO */}
                    <div className="space-y-4">
                      <h3 className="font-display text-lg text-sky border-b pb-2">Data Ayah / Father&apos;s Info</h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Ayah</Label>
                          <Input
                            value={formData.fatherName}
                            onChange={(e) => updateForm("fatherName", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">NIK Ayah</Label>
                          <Input
                            value={formData.fatherNik}
                            onChange={(e) => updateForm("fatherNik", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Pekerjaan / Instansi</Label>
                          <Input
                            value={formData.fatherJob}
                            onChange={(e) => updateForm("fatherJob", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP/WA</Label>
                          <Input
                            value={formData.fatherPhone}
                            onChange={(e) => updateForm("fatherPhone", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="block text-sm font-bold mb-2">Email Ayah</Label>
                          <Input
                            type="email"
                            value={formData.fatherEmail}
                            onChange={(e) => updateForm("fatherEmail", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* MOTHER INFO */}
                    <div className="space-y-4">
                      <h3 className="font-display text-lg text-sky border-b pb-2">Data Ibu / Mother&apos;s Info</h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Ibu</Label>
                          <Input
                            value={formData.motherName}
                            onChange={(e) => updateForm("motherName", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">NIK Ibu</Label>
                          <Input
                            value={formData.motherNik}
                            onChange={(e) => updateForm("motherNik", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Pekerjaan / Instansi</Label>
                          <Input
                            value={formData.motherJob}
                            onChange={(e) => updateForm("motherJob", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP/WA</Label>
                          <Input
                            value={formData.motherPhone}
                            onChange={(e) => updateForm("motherPhone", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="block text-sm font-bold mb-2">Email Ibu</Label>
                          <Input
                            type="email"
                            value={formData.motherEmail}
                            onChange={(e) => updateForm("motherEmail", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* GUARDIAN INFO */}
                    <div className="space-y-4">
                      <h3 className="font-display text-lg text-sky border-b pb-2">Data Wali / Guardian (Jika Ada)</h3>
                      <div className="grid sm:grid-cols-3 gap-6">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Wali</Label>
                          <Input
                            value={formData.guardianName}
                            onChange={(e) => updateForm("guardianName", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Hubungan Wali</Label>
                          <Input
                            value={formData.guardianRelation}
                            onChange={(e) => updateForm("guardianRelation", e.target.value)}
                            placeholder="Contoh: Paman/Bibi"
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP Wali</Label>
                          <Input
                            value={formData.guardianPhone}
                            onChange={(e) => updateForm("guardianPhone", e.target.value)}
                            className="h-12 rounded-2xl bg-white border-ink/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: KONTAK DARURAT & PENJEMPUTAN ===== */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Kontak & Penjemputan / Contact & Pick Up
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Situasi Darurat & Penjemputan
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Informasi tambahan untuk keamanan dan kenyamanan siswa.
                  </p>

                  <div className="space-y-6">
                    <h3 className="font-display text-lg text-sky border-b pb-2">Kontak Darurat / Emergency Contact</h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Nama Kontak</Label>
                        <Input
                          value={formData.emergencyContactName}
                          onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Hubungan</Label>
                        <Input
                          value={formData.emergencyContactRelation}
                          onChange={(e) => updateForm("emergencyContactRelation", e.target.value)}
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">No HP/WA Darurat</Label>
                        <Input
                          value={formData.emergencyContactPhone}
                          onChange={(e) => updateForm("emergencyContactPhone", e.target.value)}
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <h3 className="font-display text-lg text-sky border-b pb-2 mt-8">Transportasi / Pick Up Information</h3>
                    <div>
                      <Label className="block text-sm font-bold mb-4">
                        Mode Transportasi Harian / Daily Transportation
                      </Label>
                      <RadioGroup
                        value={formData.dailyTransportation}
                        onValueChange={(v) => updateForm("dailyTransportation", v)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {[
                          "Antar-jemput sekolah",
                          "Jemputan sekolah",
                          "Jemputan pribadi",
                          "Jemputan orang tua",
                          "Lainnya"
                        ].map((option) => (
                          <Label key={option} className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                            <RadioGroupItem value={option} />
                            <span className="text-sm font-semibold">{option}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Pihak Berwenang Menjemput / Authorized Person to Pick Up
                      </Label>
                      <Input
                        value={formData.authorizedPickup}
                        onChange={(e) => updateForm("authorizedPickup", e.target.value)}
                        placeholder="Nama & Hubungan (Misal: Pak Budi - Sopir)"
                        className="h-12 rounded-2xl bg-white border-ink/10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 4: DOKUMEN ===== */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Dokumen / Required Documents
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Unggah Dokumen.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    File Anda akan kami kompres otomatis untuk menghemat data. Format JPG, PNG, atau PDF.
                  </p>

                  <div className="space-y-4">
                    {[
                      { key: "akte", title: "Fotokopi Akta Kelahiran", desc: "Copy of Birth Certificate" },
                      { key: "kk", title: "Fotokopi Kartu Keluarga", desc: "Copy of Family Card" },
                      { key: "ktp_orangtua", title: "Fotokopi KTP Orang Tua", desc: "Copy of Parent's ID Card" },
                      { key: "foto4x3", title: "Pas Foto Anak 3x4", desc: "Child's Photographs 3x4 (4 copies in 1 file or zip)" },
                      { key: "kartu_imunisasi", title: "Fotokopi Kartu Imunisasi", desc: "Copy of Immunization Card (if available)" },
                      { key: "rapor", title: "Rapor Sekolah Asal", desc: "Copy of Previous School Report (Jika Pindahan)" },
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

              {/* ===== STEP 5: REVIEW & KIRIM ===== */}
              {currentStep === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Review & Kirim / Declaration
                  </span>
                  <h1 className="font-display text-3xl mb-2">
                    Konfirmasi Akhir.
                  </h1>
                  <p className="text-ink-400 mb-10">
                    Pastikan seluruh data sudah benar sebelum dikirimkan.
                  </p>

                  <div className="space-y-6">
                    {/* Pernyataan */}
                    <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-5">
                      <Label className="flex items-start gap-4 cursor-pointer">
                        <Checkbox
                          className="mt-1 w-5 h-5"
                          checked={formData.agreed}
                          onCheckedChange={(v) => updateForm("agreed", !!v)}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold">1. Kebenaran Data (Declaration of Data Accuracy)</p>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Saya menyatakan bahwa seluruh data yang diberikan dalam formulir ini adalah benar dan akurat. <br/>
                            <i className="text-ink-300">I hereby declare that all information provided in this form is accurate and true.</i>
                          </p>
                        </div>
                      </Label>

                      <div className="pt-4 border-t border-ink/10">
                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-bold">2. Persetujuan Media & Publikasi (Media Consent)</p>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Saya mengizinkan pihak sekolah menggunakan foto/video kegiatan siswa untuk dokumentasi resmi dan publikasi sekolah. <br/>
                            <i className="text-ink-300">I grant permission for the school to use student photos/videos for official educational/promotional purposes.</i>
                          </p>
                        </div>
                        <RadioGroup
                          value={formData.mediaConsent ? "yes" : "no"}
                          onValueChange={(v) => updateForm("mediaConsent", v === "yes")}
                          className="flex gap-4"
                        >
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="yes" />
                            <span className="text-sm font-semibold">Ya, Setuju (YES)</span>
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="no" />
                            <span className="text-sm font-semibold">Tidak Setuju (NO)</span>
                          </Label>
                        </RadioGroup>
                      </div>

                      <div className="pt-4 border-t border-ink/10 space-y-1">
                        <p className="text-sm font-bold">3. Kerahasiaan Data (Data Privacy Protection)</p>
                        <p className="text-xs text-ink-400 leading-relaxed">
                          Seluruh data pribadi akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan administrasi pendidikan. <br/>
                          <i className="text-ink-300">All personal data provided will be kept confidential and strictly used for school administrative purposes.</i>
                        </p>
                      </div>
                    </div>
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
