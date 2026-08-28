"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Calendar,
  CreditCard,
  Heart,
  Activity,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Info,
  Clock,
  HelpCircle,
  Car,
  Users,
  MapPin,
  Building,
  Ruler,
  Weight as WeightIcon,
  Copy,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  const stepMeta = [
    {
      step: 1,
      title: "Data Calon Siswa",
      subtitle: "Biodata & Riwayat Medis",
      icon: User,
    },
    {
      step: 2,
      title: "Orang Tua & Wali",
      subtitle: "Data Ayah, Ibu & Wali",
      icon: Users,
    },
    {
      step: 3,
      title: "Kontak & Penjemputan",
      subtitle: "Darurat & Transportasi",
      icon: Phone,
    },
    {
      step: 4,
      title: "Upload Dokumen",
      subtitle: "Berkas Pendukung",
      icon: FileText,
    },
    {
      step: 5,
      title: "Konfirmasi & Kirim",
      subtitle: "Pernyataan & Submit",
      icon: ShieldCheck,
    },
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

  // 1. Restore data dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && typeof parsed.formData === "object") {
          setFormData((prev) => ({
            ...prev,
            ...parsed.formData,
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
      console.warn("Gagal memulihkan draft:", e);
    } finally {
      setIsHydrated(true);
    }
  }, [STORAGE_KEY, prefill.fullName, prefill.program, prefill.gender]);

  // 2. Simpan draft otomatis ke localStorage setelah hydrated
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
        console.warn("Gagal menyimpan draft:", e);
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

    // Validasi Step 1: Informasi Calon Siswa
    if (currentStep === 1) {
      if (!formData.program) newErrors.program = "Jenjang pendaftaran wajib dipilih.";
      if (!formData.fullName.trim()) newErrors.fullName = "Nama lengkap wajib diisi sesuai Akta.";
      if (!formData.gender) newErrors.gender = "Jenis kelamin wajib dipilih.";
      if (!formData.birthPlace.trim()) newErrors.birthPlace = "Tempat lahir wajib diisi.";
      if (!formData.birthDate) newErrors.birthDate = "Tanggal lahir wajib dipilih.";

      if (!formData.nik.trim()) {
        newErrors.nik = "NIK calon siswa wajib diisi.";
      } else if (formData.nik.length !== 16 || !digitRegex.test(formData.nik)) {
        newErrors.nik = "NIK harus tepat 16 digit angka.";
      }

      if (!formData.religion) newErrors.religion = "Agama wajib dipilih.";
      if (!formData.nationality) newErrors.nationality = "Kewarganegaraan wajib dipilih.";
      if (!formData.bloodType) newErrors.bloodType = "Golongan darah wajib dipilih.";
      if (!formData.address.trim()) newErrors.address = "Alamat lengkap tempat tinggal wajib diisi.";
      if (!formData.primaryLanguage.trim()) newErrors.primaryLanguage = "Bahasa utama di rumah wajib diisi.";
    }

    // Validasi Step 2: Data Orang Tua & Wali
    if (currentStep === 2) {
      const hasFather = formData.fatherName.trim() !== "";
      const hasMother = formData.motherName.trim() !== "";

      if (!hasFather && !hasMother) {
        newErrors.fatherName = "Data Ayah / Daddy atau Ibu / Mommy wajib diisi salah satu.";
        newErrors.motherName = "Data Ayah / Daddy atau Ibu / Mommy wajib diisi salah satu.";
      }

      if (hasFather) {
        if (!formData.fatherNik.trim() || formData.fatherNik.length !== 16 || !digitRegex.test(formData.fatherNik)) {
          newErrors.fatherNik = "NIK Ayah harus tepat 16 digit angka.";
        }
        if (!formData.fatherJob.trim()) newErrors.fatherJob = "Pekerjaan Ayah wajib diisi.";
        if (!formData.fatherPhone.trim() || formData.fatherPhone.length < 9 || !digitRegex.test(formData.fatherPhone)) {
          newErrors.fatherPhone = "No. HP Ayah minimal 9 digit angka.";
        }
        if (!formData.fatherEmail.trim() || !emailRegex.test(formData.fatherEmail)) {
          newErrors.fatherEmail = "Email Ayah wajib diisi dengan format yang valid.";
        }
      }

      if (hasMother) {
        if (!formData.motherNik.trim() || formData.motherNik.length !== 16 || !digitRegex.test(formData.motherNik)) {
          newErrors.motherNik = "NIK Ibu harus tepat 16 digit angka.";
        }
        if (!formData.motherJob.trim()) newErrors.motherJob = "Pekerjaan Ibu wajib diisi.";
        if (!formData.motherPhone.trim() || formData.motherPhone.length < 9 || !digitRegex.test(formData.motherPhone)) {
          newErrors.motherPhone = "No. HP Ibu minimal 9 digit angka.";
        }
        if (!formData.motherEmail.trim() || !emailRegex.test(formData.motherEmail)) {
          newErrors.motherEmail = "Email Ibu wajib diisi dengan format yang valid.";
        }
      }
    }

    // Validasi Step 3: Kontak Darurat
    if (currentStep === 3) {
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = "Nama kontak darurat wajib diisi.";
      if (!formData.emergencyContactRelation.trim()) newErrors.emergencyContactRelation = "Hubungan dengan siswa wajib diisi.";
      if (!formData.emergencyContactPhone.trim() || formData.emergencyContactPhone.length < 9 || !digitRegex.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = "No. HP kontak darurat minimal 9 digit angka.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      alert(`Mohon lengkapi bagian yang diperlukan:\n• ${firstError}`);
      return;
    }

    if (currentStep === totalSteps) {
      if (!formData.agreed) {
        alert("Anda wajib menyetujui pernyataan Kebenaran Data sebelum mengirimkan pendaftaran.");
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
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}

        setSuccessData({
          registrationNo: res.registrationNo || registrationNo,
          studentName: res.studentName || formData.fullName,
          parentName: res.parentName || formData.fatherName || formData.motherName,
        });
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(res.message || "Terjadi kendala saat mengirim data. Silakan coba lagi.");
      }
    } else {
      setCurrentStep((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // ======= SUCCESS / VIP REGISTRATION TICKET SCREEN =======
  if (isSuccess) {
    return (
      <div className="min-h-full bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-ink py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
        {/* Background ambient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-sky/15 via-sky/5 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-leaf/10 blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-2xl mx-auto">
          {/* Header Brand */}
          <div className="text-center mb-8">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={160}
              height={46}
              className="dark:hidden object-contain mx-auto mb-4"
              priority
            />
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-leaf-50 text-leaf-700 text-xs font-extrabold border border-leaf-200/80 shadow-xs uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-leaf-600" />
              Pendaftaran Berhasil Dikirim
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink mt-3">
              Alhamdulillah, Data Telah Diterima!
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-md mx-auto">
              Terima kasih Mommy &amp; Daddy. Formulir online admission ananda telah berhasil kami terima secara lengkap.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-2xl shadow-sky-950/5 overflow-hidden mb-6">
            {/* Header Stripe */}
            <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 p-6 sm:p-7 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-display font-extrabold text-lg text-white">
                  J
                </div>
                <div>
                  <p className="font-display font-extrabold text-base leading-tight">
                    JACOS Admission Pass
                  </p>
                  <p className="text-xs text-white/80 font-medium">
                    Jakarta Cosmopolite Islamic School
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest">
                  Nomor Registrasi
                </p>
                <p className="font-mono text-sm sm:text-base font-extrabold text-white">
                  {successData.registrationNo}
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Calon Siswa
                  </p>
                  <p className="font-bold text-ink text-sm sm:text-base mt-0.5">
                    {successData.studentName}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Jenjang Pendaftaran
                  </p>
                  <p className="font-bold text-sky text-sm sm:text-base mt-0.5">
                    {formData.program} School
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Orang Tua / Wali
                  </p>
                  <p className="font-bold text-ink text-sm sm:text-base mt-0.5">
                    {successData.parentName || "-"}
                  </p>
                </div>
              </div>

              {/* Next Steps Bento Card */}
              <div className="rounded-3xl bg-gradient-to-br from-sky-50/80 via-white to-sky-50/40 border border-sky-100 p-6 space-y-3">
                <div className="flex items-center gap-2 text-sky-700 font-extrabold text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  Langkah Selanjutnya
                </div>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Tim Admission JACOS akan memverifikasi kelengkapan data &amp; berkas Anda dalam waktu <strong>1x24 jam kerja</strong>.
                  </li>
                  <li>
                    Anda akan menerima <strong>email konfirmasi</strong> beserta <strong>akun login resmi Portal Orang Tua (Parent Portal)</strong>.
                  </li>
                  <li>
                    Jadwal asesmen / observasi calon siswa akan dikirimkan langsung melalui WhatsApp &amp; Portal.
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20sudah%20mengisi%20formulir%20pendaftaran%20online%20dengan%20No.%20Registrasi:%20${successData.registrationNo}%20untuk%20ananda%20${encodeURIComponent(
                    successData.studentName
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-13 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 active:scale-[0.98] transition"
                >
                  <Phone className="w-4 h-4" />
                  Konfirmasi via WhatsApp Admission
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center h-13 px-6 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition active:scale-[0.98]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======= MAIN FORM VIEW (PLAYFUL, MODERN, CLEAN) =======
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-ink selection:bg-sky/20 selection:text-sky relative overflow-hidden font-sans pb-16">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-sky/15 via-sky/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-gold/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[15%] left-[-10%] w-[600px] h-[600px] bg-leaf/10 blur-[130px] pointer-events-none -z-10" />

      {/* Background dot watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#2F6FED_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none -z-10" />

      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={140}
              height={38}
              className="dark:hidden object-contain"
              priority
            />
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Online Admission
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isDraftRestored && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-bold border border-leaf-200/80 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-leaf-600" />
                <span className="hidden sm:inline">Draft Tersimpan Otomatis</span>
                <span className="sm:hidden">Tersimpan</span>
              </span>
            )}
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/70 text-xs font-mono font-bold text-slate-700">
              No: {registrationNo}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* HERO TITLE SECTION */}
        <section className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky text-xs font-extrabold border border-sky-100 shadow-xs uppercase tracking-wider mb-4">
            Formulir Pendaftaran Siswa Baru
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
            Langkah Awal Menuju Masa Depan Gemilang
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-4xl mx-auto leading-relaxed">
            Silakan lengkapi data calon siswa dan orang tua di bawah ini. Isian Anda tersimpan secara otomatis sehingga tidak akan hilang saat halaman dimuat ulang.
          </p>
        </section>

        {/* STEP PROGRESS BAR & STEP NAVIGATION */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
            <span className="text-sky font-extrabold uppercase tracking-wider">
              Langkah {currentStep} dari {totalSteps}: {stepMeta[currentStep - 1].title}
            </span>
            <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              {Math.round((currentStep / totalSteps) * 100)}% Selesai
            </span>
          </div>

          {/* Progress fill bar */}
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-sky via-sky-500 to-sky-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Pill Buttons */}
          <div className="grid grid-cols-5 gap-2 pt-1 border-t border-slate-100">
            {stepMeta.map((item) => {
              const isActive = item.step === currentStep;
              const isPast = item.step < currentStep;

              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setCurrentStep(item.step)}
                  className={`p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-sky-50 text-sky border-2 border-sky shadow-xs"
                      : isPast
                      ? "bg-slate-50 text-leaf-700 hover:bg-slate-100 border border-slate-200/60"
                      : "text-slate-400 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold mb-1 transition ${
                      isActive
                        ? "bg-sky text-white shadow-sm"
                        : isPast
                        ? "bg-leaf text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : item.step}
                  </div>
                  <span
                    className={`text-[11px] font-bold hidden md:inline truncate max-w-full ${
                      isActive ? "text-sky" : isPast ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* MAIN FORM CONTAINER CARD */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-2xl shadow-sky-950/5 p-6 sm:p-10 md:p-12 relative overflow-hidden">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* ======================================================== */}
            {/* STEP 1: INFORMASI SISWA                                  */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <span className="w-9 h-9 rounded-2xl bg-sky text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                      Informasi Calon Siswa
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Lengkapi data identitas calon siswa sesuai dokumen resmi / Akta Kelahiran.
                    </p>
                  </div>
                </div>

                {/* Jenjang Pendaftaran */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    Jenjang Pendaftaran / Level Applying For <span className="text-coral">*</span>
                  </label>
                  <RadioGroup
                    value={formData.program}
                    onValueChange={(v) => updateForm("program", v)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      { id: "Preschool", label: "Preschool", sub: "Usia 2 - 3 Tahun" },
                      { id: "Kindergarten", label: "Kindergarten", sub: "TK A & TK B (Usia 4 - 6)" },
                      { id: "Primary", label: "Primary School", sub: "Sekolah Dasar (Grade 1 - 6)" },
                    ].map((p) => {
                      const isChecked = formData.program === p.id;
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                            isChecked
                              ? "border-sky bg-sky-50/80 shadow-sm"
                              : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <RadioGroupItem value={p.id} className="mt-0.5" />
                          <div>
                            <p className="text-sm font-extrabold text-ink">{p.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{p.sub}</p>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                  {errors.program && (
                    <p className="text-xs font-bold text-coral flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.program}
                    </p>
                  )}
                </div>

                {/* Nama Lengkap & Panggilan */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nama Lengkap / Full Name <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateForm("fullName", e.target.value)}
                      placeholder="Sesuai Akta Kelahiran"
                      className={`w-full h-12 px-4 rounded-2xl border bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 ${
                        errors.fullName ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-xs font-bold text-coral mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nama Panggilan / Nickname
                    </label>
                    <input
                      type="text"
                      value={formData.preferredName}
                      onChange={(e) => updateForm("preferredName", e.target.value)}
                      placeholder="Nama panggilan sehari-hari"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Gender & Tempat Lahir */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Jenis Kelamin / Gender <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => updateForm("gender", e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki / Male</option>
                        <option value="Perempuan">Perempuan / Female</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tempat Lahir / Birth Place <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => updateForm("birthPlace", e.target.value)}
                      placeholder="Kota tempat lahir"
                      className={`w-full h-12 px-4 rounded-2xl border bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 ${
                        errors.birthPlace ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                      }`}
                    />
                    {errors.birthPlace && (
                      <p className="text-xs font-bold text-coral mt-1">{errors.birthPlace}</p>
                    )}
                  </div>
                </div>

                {/* Tanggal Lahir & NIK */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tanggal Lahir / Birth Date <span className="text-coral">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateForm("birthDate", e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl border bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink ${
                        errors.birthDate ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                      }`}
                    />
                    {errors.birthDate && (
                      <p className="text-xs font-bold text-coral mt-1">{errors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      NIK Calon Siswa (16 Digit) <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => updateForm("nik", e.target.value.replace(/\D/g, ""))}
                      placeholder="Nomor Induk Kependudukan (pada KK)"
                      className={`w-full h-12 px-4 rounded-2xl border bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-mono font-semibold text-ink placeholder:text-slate-400 ${
                        errors.nik ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                      }`}
                    />
                    {errors.nik && (
                      <p className="text-xs font-bold text-coral mt-1">{errors.nik}</p>
                    )}
                  </div>
                </div>

                {/* NISN & Agama */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      NISN (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => updateForm("nisn", e.target.value)}
                      placeholder="10 digit NISN jika sudah memiliki"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Agama / Religion <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.religion}
                        onChange={(e) => updateForm("religion", e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                      >
                        {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Kewarganegaraan & Golongan Darah */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kewarganegaraan <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.nationality}
                        onChange={(e) => updateForm("nationality", e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                      >
                        <option value="WNI">WNI (Warga Negara Indonesia)</option>
                        <option value="WNA">WNA (Warga Negara Asing)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Golongan Darah / Blood Type <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.bloodType}
                        onChange={(e) => updateForm("bloodType", e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                      >
                        {["A", "B", "AB", "O"].map((b) => (
                          <option key={b} value={b}>
                            Golongan {b}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Tinggi Badan & Berat Badan Bento Block */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-50/70 via-white to-slate-50 border border-sky-100/90 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky">
                    Fisik Calon Siswa (Pertumbuhan)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Tinggi Badan</span>
                        <span className="text-[10px] text-sky font-extrabold bg-sky-100/80 px-2 py-0.5 rounded-md">
                          Centimeter (cm)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="30"
                          max="250"
                          value={formData.height}
                          onChange={(e) => updateForm("height", e.target.value)}
                          placeholder="Contoh: 120"
                          className="w-full h-12 px-4 pr-12 rounded-2xl border border-slate-200 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 pointer-events-none">
                          cm
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Berat Badan</span>
                        <span className="text-[10px] text-sky font-extrabold bg-sky-100/80 px-2 py-0.5 rounded-md">
                          Kilogram (kg)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="200"
                          value={formData.weight}
                          onChange={(e) => updateForm("weight", e.target.value)}
                          placeholder="Contoh: 25"
                          className="w-full h-12 px-4 pr-12 rounded-2xl border border-slate-200 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 pointer-events-none">
                          kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Alamat Lengkap Tempat Tinggal <span className="text-coral">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="Nama Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                    className={`w-full p-4 rounded-2xl border bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 resize-none ${
                      errors.address ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs font-bold text-coral mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Bahasa & Asal Sekolah */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Bahasa Utama di Rumah <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.primaryLanguage}
                      onChange={(e) => updateForm("primaryLanguage", e.target.value)}
                      placeholder="Contoh: Bahasa Indonesia & English"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Asal Sekolah Sebelumnya
                    </label>
                    <input
                      type="text"
                      value={formData.previousSchool}
                      onChange={(e) => updateForm("previousSchool", e.target.value)}
                      placeholder="Nama TK / Playgroup asal (jika ada)"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Alergi & Riwayat Medis */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Alergi / Kebutuhan Khusus
                    </label>
                    <textarea
                      rows={2}
                      value={formData.allergiesSpecialNeeds}
                      onChange={(e) => updateForm("allergiesSpecialNeeds", e.target.value)}
                      placeholder="Tuliskan jika ada alergi makanan/obat tertentu"
                      className="w-full p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Riwayat Medis / Penyakit
                    </label>
                    <textarea
                      rows={2}
                      value={formData.medicalHistory}
                      onChange={(e) => updateForm("medicalHistory", e.target.value)}
                      placeholder="Riwayat penyakit atau penanganan khusus"
                      className="w-full p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: ORANG TUA & WALI                                  */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <span className="w-9 h-9 rounded-2xl bg-sky text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                      Data Orang Tua &amp; Wali
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Lengkapi data Ayah / Daddy dan Ibu / Mommy untuk akun akses portal &amp; komunikasi resmi.
                    </p>
                  </div>
                </div>

                {/* DATA AYAH / DADDY CARD */}
                <div className="bg-gradient-to-br from-sky-50/50 via-white to-slate-50/50 rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 text-sky-700 font-extrabold text-sm uppercase tracking-wider">
                    Data Ayah / Daddy
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nama Lengkap Ayah
                      </label>
                      <input
                        type="text"
                        value={formData.fatherName}
                        onChange={(e) => updateForm("fatherName", e.target.value)}
                        placeholder="Nama lengkap Ayah"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.fatherName && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.fatherName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        NIK Ayah (16 Digit)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={formData.fatherNik}
                        onChange={(e) =>
                          updateForm("fatherNik", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="16 digit NIK Ayah"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-mono font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.fatherNik && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.fatherNik}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Pekerjaan Ayah
                      </label>
                      <input
                        type="text"
                        value={formData.fatherJob}
                        onChange={(e) => updateForm("fatherJob", e.target.value)}
                        placeholder="Contoh: Karyawan Swasta, Wiraswasta, Dokter"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.fatherJob && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.fatherJob}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Penghasilan Bulanan Ayah
                      </label>
                      <div className="relative">
                        <select
                          value={formData.fatherIncome}
                          onChange={(e) => updateForm("fatherIncome", e.target.value)}
                          className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                        >
                          <option value="">Pilih Rentang Penghasilan</option>
                          {INCOME_RANGES.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        No. HP / WhatsApp Ayah
                      </label>
                      <input
                        type="tel"
                        value={formData.fatherPhone}
                        onChange={(e) =>
                          updateForm("fatherPhone", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="0812xxxxxxx"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.fatherPhone && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.fatherPhone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Email Ayah (Untuk Akun Portal)
                      </label>
                      <input
                        type="email"
                        value={formData.fatherEmail}
                        onChange={(e) => updateForm("fatherEmail", e.target.value)}
                        placeholder="ayah@contoh.com"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.fatherEmail && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.fatherEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DATA IBU / MOMMY CARD */}
                <div className="bg-gradient-to-br from-rose-50/30 via-white to-slate-50/50 rounded-3xl p-6 sm:p-8 border border-rose-100/80 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm uppercase tracking-wider">
                    Data Ibu / Mommy
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nama Lengkap Ibu
                      </label>
                      <input
                        type="text"
                        value={formData.motherName}
                        onChange={(e) => updateForm("motherName", e.target.value)}
                        placeholder="Nama lengkap Ibu"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.motherName && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.motherName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        NIK Ibu (16 Digit)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={formData.motherNik}
                        onChange={(e) =>
                          updateForm("motherNik", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="16 digit NIK Ibu"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-mono font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.motherNik && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.motherNik}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Pekerjaan Ibu
                      </label>
                      <input
                        type="text"
                        value={formData.motherJob}
                        onChange={(e) => updateForm("motherJob", e.target.value)}
                        placeholder="Contoh: Ibu Rumah Tangga, Wiraswasta, PNS"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.motherJob && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.motherJob}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Penghasilan Bulanan Ibu
                      </label>
                      <div className="relative">
                        <select
                          value={formData.motherIncome}
                          onChange={(e) => updateForm("motherIncome", e.target.value)}
                          className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                        >
                          <option value="">Pilih Rentang Penghasilan</option>
                          {INCOME_RANGES.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        No. HP / WhatsApp Ibu
                      </label>
                      <input
                        type="tel"
                        value={formData.motherPhone}
                        onChange={(e) =>
                          updateForm("motherPhone", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="0812xxxxxxx"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.motherPhone && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.motherPhone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Email Ibu (Untuk Akun Portal)
                      </label>
                      <input
                        type="email"
                        value={formData.motherEmail}
                        onChange={(e) => updateForm("motherEmail", e.target.value)}
                        placeholder="ibu@contoh.com"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                      {errors.motherEmail && (
                        <p className="text-xs font-bold text-coral mt-1">{errors.motherEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DATA WALI (OPSIONAL) */}
                <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-600 font-extrabold text-sm uppercase tracking-wider">
                      Data Wali (Opsional)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateForm("guardianName", formData.fatherName);
                          updateForm("guardianRelation", "Ayah");
                          updateForm("guardianPhone", formData.fatherPhone);
                          updateForm("guardianIncome", formData.fatherIncome);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                      >
                        Sama dgn Ayah
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateForm("guardianName", formData.motherName);
                          updateForm("guardianRelation", "Ibu");
                          updateForm("guardianPhone", formData.motherPhone);
                          updateForm("guardianIncome", formData.motherIncome);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                      >
                        Sama dgn Ibu
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nama Lengkap Wali
                      </label>
                      <input
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => updateForm("guardianName", e.target.value)}
                        placeholder="Nama wali (jika diwakilkan)"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Hubungan dengan Calon Siswa
                      </label>
                      <input
                        type="text"
                        value={formData.guardianRelation}
                        onChange={(e) => updateForm("guardianRelation", e.target.value)}
                        placeholder="Contoh: Kakek, Nenek, Paman, Tante"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        No. HP / WhatsApp Wali
                      </label>
                      <input
                        type="tel"
                        value={formData.guardianPhone}
                        onChange={(e) =>
                          updateForm("guardianPhone", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="0812xxxxxxx"
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Penghasilan Bulanan Wali
                      </label>
                      <div className="relative">
                        <select
                          value={formData.guardianIncome}
                          onChange={(e) => updateForm("guardianIncome", e.target.value)}
                          className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200/90 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                        >
                          <option value="">Pilih Rentang Penghasilan</option>
                          {INCOME_RANGES.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: KONTAK DARURAT & PENJEMPUTAN                    */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <span className="w-9 h-9 rounded-2xl bg-sky text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    3
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                      Kontak Darurat &amp; Transportasi
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Informasi kontak keadaan mendesak dan operasional transportasi harian ananda.
                    </p>
                  </div>
                </div>

                {/* Kontak Darurat Bento Card */}
                <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50 rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm uppercase tracking-wider">
                    Kontak Darurat (Emergency Contact)
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nama Kontak <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                        placeholder="Nama kerabat/keluarga"
                        className={`w-full h-12 px-4 rounded-2xl border bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 ${
                          errors.emergencyContactName ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                        }`}
                      />
                      {errors.emergencyContactName && (
                        <p className="text-xs font-bold text-coral mt-1">
                          {errors.emergencyContactName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Hubungan <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => updateForm("emergencyContactRelation", e.target.value)}
                        placeholder="Contoh: Paman, Kakek, Tante"
                        className={`w-full h-12 px-4 rounded-2xl border bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 ${
                          errors.emergencyContactRelation ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                        }`}
                      />
                      {errors.emergencyContactRelation && (
                        <p className="text-xs font-bold text-coral mt-1">
                          {errors.emergencyContactRelation}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        No. HP / WhatsApp <span className="text-coral">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          updateForm("emergencyContactPhone", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="0812xxxxxxx"
                        className={`w-full h-12 px-4 rounded-2xl border bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 ${
                          errors.emergencyContactPhone ? "border-coral bg-coral-50/30" : "border-slate-200/90"
                        }`}
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-xs font-bold text-coral mt-1">
                          {errors.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transportasi & Penjemputan */}
                <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
                  <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm uppercase tracking-wider">
                    Transportasi Harian &amp; Otorisasi Penjemput
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Moda Transportasi Sehari-hari
                      </label>
                      <div className="relative">
                        <select
                          value={formData.dailyTransportation}
                          onChange={(e) => updateForm("dailyTransportation", e.target.value)}
                          className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink appearance-none cursor-pointer"
                        >
                          <option value="Antar-jemput sekolah">Antar-jemput sekolah (Jemputan JACOS)</option>
                          <option value="Diantar orang tua">Diantar orang tua (Daddy/Mommy)</option>
                          <option value="Kendaraan pribadi">Kendaraan pribadi (Supir / Kerabat)</option>
                          <option value="Transportasi umum">Transportasi umum</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Pihak yang Berwenang Menjemput</span>
                        <span className="text-[10px] text-slate-400 font-semibold lowercase">
                          (opsional)
                        </span>
                      </label>
                      <p className="text-xs text-slate-400 mb-1 leading-relaxed">
                        Boleh dikosongkan jika hanya orang tua yang menjemput. Boleh cantumkan nama supir/pengasuh (contoh: Pak Budi - Supir, Mbak Siti - Pengasuh).
                      </p>
                      <textarea
                        rows={3}
                        value={formData.authorizedPickup}
                        onChange={(e) => updateForm("authorizedPickup", e.target.value)}
                        placeholder="Tuliskan nama lengkap orang yang diizinkan menjemput selain orang tua"
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:border-sky focus:ring-4 focus:ring-sky/10 transition outline-none text-sm font-semibold text-ink placeholder:text-slate-400 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: UPLOAD DOKUMEN                                   */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <span className="w-9 h-9 rounded-2xl bg-sky text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    4
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                      Upload Berkas &amp; Dokumen
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Format didukung: JPG, PNG, PDF. Gambar otomatis dikompresi agar jernih &amp; cepat terkirim.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "akte", label: "Akta Kelahiran", required: true },
                    { key: "kk", label: "Kartu Keluarga (KK)", required: true },
                    { key: "ktp_orangtua", label: "KTP Orang Tua", required: true },
                    { key: "foto4x3", label: "Pas Foto 3x4 / 4x3", required: true },
                    { key: "kartu_imunisasi", label: "Kartu Imunisasi", required: false },
                    { key: "rapor", label: "Rapor Sekolah Asal", required: false },
                  ].map(({ key, label, required }) => {
                    const isUploaded = !!docUploaded[key];
                    const isCompressing = !!compressingKeys[key];

                    return (
                      <label
                        key={key}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                          isUploaded
                            ? "bg-leaf-50/50 border-leaf-200 hover:border-leaf-300"
                            : "bg-slate-50/60 border-slate-200/80 hover:border-sky/40 hover:bg-sky-50/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm bg-white border border-slate-200/80 shadow-xs group-hover:scale-105 transition">
                            <FileText
                              className={`w-5 h-5 ${isUploaded ? "text-leaf-600" : "text-slate-400 group-hover:text-sky"}`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              required
                                ? "bg-coral-50 text-coral border border-coral-200/60"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {required ? "Wajib" : "Opsional"}
                          </span>
                        </div>

                        <div>
                          <p className="font-extrabold text-sm text-ink">{label}</p>
                          {isCompressing ? (
                            <p className="text-xs text-sky-600 font-bold mt-1 animate-pulse flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky animate-ping" />
                              Mengompresi dokumen...
                            </p>
                          ) : isUploaded ? (
                            <p className="text-xs text-leaf-700 font-bold mt-1 truncate flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-leaf-600 stroke-[3]" />
                              {docUploaded[key]}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-1">
                              Klik untuk memilih file
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                          <span
                            className={`transition ${
                              isUploaded
                                ? "text-leaf-700"
                                : "text-slate-500 group-hover:text-sky"
                            }`}
                          >
                            {isUploaded ? "Ganti Berkas" : "Pilih Dokumen"}
                          </span>
                          <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky transition" />
                        </div>

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: REVIEW & DECLARATION                             */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <span className="w-9 h-9 rounded-2xl bg-sky text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    5
                  </span>
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                      Konfirmasi Akhir &amp; Pernyataan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Mohon pastikan seluruh data pendaftaran telah benar sebelum mengirimkan formulir.
                    </p>
                  </div>
                </div>

                {/* Ringkasan Singkat Bento Card */}
                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-6 space-y-4">
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Ringkasan Pendaftaran
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Nama Calon Siswa</p>
                      <p className="font-extrabold text-ink mt-0.5">{formData.fullName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Jenjang Dipilih</p>
                      <p className="font-extrabold text-sky mt-0.5">{formData.program} School</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Orang Tua / Wali</p>
                      <p className="font-extrabold text-ink mt-0.5">
                        {formData.fatherName || formData.motherName || formData.guardianName || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pernyataan & Checkbox Agreements */}
                <div className="space-y-4">
                  {/* Agreement 1 */}
                  <label className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-200/80 bg-white hover:border-slate-300 transition cursor-pointer">
                    <Checkbox
                      className="mt-1 w-5 h-5 rounded-md"
                      checked={formData.agreed}
                      onCheckedChange={(v) => updateForm("agreed", !!v)}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-ink">
                        1. Pernyataan Kebenaran Data (Declaration of Accuracy)
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Saya menyatakan bahwa seluruh data dan dokumen yang diberikan dalam formulir pendaftaran ini adalah benar, sah, dan dapat dipertanggungjawabkan.
                      </p>
                    </div>
                  </label>

                  {/* Agreement 2 */}
                  <div className="p-5 rounded-3xl border border-slate-200/80 bg-white space-y-3">
                    <div>
                      <p className="text-sm font-extrabold text-ink">
                        2. Persetujuan Dokumentasi Media (Media Consent)
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Memberikan izin kepada JACOS untuk menggunakan dokumentasi foto/video kegiatan edukasi ananda untuk keperluan arsip &amp; publikasi resmi sekolah.
                      </p>
                    </div>
                    <RadioGroup
                      value={formData.mediaConsent ? "yes" : "no"}
                      onValueChange={(v) => updateForm("mediaConsent", v === "yes")}
                      className="flex gap-4 pt-1"
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <RadioGroupItem value="yes" />
                        <span>Ya, Setuju (YES)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <RadioGroupItem value="no" />
                        <span>Tidak Setuju (NO)</span>
                      </label>
                    </RadioGroup>
                  </div>

                  {/* Agreement 3 */}
                  <div className="p-5 rounded-3xl bg-sky-50/50 border border-sky-100 text-xs text-slate-600 space-y-1">
                    <p className="font-extrabold text-sky-800">
                      3. Perlindungan &amp; Kerahasiaan Data Pribadi
                    </p>
                    <p className="leading-relaxed text-slate-500">
                      Seluruh data pribadi keluarga Anda dijamin kerahasiaannya dan hanya digunakan untuk keperluan administrasi akademik JACOS.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* NAVIGATION BUTTONS                                       */}
            {/* ======================================================== */}
            <div className="flex items-center justify-between pt-8 sm:pt-10 border-t border-slate-100 mt-8 sm:mt-10">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`h-13 px-6 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                  currentStep === 1 ? "invisible" : ""
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>

              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="h-13 px-8 rounded-2xl bg-sky hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold text-sm shadow-xl shadow-sky/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses Pengiriman...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <span>Kirim Formulir Pendaftaran</span>
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Lanjut ke {stepMeta[currentStep].title}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Footer Support Hotline */}
        <footer className="mt-12 text-center text-xs text-slate-400 space-y-2">
          <p>
            Butuh bantuan pengisian formulir? Hubungi WhatsApp Admission kami di{" "}
            <a
              href="https://wa.me/6282140000477"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky hover:underline"
            >
              0821-4000-0477
            </a>{" "}
            atau email{" "}
            <a href="mailto:admission@jacos.id" className="font-bold text-sky hover:underline">
              admission@jacos.id
            </a>
          </p>
          <p>© {new Date().getFullYear()} Jakarta Cosmopolite Islamic School. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
}
