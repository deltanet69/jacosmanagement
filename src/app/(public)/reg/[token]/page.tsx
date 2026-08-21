import { getApplicantByToken } from "./actions";
import RegFormClient from "./RegFormClient";
import Image from "next/image";

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
      <div className="min-h-screen flex items-center justify-center bg-cloud p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-coral-50 mx-auto mb-5 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold mb-2">Link Tidak Valid</h1>
          <p className="text-ink-400 text-sm leading-relaxed">
            Link pendaftaran ini tidak ditemukan atau sudah tidak aktif. Silakan hubungi pihak sekolah untuk mendapatkan link yang valid.
          </p>
          <a
            href="https://wa.me/6282140000477"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-6 py-3 rounded-2xl transition"
          >
            Hubungi Admin JACOS
          </a>
        </div>
      </div>
    );
  }

  // Form sudah pernah disubmit
  if (applicant.form_submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-leaf mx-auto mb-5 flex items-center justify-center shadow-lg shadow-leaf/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold mb-2">Formulir Sudah Terkirim</h1>
          <p className="text-ink-400 text-sm leading-relaxed">
            Formulir pendaftaran untuk ananda <strong className="text-ink">{applicant.student_name}</strong> sudah berhasil dikirimkan sebelumnya. Tim admin kami sedang memproses data Anda.
          </p>
          <p className="text-xs text-ink-300 mt-4">
            No. Registrasi: <span className="font-mono font-bold">{applicant.registration_no}</span>
          </p>
        </div>
      </div>
    );
  }

  // Siapkan prefill data dari apa yang sudah diisi admin
  const guardian = Array.isArray(applicant.guardians)
    ? applicant.guardians[0]
    : applicant.guardians;

  const prefill = {
    fullName: applicant.student_name || "",
    gender: applicant.gender === "MALE" ? "Laki-laki" : "Perempuan",
    program:
      applicant.program === "PRESCHOOL"
        ? "Preschool"
        : applicant.program === "KINDERGARTEN"
        ? "Kindergarten"
        : "Primary",
    // Prefill orang tua dari data yang diisi admin
    fatherName: guardian?.relation === "FATHER" ? guardian.full_name || "" : "",
    fatherPhone: guardian?.relation === "FATHER" ? guardian.phone || "" : "",
    fatherEmail: guardian?.relation === "FATHER" ? guardian.email || "" : "",
    motherName: guardian?.relation === "MOTHER" ? guardian.full_name || "" : "",
    motherPhone: guardian?.relation === "MOTHER" ? guardian.phone || "" : "",
    motherEmail: guardian?.relation === "MOTHER" ? guardian.email || "" : "",
  };

  return (
    <RegFormClient
      token={token}
      registrationNo={applicant.registration_no}
      prefill={prefill}
    />
  );
}
