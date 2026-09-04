"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createParentClient } from '@/lib/supabase/client';
import { User, CreditCard, Lock, Download } from 'lucide-react';
import Image from 'next/image';

export default function ProfilSiswaPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  const supabase = createParentClient();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const studentId = session?.user?.user_metadata?.student_id;
        const parentFullName = session?.user?.user_metadata?.full_name;
        
        let loadedStudent = null;

        if (studentId) {
          const { data: studentData, error } = await supabase
            .from('students')
            .select('id, full_name, nis, nisn, gender, birth_date, birth_place, program, school_classes(name, grade)')
            .eq('id', studentId)
            .maybeSingle();
            
          if (!error && studentData) {
            loadedStudent = studentData;
          }
        }

        // If not found in metadata, check guardians by email
        if (!loadedStudent && session?.user?.email) {
          const { data: guardians } = await supabase
            .from('guardians')
            .select('applicant_id, applicants(student_record_id)')
            .ilike('email', session.user.email)
            .limit(1);

          const studentRecordId = (guardians?.[0] as any)?.applicants?.student_record_id;
          if (studentRecordId) {
            const { data: studentData } = await supabase
              .from('students')
              .select('id, full_name, nis, nisn, gender, birth_date, birth_place, program, school_classes(name, grade)')
              .eq('id', studentRecordId)
              .maybeSingle();

            if (studentData) loadedStudent = studentData;
          }
        }

        // Fallback to first active student if still null (for demo)
        if (!loadedStudent) {
          const { data: firstStudent } = await supabase
            .from('students')
            .select('id, full_name, nis, nisn, gender, birth_date, birth_place, program, school_classes(name, grade)')
            .eq('is_active', true)
            .order('full_name', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstStudent) {
            loadedStudent = firstStudent;
          }
        }

        setStudent(loadedStudent);
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-ink/10 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-72 bg-ink/5 rounded-[2rem]"></div>
          <div className="h-72 bg-ink/5 rounded-[2rem]"></div>
        </div>
      </div>
    );
  }

  const studentName = student?.full_name || 'Siswa JACOS';
  const initials = studentName ? studentName.substring(0, 2).toUpperCase() : 'SW';
  const className = Array.isArray(student?.school_classes) 
    ? student?.school_classes[0]?.name 
    : student?.school_classes?.name || student?.class_name || 'Kelas Belum Ditentukan';
  const formattedBirthDate = student?.birth_date 
    ? new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Profil Siswa</h1>
        <p className="text-ink-400 mt-1">Data akademik dan kartu identitas digital siswa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profil Siswa Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-ink/5">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-ink/5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-leaf-400 to-leaf-600 flex items-center justify-center text-white shadow-sm font-display font-bold text-xl">
              {initials}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{studentName}</h2>
              <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-md bg-leaf-50 text-leaf-700 font-semibold text-xs border border-leaf-100">
                Siswa Aktif
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider mb-1">NIS / NISN</p>
              <p className="text-sm font-semibold text-ink">{student?.nis || '-'} / {student?.nisn || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider mb-1">Kelas & Program</p>
              <p className="text-sm font-semibold text-ink">
                {className} • {student?.program || 'Umum'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider mb-1">Tempat, Tanggal Lahir</p>
              <p className="text-sm font-semibold text-ink">
                {student?.birth_place ? `${student.birth_place}, ` : ''}{formattedBirthDate}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider mb-1">Jenis Kelamin</p>
              <p className="text-sm font-semibold text-ink">
                {student?.gender === 'MALE' ? 'Laki-laki' : student?.gender === 'FEMALE' ? 'Perempuan' : student?.gender || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Kartu Digital */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <CreditCard size={20} className="text-sky" /> Kartu Digital
          </h2>
          
          {/* Kartu Pelajar */}
          <div className="group relative bg-gradient-to-br from-sky-500 to-sky-700 rounded-[2rem] p-6 text-white shadow-md overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-sky-100 tracking-widest uppercase mb-1">JACOS Islamic School</p>
                <p className="font-display text-lg font-bold">Kartu Pelajar</p>
              </div>
              <Image src="/publicjacos/logoputih.png" alt="Logo" width={80} height={24} className="opacity-80 object-contain" />
            </div>
            <div className="relative z-10 flex items-end justify-between mt-8">
              <div>
                <p className="font-bold text-lg">{studentName}</p>
                <p className="text-sky-100 text-sm font-medium">{student?.nis ? `NIS: ${student.nis}` : 'NIS Belum Tersedia'}</p>
              </div>
              <Button size="icon" variant="secondary" className="rounded-full w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-sky-700 border-none backdrop-blur-sm transition-all">
                <Download size={18} />
              </Button>
            </div>
          </div>

          {/* Kartu Ujian (Locked) */}
          <div className="relative bg-cloud rounded-[2rem] p-6 border border-ink/10 overflow-hidden">
            {/* Locked Overlay */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mb-3">
                <Lock size={20} className="text-ink-400" />
              </div>
              <p className="font-bold text-ink text-sm">Kartu Ujian Belum Tersedia</p>
              <p className="text-xs text-ink-400 mt-1 max-w-[250px]">Kegiatan ujian belum aktif atau terdapat administrasi yang perlu diselesaikan.</p>
            </div>
            
            <div className="opacity-40">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-ink-400 tracking-widest uppercase mb-1">Semester Ganjil 2026</p>
                  <p className="font-display text-lg font-bold text-ink">Kartu Ujian</p>
                </div>
                <CreditCard size={24} className="text-ink-300" />
              </div>
              <div className="mt-8">
                <p className="font-bold text-lg text-ink">{studentName}</p>
                <div className="h-2 w-32 bg-ink/10 rounded-full mt-2" />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
