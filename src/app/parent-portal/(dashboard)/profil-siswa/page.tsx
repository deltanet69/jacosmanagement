"use client";

import { useEffect, useState } from "react";
import { createParentClient } from "@/lib/supabase/client";
import { getCompleteStudentProfile } from "../../server-actions";
import {
  User,
  CreditCard,
  Download,
  Lock,
  GraduationCap,
  MapPin,
  Calendar,
  VenetianMask,
  Hash,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-36" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-gray-100 rounded w-16" />
              <div className="h-3.5 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilSiswaPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const supabase = createParentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const user = session.user;
        const studentIdMeta = user.user_metadata?.student_id;
        const email = user.email;

        const res = await getCompleteStudentProfile(email, studentIdMeta);

        if (res.success) {
          let loadedStudent = res.student;
          let loadedApplicant = res.applicant;

          if (loadedStudent && loadedApplicant) {
            loadedStudent = {
              ...loadedStudent,
              birth_date: loadedStudent.birth_date || loadedApplicant.birth_date,
              birth_place: (loadedStudent.birth_place === "-" ? null : loadedStudent.birth_place) || loadedApplicant.birth_place,
              gender: loadedStudent.gender || loadedApplicant.gender,
              address: loadedStudent.address || loadedApplicant.address,
            };
          }

          if (!loadedStudent && loadedApplicant) {
            loadedStudent = {
              id: null,
              full_name: loadedApplicant.student_name,
              nis: null,
              nisn: loadedApplicant.nisn,
              gender: loadedApplicant.gender,
              birth_date: loadedApplicant.birth_date,
              birth_place: loadedApplicant.birth_place,
              program: loadedApplicant.program,
              address: loadedApplicant.address,
              school_classes: null as any,
              _fromApplicant: true,
            } as any;
          }

          setStudent(loadedStudent);
          setApplicant(loadedApplicant);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <SkeletonCard />;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2.5">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <User size={24} className="text-amber-500" />
        </div>
        <p className="font-bold text-gray-800 text-sm">Data siswa belum tersedia</p>
        <p className="text-xs text-gray-400 max-w-xs">
          Data siswa akan muncul setelah proses penerimaan selesai dan diverifikasi admin.
        </p>
      </div>
    );
  }

  const studentName = student.full_name || "—";
  const initials = studentName.split(" ").filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const className =
    Array.isArray(student.school_classes)
      ? student.school_classes[0]?.name
      : student.school_classes?.name || null;

  const programLabel: Record<string, string> = {
    PRESCHOOL: "Preschool",
    KINDERGARTEN: "Kindergarten (TK)",
    PRIMARY_SCHOOL: "Primary School (SD)",
    SD: "Primary School (SD)",
    TK: "Kindergarten (TK)",
  };

  const genderLabel =
    student.gender === "MALE" || student.gender === "Laki-laki"
      ? "Laki-laki"
      : student.gender === "FEMALE" || student.gender === "Perempuan"
      ? "Perempuan"
      : student.gender || "—";

  const birthDate = student.birth_date
    ? new Date(student.birth_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const birthPlace = student.birth_place && student.birth_place !== "-"
    ? student.birth_place
    : null;

  const avatarGradient =
    student.program === "PRESCHOOL"
      ? "from-orange-400 to-amber-500"
      : student.program === "KINDERGARTEN" || student.program === "TK"
      ? "from-pink-400 to-rose-500"
      : "from-blue-500 to-indigo-600";

  const accentColor =
    student.program === "PRESCHOOL"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : student.program === "KINDERGARTEN" || student.program === "TK"
      ? "bg-pink-50 text-pink-700 border-pink-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  const fields = [
    { label: "NIS / NISN", value: `${student.nis || "—"} / ${student.nisn || applicant?.nisn || "—"}`, icon: Hash },
    { label: "Kelas & Program", value: `${className ? className + " · " : ""}${programLabel[student.program] || student.program || "—"}`, icon: GraduationCap },
    { label: "TTL", value: birthPlace ? `${birthPlace}, ${birthDate}` : birthDate, icon: Calendar },
    { label: "Jenis Kelamin", value: genderLabel, icon: VenetianMask },
    ...(applicant?.height || applicant?.weight
      ? [{ label: "TB / BB", value: `${applicant.height ? applicant.height + " cm" : "—"} / ${applicant.weight ? applicant.weight + " kg" : "—"}`, icon: HeartPulse }]
      : []),
    ...(applicant?.blood_type
      ? [{ label: "Gol. Darah", value: applicant.blood_type, icon: HeartPulse }]
      : []),
    ...(student.address && student.address !== "-"
      ? [{ label: "Alamat", value: student.address, icon: MapPin }]
      : []),
    ...(applicant?.previous_school && applicant.previous_school !== "-"
      ? [{ label: "Asal Sekolah", value: applicant.previous_school, icon: GraduationCap }]
      : []),
  ];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">Profil Siswa</h1>
        <p className="text-xs text-gray-500 mt-0.5">Data akademik dan kartu identitas digital siswa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* LEFT: Profile Card */}
        <div className="lg:col-span-3 space-y-4">
          {/* Identity Card */}
          <div className="bg-white rounded-3xl shadow-2xs border border-gray-100 overflow-hidden">
            {/* Avatar banner */}
            <div className={`bg-gradient-to-r ${avatarGradient} h-20 sm:h-24 relative`}>
              <div className="absolute -bottom-8 left-5">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md border-3 border-white`}>
                  {initials}
                </div>
              </div>
            </div>

            <div className="pt-10 pb-5 px-5 sm:px-6">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{studentName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {className || (programLabel[student.program] || student.program || "Program Umum")}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${accentColor}`}>
                  <Sparkles size={10} />
                  Siswa Aktif
                </span>
              </div>

              {student._fromApplicant && (
                <div className="mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Siswa belum mendapat NIS. Data diambil dari formulir pendaftaran. NIS akan ditetapkan setelah masa orientasi.
                  </p>
                </div>
              )}

              {/* 2-Column Fields Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                {fields.map((f) => (
                  <div key={f.label} className="p-2.5 sm:p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-2xs border border-gray-100 shrink-0 text-gray-400">
                      <f.icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider truncate">{f.label}</p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5 line-clamp-2 break-words leading-tight">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medical Info */}
          {(applicant?.allergies_special_needs || applicant?.medical_history || applicant?.emergency_contact_name) && (
            <div className="bg-white rounded-3xl shadow-2xs border border-gray-100 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse size={15} className="text-rose-500" />
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Informasi Medis & Darurat</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {applicant?.allergies_special_needs && applicant.allergies_special_needs !== "Tidak ada" && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-[9.5px] font-bold text-rose-400 uppercase tracking-wider">Alergi / Kebutuhan</p>
                    <p className="text-xs font-semibold text-rose-800 mt-0.5">{applicant.allergies_special_needs}</p>
                  </div>
                )}
                {applicant?.medical_history && applicant.medical_history !== "Tidak ada" && (
                  <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl">
                    <p className="text-[9.5px] font-bold text-orange-400 uppercase tracking-wider">Riwayat Medis</p>
                    <p className="text-xs font-semibold text-orange-800 mt-0.5">{applicant.medical_history}</p>
                  </div>
                )}
                {applicant?.emergency_contact_name && (
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl sm:col-span-2">
                    <p className="text-[9.5px] font-bold text-blue-400 uppercase tracking-wider">Kontak Darurat</p>
                    <p className="text-xs font-semibold text-blue-800 mt-0.5">
                      {applicant.emergency_contact_name}
                      {applicant.emergency_contact_relation ? ` (${applicant.emergency_contact_relation})` : ""}
                      {applicant.emergency_contact_phone ? ` · ${applicant.emergency_contact_phone}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Digital Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-700 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <CreditCard size={15} className="text-blue-500" />
            Kartu Digital Siswa
          </h2>

          {/* Kartu Pelajar */}
          <div className={`relative bg-gradient-to-br ${avatarGradient} rounded-3xl p-5 text-white shadow-md overflow-hidden`}>
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9.5px] font-bold tracking-widest uppercase opacity-80">JACOS Islamic School</p>
                  <p className="font-bold text-base mt-0.5">Kartu Pelajar</p>
                </div>
                <Image
                  src="/publicjacos/logoputih.png"
                  alt="JACOS"
                  width={50}
                  height={30}
                  className="opacity-90 object-contain"
                  style={{ width: "auto", height: "30px" }}
                />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{studentName}</p>
                  <p className="text-white/80 text-[11px] font-medium mt-0.5 truncate">
                    {student.nis ? `NIS: ${student.nis}` : "NIS belum ditetapkan"}
                  </p>
                  <p className="text-white/60 text-[10px] truncate">
                    {className || (programLabel[student.program] || student.program)}
                  </p>
                </div>
                <button 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white hover:text-blue-700 text-white flex items-center justify-center transition-all border border-white/20 shrink-0"
                  aria-label="Download Kartu Pelajar"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Kartu Ujian (Locked) */}
          <div className="relative bg-gray-50 rounded-3xl border border-gray-200 p-5 overflow-hidden">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1 text-gray-400">
                <Lock size={15} />
              </div>
              <p className="font-bold text-gray-700 text-xs">Kartu Ujian Belum Aktif</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Aktif saat periode ujian semester dimulai.
              </p>
            </div>
            <div className="opacity-30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-bold tracking-wider uppercase text-gray-400">Semester 2026/2027</p>
                  <p className="font-bold text-sm text-gray-700">Kartu Ujian</p>
                </div>
                <CreditCard size={18} className="text-gray-300" />
              </div>
              <p className="font-bold text-xs text-gray-700 truncate">{studentName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
