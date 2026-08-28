"use client";

import { useState, useEffect } from "react";
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
import { submitApplicantByToken } from "./actions";

export const INCOME_RANGES = [
  "Tidak berpenghasilan",
  "Kurang dari Rp.5.000.000",
  "Rp.5.000.000 - Rp. 10.000.000",
  "Rp. 10.000.000 - Rp. 20.000.000",
  "Rp. 20.000.000 - Rp. 30.000.000",
  "Diatas 30.000.000",
] as const;

type Prefill = {
  fullName: string;
  gender: string;
  program: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
};

export default function RegFormClient({
  token,
  registrationNo,
  prefill,
}: {
  token: string;
  registrationNo: string;
  prefill: Prefill;
}) {
  const STORAGE_KEY = `jacos_reg_draft_${token}`;

  const [isHydrated, setIsHydrated] = useState(false);
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
  const [successData, setSuccessData] = useState({
    registrationNo,
    studentName: "",
    parentName: "",
  });

  const [docUploaded, setDocUploaded] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [compressingKeys, setCompressingKeys] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    program: prefill.program || "Primary",
    fullName: prefill.fullName || "",
    preferredName: "",
    gender: prefill.gender || "Laki-laki",
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
    height: "",
    weight: "",
    allergiesSpecialNeeds: "",
    medicalHistory: "",
    category: "Siswa Baru",

    fatherName: prefill.fatherName || "",
    fatherNik: "",
    fatherJob: "",
    fatherIncome: "",
    fatherPhone: prefill.fatherPhone || "",
    fatherEmail: prefill.fatherEmail || "",

    motherName: prefill.motherName || "",
    motherNik: "",
    motherJob: "",
    motherIncome: "",
    motherPhone: prefill.motherPhone || "",
    motherEmail: prefill.motherEmail || "",

    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianIncome: "",

    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    dailyTransportation: "Antar-jemput sekolah",
    authorizedPickup: "",

    agreed: false,
    mediaConsent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // 1. Restore data dari localStorage saat pertama kali client mount (SEBELUM melakukan save)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && typeof parsed.formData === "object") {
          setFormData((prev) => ({
            ...prev,
            ...parsed.formData,
            // Jika di draft kosong tapi ada prefill dari admin, gunakan prefill
            fullName: parsed.formData.fullName || prefill.fullName || prev.fullName,
            program: parsed.formData.program || prefill.program || prev.program,
            gender: parsed.formData.gender || prefill.gender || prev.gender,
          }));
          setIsDraftRestored(true);
        }
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= totalSteps) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch (e) {
      console.warn("Gagal memulihkan draft form:", e);
    } finally {
      setIsHydrated(true);
    }
  }, [STORAGE_KEY, prefill.fullName, prefill.program, prefill.gender]);

  // 2. Simpan draft secara otomatis ke localStorage HANYA setelah hydrated (mencegah overwrite data lama)
  useEffect(() => {
    if (isHydrated && !isSuccess) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            formData,
            currentStep,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn("Gagal menyimpan draft form:", e);
      }
    }
  }, [formData, currentStep, isHydrated, isSuccess, STORAGE_KEY]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const nextStep = async () => {
    const digitRegex = /^\d+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors: Record<string, string> = {};

    // Validasi Step 1: Informasi Siswa
    if (currentStep === 1) {
      if (!formData.program) newErrors.program = "Jenjang pendaftaran wajib dipilih.";
      if (!formData.fullName.trim()) newErrors.fullName = "Nama lengkap wajib diisi.";
      if (!formData.gender) newErrors.gender = "Jenis kelamin wajib dipilih.";
      if (!formData.birthPlace.trim()) newErrors.birthPlace = "Tempat lahir wajib diisi.";
      if (!formData.birthDate) newErrors.birthDate = "Tanggal lahir wajib diisi.";

      if (!formData.nik.trim()) {
        newErrors.nik = "NIK wajib diisi.";
      } else if (formData.nik.length !== 16 || !digitRegex.test(formData.nik)) {
        newErrors.nik = "NIK harus tepat 16 digit angka.";
      }

      if (!formData.religion) newErrors.religion = "Agama wajib dipilih.";
      if (!formData.nationality) newErrors.nationality = "Kewarganegaraan wajib dipilih.";
      if (!formData.bloodType) newErrors.bloodType = "Golongan darah wajib dipilih.";
      if (!formData.address.trim()) newErrors.address = "Alamat lengkap wajib diisi.";
      if (!formData.primaryLanguage.trim()) newErrors.primaryLanguage = "Bahasa utama di rumah wajib diisi.";
    }

    // Validasi Step 2: Orang Tua & Wali (Minimal 1 orang tua lengkap)
    if (currentStep === 2) {
      const hasFather = formData.fatherName.trim() !== "";
      const hasMother = formData.motherName.trim() !== "";

      if (!hasFather && !hasMother) {
        newErrors.fatherName = "Data Ayah / Daddy atau Ibu / Mommy wajib diisi salah satu.";
        newErrors.motherName = "Data Ayah / Daddy atau Ibu / Mommy wajib diisi salah satu.";
      }

      if (hasFather) {
        if (!formData.fatherNik.trim() || formData.fatherNik.length !== 16 || !digitRegex.test(formData.fatherNik)) {
          newErrors.fatherNik = "NIK Ayah / Daddy harus tepat 16 digit angka.";
        }
        if (!formData.fatherJob.trim()) newErrors.fatherJob = "Pekerjaan Ayah / Daddy wajib diisi.";
        if (!formData.fatherPhone.trim() || formData.fatherPhone.length < 9 || !digitRegex.test(formData.fatherPhone)) {
          newErrors.fatherPhone = "No HP Ayah / Daddy harus minimal 9 digit angka.";
        }
        if (!formData.fatherEmail.trim() || !emailRegex.test(formData.fatherEmail)) {
          newErrors.fatherEmail = "Email Ayah / Daddy wajib diisi dengan format yang benar.";
        }
      }

      if (hasMother) {
        if (!formData.motherNik.trim() || formData.motherNik.length !== 16 || !digitRegex.test(formData.motherNik)) {
          newErrors.motherNik = "NIK Ibu / Mommy harus tepat 16 digit angka.";
        }
        if (!formData.motherJob.trim()) newErrors.motherJob = "Pekerjaan Ibu / Mommy wajib diisi.";
        if (!formData.motherPhone.trim() || formData.motherPhone.length < 9 || !digitRegex.test(formData.motherPhone)) {
          newErrors.motherPhone = "No HP Ibu / Mommy harus minimal 9 digit angka.";
        }
        if (!formData.motherEmail.trim() || !emailRegex.test(formData.motherEmail)) {
          newErrors.motherEmail = "Email Ibu / Mommy wajib diisi dengan format yang benar.";
        }
      }
    }

    // Validasi Step 3: Kontak Darurat & Penjemputan (Penjemput OPSIONAL)
    if (currentStep === 3) {
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = "Nama kontak darurat wajib diisi.";
      if (!formData.emergencyContactRelation.trim()) newErrors.emergencyContactRelation = "Hubungan kontak darurat wajib diisi.";
      if (!formData.emergencyContactPhone.trim() || formData.emergencyContactPhone.length < 9 || !digitRegex.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = "No HP kontak darurat harus minimal 9 digit angka.";
      }
      // formData.authorizedPickup dibuat opsional (tanpa error).
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      alert("Terdapat isian yang belum lengkap atau tidak sesuai format. Silakan periksa kembali bagian yang bertanda merah.");
      return;
    }

    if (currentStep === totalSteps) {
      if (!formData.agreed) {
        alert("Anda harus menyetujui pernyataan Kebenaran Data untuk melanjutkan.");
        return;
      }
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));
      Object.entries(docFiles).forEach(([key, file]) => {
        fd.append(`file_${key}`, file);
      });

      const res = await submitApplicantByToken(token, fd);
      setIsSubmitting(false);

      if (res.success) {
        // Hapus cache draft setelah berhasil kirim
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}

        setSuccessData({
          registrationNo: res.registrationNo || registrationNo,
          studentName: res.studentName || formData.fullName,
          parentName: res.parentName || formData.fatherName || formData.motherName,
        });
        setIsSuccess(true);
        window.scrollTo(0, 0);
      } else {
        alert(res.message || "Terjadi kesalahan. Silakan coba lagi.");
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
      setCompressingKeys((prev) => ({ ...prev, [docKey]: true }));
      let processedFile = file;
      if (file.type.startsWith("image/")) {
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 0.6,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85,
            useWebWorker: true,
          });
        } catch (e) {
          console.error("Compression error:", e);
        }
      }
      setCompressingKeys((prev) => ({ ...prev, [docKey]: false }));
      setDocUploaded((prev) => ({ ...prev, [docKey]: processedFile.name }));
      setDocFiles((prev) => ({ ...prev, [docKey]: processedFile }));
    }
  };

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
              background: "repeating-linear-gradient(180deg,#D3E3FF 0 8px, transparent 8px 16px)",
            }}
          />
          {[1, 2, 3, 4, 5].map((step) => {
            const isActive = step === currentStep;
            const isPast = step < currentStep;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step)}
                className="flex items-start gap-4 relative text-left w-full group cursor-pointer"
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
                    className={`font-bold text-sm ${
                      isActive || isPast ? "text-sky" : "text-ink-300"
                    }`}
                  >
                    Langkah {step}
                  </p>
                  <p
                    className={`font-semibold text-sm ${
                      isActive || isPast ? "text-ink" : "text-ink-300"
                    }`}
                  >
                    {stepLabels[step - 1]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isDraftRestored && !isSuccess && (
        <div className="mt-8 bg-leaf-50 border border-leaf-200 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-leaf-700 font-medium">
          <span className="text-leaf-600 font-bold">✓</span>
          <span>Draft isian otomatis tersimpan &amp; dipulihkan.</span>
        </div>
      )}

      <div className="mt-auto bg-cloud rounded-3xl p-5">
        <p className="text-xs font-bold text-ink-400 mb-1">Butuh bantuan?</p>
        <p className="text-xs text-ink-300 leading-relaxed">
          WhatsApp 0821-4000-0477 atau email admission@jacos.id, setiap hari kerja.
        </p>
      </div>
    </aside>
  );

  // ======= SUCCESS SCREEN =======
  if (isSuccess) {
    return (
      <div className="min-h-screen flex bg-cloud">
        {renderSidebar()}
        <div className="flex-1 overflow-y-auto flex">
          <main className="w-full max-w-xl px-6 sm:px-12 py-14 mx-auto">
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
              <h1 className="font-display text-2xl font-bold mb-1">Formulir Berhasil Dikirim!</h1>
              <p className="text-ink-400 text-sm">
                Terima kasih. Data pendaftaran Anda telah kami terima.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden mb-5">
              <div className="bg-sky px-7 py-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-display text-white text-sm font-bold">
                  J
                </div>
                <div className="text-white">
                  <p className="font-display font-bold text-sm leading-none">JACOS</p>
                  <p className="text-[10px] text-white/70 font-semibold">
                    Jakarta Cosmopolite Islamic School
                  </p>
                </div>
                <span className="ml-auto font-mono text-[11px] text-white/80">
                  {successData.registrationNo}
                </span>
              </div>

              <div className="p-7">
                <p className="text-xs font-bold text-ink-300 uppercase tracking-widest mb-4">
                  Data Pendaftaran
                </p>
                <dl className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Nama Siswa</dt>
                    <dd className="font-bold text-right">{successData.studentName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Jenjang</dt>
                    <dd className="font-bold text-right">{formData.program} School</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-400">Nama Orang Tua</dt>
                    <dd className="font-bold text-right">{successData.parentName || "-"}</dd>
                  </div>
                </dl>

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
                    <strong className="text-ink">akses login Portal Orang Tua</strong> setelah proses
                    verifikasi selesai.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-ink-300">
              Konfirmasi juga akan dikirim ke email yang Anda daftarkan.
            </p>
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
              <div className="flex justify-between items-center text-xs font-bold text-ink-300 mb-2">
                <span className="text-sky">
                  Langkah {currentStep} dari {totalSteps}: {stepLabels[currentStep - 1]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-normal text-ink-300 hidden sm:inline">
                    💾 Draft tersimpan otomatis
                  </span>
                  <span className="font-mono text-ink-400">
                    {Math.round((currentStep / totalSteps) * 100)}%
                  </span>
                </div>
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
                  <h1 className="font-display text-3xl mb-2">Online Admission</h1>
                  <p className="text-ink-400 mb-10">Silakan lengkapi data calon siswa dengan benar.</p>

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
                        {["Preschool", "Kindergarten", "Primary"].map((p) => (
                          <Label
                            key={p}
                            className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50"
                          >
                            <RadioGroupItem value={p} />
                            <span className="text-sm font-semibold">
                              {p === "Primary" ? "Primary School" : p}
                            </span>
                          </Label>
                        ))}
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
                          className={`h-12 rounded-2xl bg-white border-ink/10 transition-colors ${
                            errors.fullName ? "ring-2 ring-red-500 bg-red-50" : ""
                          }`}
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-xs mt-1 font-semibold">
                            {errors.fullName}
                          </p>
                        )}
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
                        <Label className="block text-sm font-bold mb-2">Jenis Kelamin / Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(v) => updateForm("gender", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki / Male</SelectItem>
                            <SelectItem value="Perempuan">Perempuan / Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tempat Lahir / Birth Place
                        </Label>
                        <Input
                          value={formData.birthPlace}
                          onChange={(e) => updateForm("birthPlace", e.target.value)}
                          placeholder="Kota lahir"
                          className={`h-12 rounded-2xl bg-white border-ink/10 transition-colors ${
                            errors.birthPlace ? "ring-2 ring-red-500 bg-red-50" : ""
                          }`}
                        />
                        {errors.birthPlace && (
                          <p className="text-red-500 text-xs mt-1 font-semibold">
                            {errors.birthPlace}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Tanggal Lahir / Birth Date
                        </Label>
                        <Input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => updateForm("birthDate", e.target.value)}
                          className={`h-12 rounded-2xl bg-white border-ink/10 transition-colors ${
                            errors.birthDate ? "ring-2 ring-red-500 bg-red-50" : ""
                          }`}
                        />
                        {errors.birthDate && (
                          <p className="text-red-500 text-xs mt-1 font-semibold">
                            {errors.birthDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">NIK Siswa</Label>
                        <Input
                          value={formData.nik}
                          onChange={(e) => updateForm("nik", e.target.value.replace(/\D/g, ""))}
                          maxLength={16}
                          placeholder="16 digit NIK"
                          className={`h-12 rounded-2xl bg-white border-ink/10 transition-colors ${
                            errors.nik ? "ring-2 ring-red-500 bg-red-50" : ""
                          }`}
                        />
                        {errors.nik && (
                          <p className="text-red-500 text-xs mt-1 font-semibold">{errors.nik}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">NISN (Opsional)</Label>
                        <Input
                          value={formData.nisn}
                          onChange={(e) => updateForm("nisn", e.target.value)}
                          placeholder="10 digit NISN (jika ada)"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Agama</Label>
                        <Select
                          value={formData.religion}
                          onValueChange={(v) => updateForm("religion", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map(
                              (r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Kewarganegaraan</Label>
                        <Select
                          value={formData.nationality}
                          onValueChange={(v) => updateForm("nationality", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WNI">WNI</SelectItem>
                            <SelectItem value="WNA">WNA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Golongan Darah</Label>
                        <Select
                          value={formData.bloodType}
                          onValueChange={(v) => updateForm("bloodType", v)}
                        >
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["A", "B", "AB", "O"].map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Input Tinggi Badan & Berat Badan */}
                    <div className="grid sm:grid-cols-2 gap-6 bg-sky-50/50 p-5 rounded-3xl border border-sky-100">
                      <div>
                        <Label className="block text-sm font-bold mb-2 text-ink">
                          Tinggi Badan / Height <span className="text-xs font-semibold text-sky-600">(cm)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="30"
                            max="250"
                            value={formData.height}
                            onChange={(e) => updateForm("height", e.target.value)}
                            placeholder="Contoh: 120"
                            className="h-12 rounded-2xl bg-white border-ink/10 pr-12 font-medium"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-300 pointer-events-none">
                            cm
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2 text-ink">
                          Berat Badan / Weight <span className="text-xs font-semibold text-sky-600">(kg)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="5"
                            max="200"
                            value={formData.weight}
                            onChange={(e) => updateForm("weight", e.target.value)}
                            placeholder="Contoh: 25"
                            className="h-12 rounded-2xl bg-white border-ink/10 pr-12 font-medium"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-300 pointer-events-none">
                            kg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">Alamat Lengkap</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                        className="rounded-2xl bg-white border-ink/10 resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Bahasa Utama di Rumah
                        </Label>
                        <Input
                          value={formData.primaryLanguage}
                          onChange={(e) => updateForm("primaryLanguage", e.target.value)}
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">
                          Asal Sekolah Sebelumnya
                        </Label>
                        <Input
                          value={formData.previousSchool}
                          onChange={(e) => updateForm("previousSchool", e.target.value)}
                          placeholder="Nama sekolah / TK"
                          className="h-12 rounded-2xl bg-white border-ink/10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-bold mb-2">
                        Alergi / Kebutuhan Khusus
                      </Label>
                      <Textarea
                        value={formData.allergiesSpecialNeeds}
                        onChange={(e) => updateForm("allergiesSpecialNeeds", e.target.value)}
                        placeholder="Jika ada riwayat alergi makanan/obat atau kebutuhan khusus, tuliskan di sini"
                        className="rounded-2xl bg-white border-ink/10 resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">Riwayat Medis</Label>
                      <Textarea
                        value={formData.medicalHistory}
                        onChange={(e) => updateForm("medicalHistory", e.target.value)}
                        placeholder="Riwayat penyakit kronis, operasi, atau pengobatan berjalan"
                        className="rounded-2xl bg-white border-ink/10 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: ORANG TUA & WALI ===== */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Orang Tua &amp; Wali / Parent &amp; Guardian
                  </span>
                  <h1 className="font-display text-3xl mb-2">Data Orang Tua &amp; Wali</h1>
                  <p className="text-ink-400 mb-10">
                    Lengkapi data ayah/daddy, ibu/mommy, dan wali (jika ada).
                  </p>

                  <div className="space-y-8">
                    {/* Data Ayah / Daddy */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink/5 shadow-sm">
                      <h3 className="font-bold text-sm mb-5 text-sky uppercase tracking-wider flex items-center gap-2">
                         Data Ayah / Daddy
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Lengkap Ayah / Daddy</Label>
                          <Input
                            value={formData.fatherName}
                            onChange={(e) => updateForm("fatherName", e.target.value)}
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.fatherName ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.fatherName && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.fatherName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">NIK Ayah / Daddy</Label>
                          <Input
                            value={formData.fatherNik}
                            onChange={(e) =>
                              updateForm("fatherNik", e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={16}
                            placeholder="16 digit NIK"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.fatherNik ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.fatherNik && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.fatherNik}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Pekerjaan Ayah / Daddy</Label>
                          <Input
                            value={formData.fatherJob}
                            onChange={(e) => updateForm("fatherJob", e.target.value)}
                            placeholder="Contoh: Karyawan Swasta, Wiraswasta, PNS"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.fatherJob ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.fatherJob && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.fatherJob}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Penghasilan Bulanan Ayah / Daddy
                          </Label>
                          <Select
                            value={formData.fatherIncome}
                            onValueChange={(v) => updateForm("fatherIncome", v)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-cloud border-transparent font-medium">
                              <SelectValue placeholder="Pilih Rentang Penghasilan" />
                            </SelectTrigger>
                            <SelectContent>
                              {INCOME_RANGES.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP / WA Ayah / Daddy</Label>
                          <Input
                            value={formData.fatherPhone}
                            onChange={(e) =>
                              updateForm("fatherPhone", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="0812xxxxxxx"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.fatherPhone ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.fatherPhone && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.fatherPhone}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Email Ayah / Daddy{" "}
                            <span className="text-xs font-normal text-ink-300">
                              (Akun login portal)
                            </span>
                          </Label>
                          <Input
                            type="email"
                            value={formData.fatherEmail}
                            onChange={(e) => updateForm("fatherEmail", e.target.value)}
                            placeholder="contoh@gmail.com"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.fatherEmail ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.fatherEmail && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.fatherEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Data Ibu / Mommy */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink/5 shadow-sm">
                      <h3 className="font-bold text-sm mb-5 text-sky uppercase tracking-wider flex items-center gap-2">
                        Data Ibu / Mommy
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Lengkap Ibu / Mommy</Label>
                          <Input
                            value={formData.motherName}
                            onChange={(e) => updateForm("motherName", e.target.value)}
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.motherName ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.motherName && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.motherName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">NIK Ibu / Mommy</Label>
                          <Input
                            value={formData.motherNik}
                            onChange={(e) =>
                              updateForm("motherNik", e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={16}
                            placeholder="16 digit NIK"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.motherNik ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.motherNik && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.motherNik}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Pekerjaan Ibu / Mommy</Label>
                          <Input
                            value={formData.motherJob}
                            onChange={(e) => updateForm("motherJob", e.target.value)}
                            placeholder="Contoh: Ibu Rumah Tangga, Dokter, Wiraswasta"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.motherJob ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.motherJob && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.motherJob}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Penghasilan Bulanan Ibu / Mommy
                          </Label>
                          <Select
                            value={formData.motherIncome}
                            onValueChange={(v) => updateForm("motherIncome", v)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-cloud border-transparent font-medium">
                              <SelectValue placeholder="Pilih Rentang Penghasilan" />
                            </SelectTrigger>
                            <SelectContent>
                              {INCOME_RANGES.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP / WA Ibu / Mommy</Label>
                          <Input
                            value={formData.motherPhone}
                            onChange={(e) =>
                              updateForm("motherPhone", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="0812xxxxxxx"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.motherPhone ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.motherPhone && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.motherPhone}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Email Ibu / Mommy{" "}
                            <span className="text-xs font-normal text-ink-300">
                              (Akun login portal)
                            </span>
                          </Label>
                          <Input
                            type="email"
                            value={formData.motherEmail}
                            onChange={(e) => updateForm("motherEmail", e.target.value)}
                            placeholder="contoh@gmail.com"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.motherEmail ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.motherEmail && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.motherEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Data Wali (Opsional) */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink/5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                        <h3 className="font-bold text-sm text-ink-400 uppercase tracking-wider flex items-center gap-2">
                          <span>👤</span> Wali (Opsional)
                        </h3>
                        <div className="flex gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              updateForm("guardianName", formData.fatherName);
                              updateForm("guardianRelation", "Ayah");
                              updateForm("guardianPhone", formData.fatherPhone);
                              updateForm("guardianIncome", formData.fatherIncome);
                            }}
                            className="px-3 py-1.5 bg-cloud rounded-xl hover:bg-cloud-600 transition-colors font-medium cursor-pointer"
                          >
                            Sama dgn Ayah / Daddy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateForm("guardianName", formData.motherName);
                              updateForm("guardianRelation", "Ibu");
                              updateForm("guardianPhone", formData.motherPhone);
                              updateForm("guardianIncome", formData.motherIncome);
                            }}
                            className="px-3 py-1.5 bg-cloud rounded-xl hover:bg-cloud-600 transition-colors font-medium cursor-pointer"
                          >
                            Sama dgn Ibu / Mommy
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Wali</Label>
                          <Input
                            value={formData.guardianName}
                            onChange={(e) => updateForm("guardianName", e.target.value)}
                            placeholder="Nama lengkap wali"
                            className="h-12 rounded-2xl bg-cloud border-transparent"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Hubungan</Label>
                          <Input
                            value={formData.guardianRelation}
                            onChange={(e) => updateForm("guardianRelation", e.target.value)}
                            placeholder="Kakek, Nenek, Paman, dll."
                            className="h-12 rounded-2xl bg-cloud border-transparent"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP / WA Wali</Label>
                          <Input
                            value={formData.guardianPhone}
                            onChange={(e) =>
                              updateForm("guardianPhone", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="0812xxxxxxx"
                            className="h-12 rounded-2xl bg-cloud border-transparent"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Penghasilan Bulanan Wali
                          </Label>
                          <Select
                            value={formData.guardianIncome}
                            onValueChange={(v) => updateForm("guardianIncome", v)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-cloud border-transparent font-medium">
                              <SelectValue placeholder="Pilih Rentang Penghasilan" />
                            </SelectTrigger>
                            <SelectContent>
                              {INCOME_RANGES.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: KONTAK & PENJEMPUTAN ===== */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Kontak &amp; Penjemputan / Emergency &amp; Pickup
                  </span>
                  <h1 className="font-display text-3xl mb-2">Kontak Darurat &amp; Penjemputan</h1>
                  <p className="text-ink-400 mb-10">
                    Informasi kontak darurat dan transportasi harian siswa.
                  </p>

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink/5 shadow-sm">
                      <h3 className="font-bold text-sm mb-5 text-sky uppercase tracking-wider">
                        Kontak Darurat
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-5">
                        <div>
                          <Label className="block text-sm font-bold mb-2">Nama Kontak</Label>
                          <Input
                            value={formData.emergencyContactName}
                            onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                            placeholder="Nama kerabat/keluarga"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.emergencyContactName ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.emergencyContactName && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.emergencyContactName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">Hubungan</Label>
                          <Input
                            value={formData.emergencyContactRelation}
                            onChange={(e) => updateForm("emergencyContactRelation", e.target.value)}
                            placeholder="Contoh: Paman, Tante, Kakek"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.emergencyContactRelation ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.emergencyContactRelation && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.emergencyContactRelation}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-2">No. HP / WA</Label>
                          <Input
                            value={formData.emergencyContactPhone}
                            onChange={(e) =>
                              updateForm("emergencyContactPhone", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="0812xxxxxxx"
                            className={`h-12 rounded-2xl bg-cloud border-transparent transition-colors ${
                              errors.emergencyContactPhone ? "ring-2 ring-red-500 bg-red-50" : ""
                            }`}
                          />
                          {errors.emergencyContactPhone && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {errors.emergencyContactPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-ink/5 shadow-sm">
                      <h3 className="font-bold text-sm mb-5 text-sky uppercase tracking-wider">
                        Transportasi &amp; Penjemputan
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <Label className="block text-sm font-bold mb-2">
                            Transportasi Sehari-hari
                          </Label>
                          <Select
                            value={formData.dailyTransportation}
                            onValueChange={(v) => updateForm("dailyTransportation", v)}
                          >
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-cloud border-transparent font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Antar-jemput sekolah">
                                Antar-jemput sekolah
                              </SelectItem>
                              <SelectItem value="Diantar orang tua">Diantar orang tua</SelectItem>
                              <SelectItem value="Kendaraan pribadi">Kendaraan pribadi</SelectItem>
                              <SelectItem value="Transportasi umum">Transportasi umum</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="block text-sm font-bold mb-1">
                            Pihak yang Berwenang Menjemput{" "}
                            <span className="text-xs font-normal text-ink-300">(Opsional)</span>
                          </Label>
                          <p className="text-xs text-ink-400 mb-2">
                            Boleh dikosongkan jika hanya orang tua yang menjemput. Boleh lebih dari satu (pisahkan dengan koma). Contoh: Budi (Supir), Mbak Ani (Pengasuh).
                          </p>
                          <Textarea
                            value={formData.authorizedPickup}
                            onChange={(e) => updateForm("authorizedPickup", e.target.value)}
                            placeholder="Nama lengkap orang yang diizinkan menjemput (selain orang tua)"
                            className="rounded-2xl bg-cloud border-transparent resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 4: DOKUMEN ===== */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Dokumen / Documents
                  </span>
                  <h1 className="font-display text-3xl mb-2">Upload Dokumen</h1>
                  <p className="text-ink-400 mb-10">
                    Upload dokumen pendukung pendaftaran. Format: JPG, PNG, atau PDF. Max 5MB.
                  </p>

                  <div className="space-y-4">
                    {[
                      { key: "akte", label: "Akta Kelahiran", required: true },
                      { key: "kk", label: "Kartu Keluarga (KK)", required: true },
                      { key: "ktp_orangtua", label: "KTP Orang Tua", required: true },
                      { key: "foto4x3", label: "Pas Foto 3x4 (terbaru)", required: true },
                      { key: "kartu_imunisasi", label: "Kartu Imunisasi", required: false },
                      { key: "rapor", label: "Rapor Sekolah Asal (jika ada)", required: false },
                    ].map(({ key, label, required }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 border border-ink/5 cursor-pointer hover:border-sky/30 transition group shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-sm">
                            {label} {required && <span className="text-coral text-xs">*</span>}
                          </p>
                          {compressingKeys[key] ? (
                            <p className="text-xs text-sky-600 font-semibold mt-0.5 animate-pulse">
                              ⏳ Mengoptimalkan &amp; mengompresi gambar...
                            </p>
                          ) : docUploaded[key] ? (
                            <p className="text-xs text-leaf-600 font-semibold mt-0.5">
                              ✓ {docUploaded[key]}
                            </p>
                          ) : (
                            <p className="text-xs text-ink-300 mt-0.5">Belum ada file</p>
                          )}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            compressingKeys[key]
                              ? "bg-sky-50 text-sky"
                              : docUploaded[key]
                              ? "bg-leaf-50 text-leaf-600"
                              : "bg-cloud text-ink-400 group-hover:bg-sky-50 group-hover:text-sky"
                          }`}
                        >
                          {compressingKeys[key]
                            ? "Memproses..."
                            : docUploaded[key]
                            ? "Ganti"
                            : "Upload"}
                        </div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== STEP 5: REVIEW & KIRIM ===== */}
              {currentStep === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Review &amp; Kirim / Declaration
                  </span>
                  <h1 className="font-display text-3xl mb-2">Konfirmasi Akhir.</h1>
                  <p className="text-ink-400 mb-10">Pastikan seluruh data sudah benar sebelum dikirimkan.</p>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
                      <Label className="flex items-start gap-4 cursor-pointer">
                        <Checkbox
                          className="mt-1 w-5 h-5"
                          checked={formData.agreed}
                          onCheckedChange={(v) => updateForm("agreed", !!v)}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold">
                            1. Kebenaran Data (Declaration of Data Accuracy)
                          </p>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Saya menyatakan bahwa seluruh data yang diberikan dalam formulir ini adalah benar dan akurat.
                            <br />
                            <i className="text-ink-300">
                              I hereby declare that all information provided in this form is accurate and true.
                            </i>
                          </p>
                        </div>
                      </Label>

                      <div className="pt-4 border-t border-ink/10">
                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-bold">
                            2. Persetujuan Media &amp; Publikasi (Media Consent)
                          </p>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            Saya mengizinkan pihak sekolah menggunakan foto/video kegiatan siswa untuk dokumentasi resmi dan publikasi sekolah.
                            <br />
                            <i className="text-ink-300">
                              I grant permission for the school to use student photos/videos for official educational/promotional purposes.
                            </i>
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
                        <p className="text-sm font-bold">
                          3. Kerahasiaan Data (Data Privacy Protection)
                        </p>
                        <p className="text-xs text-ink-400 leading-relaxed">
                          Seluruh data pribadi akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan administrasi pendidikan.
                          <br />
                          <i className="text-ink-300">
                            All personal data provided will be kept confidential and strictly used for school administrative purposes.
                          </i>
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
                  className={`font-bold text-sm text-ink-400 px-4 sm:px-6 py-6 rounded-full hover:bg-ink/5 cursor-pointer ${
                    currentStep === 1 ? "invisible" : ""
                  }`}
                >
                  ← Kembali
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="bg-sky hover:bg-sky-600 text-white font-bold text-sm px-6 sm:px-8 py-6 rounded-full shadow-lg shadow-sky/30 transition h-auto cursor-pointer"
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
