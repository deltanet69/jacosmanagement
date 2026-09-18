import { getApplicantByToken } from "./actions";
import RegFormClient from "./RegFormClient";
import PaymentPendingClient from "./PaymentPendingClient";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { isValidEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RegPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const applicant = await getApplicantByToken(token);

  // Token tidak valid
  if (!applicant) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background ambient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-coral-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 text-center relative">
          <div className="w-18 h-18 rounded-3xl bg-coral-50 text-coral mx-auto mb-6 flex items-center justify-center border border-coral-100 shadow-xs">
            <AlertCircle className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-coral-50 text-coral text-xs font-extrabold uppercase tracking-wider mb-2">
            Link Tidak Valid
          </span>

          <h1 className="font-display text-2xl font-extrabold text-ink mt-2 mb-3">
            Tautan Pendaftaran Kedaluwarsa
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Link pendaftaran ini tidak ditemukan atau sudah tidak aktif. Silakan hubungi tim Admin Admission JACOS untuk mendapatkan link pendaftaran yang valid.
          </p>

          <div className="space-y-3">
            <a
              href="https://wa.me/6282140000477"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-green-500/20 transition"
            >
              <Phone className="w-4 h-4" />
              Hubungi Admin JACOS
            </a>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-[0.98] font-bold text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pembayaran belum lunas / belum di-approve admin
  if (applicant.payment_status !== "PAID") {
    return (
      <PaymentPendingClient
        token={token}
        applicant={applicant}
      />
    );
  }

  // Form dikunci HANYA JIKA form sudah pernah disubmit DAN tidak ada status REJECTED atau catatan penolakan/perbaikan dari admin
  const isRejectedOrNeedsUpdate =
    applicant.status === "REJECTED" ||
    applicant.payment_status === "REJECTED" ||
    (applicant.rejection_reason && applicant.rejection_reason.trim() !== "");

  if (applicant.form_submitted && !isRejectedOrNeedsUpdate) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background ambient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-leaf-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 text-center relative">
          <div className="w-18 h-18 rounded-3xl bg-leaf-50 text-leaf-600 mx-auto mb-6 flex items-center justify-center border border-leaf-100 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-extrabold uppercase tracking-wider mb-2">
            Status: Terkirim
          </span>

          <h1 className="font-display text-2xl font-extrabold text-ink mt-2 mb-3">
            Formulir Sudah Dikirimkan
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Formulir pendaftaran untuk ananda <strong className="text-ink">{applicant.student_name}</strong> sudah berhasil diterima dan saat ini sedang dalam proses verifikasi tim admin.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 mb-6 text-left space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">No. Registrasi</span>
              <span className="font-mono font-extrabold text-sky">{applicant.registration_no}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Jenjang</span>
              <span className="font-bold text-ink">{applicant.program}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="https://wa.me/6282140000477"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-green-500/20 transition"
            >
              <Phone className="w-4 h-4" />
              Tanya Status via WhatsApp
            </a>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-[0.98] font-bold text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Siapkan prefill data lengkap dari data yang tersimpan di DB
  const rawGuardians = applicant.guardians || [];
  const guardiansList: any[] = Array.isArray(rawGuardians)
    ? rawGuardians
    : rawGuardians
    ? [rawGuardians]
    : [];

  const father = guardiansList.find((g: any) => {
    const rel = (g?.relation || "").toUpperCase().trim();
    return rel === "FATHER" || rel === "AYAH";
  });

  const mother = guardiansList.find((g: any) => {
    const rel = (g?.relation || "").toUpperCase().trim();
    return rel === "MOTHER" || rel === "IBU";
  });

  const guardian = guardiansList.find((g: any) => {
    const rel = (g?.relation || "").toUpperCase().trim();
    return rel === "GUARDIAN" || rel === "WALI";
  });

  const fallbackGuardian = guardiansList[0];
  const isFallbackFather = fallbackGuardian && ["FATHER", "AYAH"].includes((fallbackGuardian.relation || "").toUpperCase().trim());
  const isFallbackMother = fallbackGuardian && ["MOTHER", "IBU"].includes((fallbackGuardian.relation || "").toUpperCase().trim());

  // Email terdaftar default dari pendaftaran awal
  const registeredEmail = (
    (isValidEmail(father?.email) ? father.email.trim() : "") ||
    (isValidEmail(mother?.email) ? mother.email.trim() : "") ||
    (isValidEmail(fallbackGuardian?.email) ? fallbackGuardian.email.trim() : "") ||
    ""
  );

  const fatherEmail = (
    (isValidEmail(father?.email) ? father.email.trim() : "") ||
    (isFallbackFather && isValidEmail(fallbackGuardian?.email) ? fallbackGuardian.email.trim() : "")
  );

  const motherEmail = (
    (isValidEmail(mother?.email) ? mother.email.trim() : "") ||
    (isFallbackMother && isValidEmail(fallbackGuardian?.email) ? fallbackGuardian.email.trim() : "")
  );

  const prefill = {
    fullName: applicant.student_name || "",
    preferredName: applicant.preferred_name || "",
    gender: applicant.gender === "MALE" ? "Laki-laki" : "Perempuan",
    program:
      applicant.program === "PRESCHOOL"
        ? "Preschool"
        : applicant.program === "KINDERGARTEN"
        ? "Kindergarten"
        : "Primary",
    birthPlace: applicant.birth_place !== "-" ? applicant.birth_place || "" : "",
    birthDate: applicant.birth_date ? applicant.birth_date.split("T")[0] : "",
    nik: applicant.nik !== "-" ? applicant.nik || "" : "",
    nisn: applicant.nisn !== "-" ? applicant.nisn || "" : "",
    religion: applicant.religion !== "-" ? applicant.religion || "Islam" : "Islam",
    nationality: applicant.nationality !== "-" ? applicant.nationality || "WNI" : "WNI",
    address: applicant.address !== "-" ? applicant.address || "" : "",
    primaryLanguage: applicant.primary_language !== "-" ? applicant.primary_language || "Bahasa Indonesia" : "Bahasa Indonesia",
    childOrder: applicant.child_order || "",
    previousSchool: applicant.previous_school || "",
    bloodType: applicant.blood_type !== "-" ? applicant.blood_type || "O" : "O",
    height: applicant.height || "",
    weight: applicant.weight || "",
    allergiesSpecialNeeds: applicant.allergies_special_needs || "",
    medicalHistory: applicant.medical_history || "",
    category: applicant.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru",

    registeredEmail,

    fatherName: father?.full_name || (isFallbackFather ? fallbackGuardian?.full_name : "") || "",
    fatherNik: father?.nik !== "-" ? father?.nik || "" : "",
    fatherJob: father?.occupation !== "-" ? father?.occupation || "" : "",
    fatherIncome: father?.monthly_income || "",
    fatherPhone: father?.phone !== "-" ? father?.phone || "" : "",
    fatherEmail,

    motherName: mother?.full_name || (isFallbackMother ? fallbackGuardian?.full_name : "") || "",
    motherNik: mother?.nik !== "-" ? mother?.nik || "" : "",
    motherJob: mother?.occupation !== "-" ? mother?.occupation || "" : "",
    motherIncome: mother?.monthly_income || "",
    motherPhone: mother?.phone !== "-" ? mother?.phone || "" : "",
    motherEmail,

    guardianName: guardian?.full_name || "",
    guardianRelation: guardian?.relation || "",
    guardianPhone: guardian?.phone !== "-" ? guardian?.phone || "" : "",
    guardianIncome: guardian?.monthly_income || "",

    emergencyContactName: applicant.emergency_contact_name || "",
    emergencyContactRelation: applicant.emergency_contact_relation || "",
    emergencyContactPhone: applicant.emergency_contact_phone || "",
    dailyTransportation: applicant.daily_transportation || "Antar-jemput sekolah",
    authorizedPickup: applicant.authorized_pickup_name || "",
    mediaConsent: applicant.media_consent ?? false,

    docUploaded: {
      ...(applicant.doc_photo_4x3 ? { foto4x3: "Pas Foto 3x4 / 4x3 (Terunggah)" } : {}),
      ...(applicant.doc_birth_certificate ? { akte: "Akta Kelahiran (Terunggah)" } : {}),
      ...(applicant.doc_family_card ? { kk: "Kartu Keluarga (Terunggah)" } : {}),
      ...(applicant.doc_parent_id ? { ktp_orangtua: "KTP Orang Tua (Terunggah)" } : {}),
      ...(applicant.doc_immunization_card ? { kartu_imunisasi: "Kartu Imunisasi (Terunggah)" } : {}),
      ...(applicant.doc_previous_report ? { rapor: "Rapor Sekolah Asal (Terunggah)" } : {}),
    }
  };

  return (
    <RegFormClient
      token={token}
      registrationNo={applicant.registration_no}
      prefill={prefill}
      status={applicant.status}
      rejectionReason={applicant.rejection_reason}
    />
  );
}
