"use client";

import { useState } from 'react';
import { CalendarDays, ClipboardCheck, BookOpen, Clock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClassroomPage() {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'absensi' | 'penilaian'>('jadwal');
  const [selectedDay, setSelectedDay] = useState<string>('Senin');

  // Mock Data
  const schedule = [
    { day: 'Senin', subjects: [{ time: '08:00 - 09:30', name: 'Matematika', teacher: 'Ust. Ahmad' }, { time: '09:45 - 11:15', name: 'Bahasa Indonesia', teacher: 'Ms. Sarah' }] },
    { day: 'Selasa', subjects: [{ time: '08:00 - 09:30', name: 'Pendidikan Agama Islam', teacher: 'Ust. Budi' }, { time: '09:45 - 11:15', name: 'IPA', teacher: 'Mr. Dedi' }] },
    { day: 'Rabu', subjects: [{ time: '08:00 - 10:00', name: 'Pendidikan Jasmani', teacher: 'Mr. Anton' }] },
  ];

  const attendance = [
    { date: '24 Agu 2026', status: 'Hadir', note: 'Tepat Waktu' },
    { date: '23 Agu 2026', status: 'Hadir', note: 'Tepat Waktu' },
    { date: '22 Agu 2026', status: 'Izin', note: 'Acara Keluarga' },
    { date: '21 Agu 2026', status: 'Hadir', note: 'Terlambat 10 menit' },
  ];

  const grades = [
    { subject: 'Matematika', score: 92, note: 'Sangat baik dalam pemahaman konsep pecahan.' },
    { subject: 'Bahasa Indonesia', score: 88, note: 'Mampu menulis karangan deskripsi dengan baik.' },
    { subject: 'Pendidikan Agama Islam', score: 95, note: 'Hafalan surah pendek sangat lancar, pertahankan!' },
  ];

  const activeDaySchedule = schedule.find(s => s.day === selectedDay) || schedule[0];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink">Classroom</h1>
          <p className="text-ink-400 text-xs sm:text-sm mt-0.5">Pantau jadwal, absensi, dan perkembangan akademik siswa.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white border border-ink/10 rounded-2xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('jadwal')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'jadwal' ? 'bg-sky text-white shadow-2xs' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Jadwal
          </button>
          <button 
            onClick={() => setActiveTab('absensi')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'absensi' ? 'bg-sky text-white shadow-2xs' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Absensi
          </button>
          <button 
            onClick={() => setActiveTab('penilaian')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'penilaian' ? 'bg-sky text-white shadow-2xs' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Penilaian
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xs border border-ink/5 p-4 sm:p-6 lg:p-8">
        
        {/* Jadwal Tab */}
        {activeTab === 'jadwal' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600 shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-ink">Jadwal Pelajaran</h2>
                  <p className="text-[11px] font-medium text-ink-400">Semester Ganjil 2026/2027</p>
                </div>
              </div>

              {/* Day selector on Mobile */}
              <div className="flex p-1 bg-cloud rounded-xl gap-1 w-full sm:w-auto">
                {schedule.map((s) => (
                  <button
                    key={s.day}
                    onClick={() => setSelectedDay(s.day)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedDay === s.day 
                        ? 'bg-white text-ink shadow-2xs' 
                        : 'text-ink-400 hover:text-ink'
                    }`}
                  >
                    {s.day}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Day Subject Cards */}
            <div className="space-y-3">
              {activeDaySchedule.subjects.map((subj, sIdx) => (
                <div key={sIdx} className="bg-cloud/40 hover:bg-sky-50/40 p-4 rounded-2xl border border-ink/5 hover:border-sky/20 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-100/70 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {sIdx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                        <Clock size={12} /> {subj.time}
                      </p>
                      <h4 className="font-bold text-sm text-ink truncate mt-0.5">{subj.name}</h4>
                      <p className="text-xs text-ink-400">{subj.teacher}</p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-semibold text-leaf bg-leaf-50 border border-leaf-100 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                    Tatap Muka
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Absensi Tab */}
        {activeTab === 'absensi' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-ink">Rekap Absensi Siswa</h2>
                  <p className="text-[11px] font-medium text-ink-400">Bulan Berjalan: Agustus 2026</p>
                </div>
              </div>
              <span className="text-xs font-bold text-leaf bg-leaf-50 border border-leaf-100 px-3 py-1 rounded-full self-start sm:self-auto">
                Kehadiran: 98%
              </span>
            </div>

            {/* Mobile Cards / Desktop Table */}
            <div className="space-y-2.5">
              {attendance.map((record, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 rounded-2xl bg-cloud/30 border border-ink/5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-ink">{record.date}</p>
                    <p className="text-[11px] text-ink-400 mt-0.5">{record.note}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                    record.status === 'Hadir' ? 'bg-leaf-50 text-leaf-600 border-leaf-100' :
                    record.status === 'Izin' ? 'bg-gold-50 text-gold-600 border-gold-100' :
                    'bg-coral-50 text-coral-600 border-coral-100'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Penilaian Tab */}
        {activeTab === 'penilaian' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-ink/5">
              <div className="w-9 h-9 rounded-xl bg-leaf-50 flex items-center justify-center text-leaf-600 shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-ink">Catatan Perkembangan Guru</h2>
                <p className="text-[11px] font-medium text-ink-400">Penilaian formatif & perkembangan karakter</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {grades.map((grade, idx) => (
                <div key={idx} className="bg-cloud/30 rounded-2xl p-4 border border-ink/5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-ink truncate">{grade.subject}</h3>
                    <span className="w-8 h-8 rounded-xl bg-sky text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {grade.score}
                    </span>
                  </div>
                  
                  <div className="p-2.5 bg-white rounded-xl border border-ink/5">
                    <p className="text-[10px] font-bold text-ink-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle size={11} /> Catatan Guru
                    </p>
                    <p className="text-xs text-ink-600 leading-relaxed line-clamp-3">
                      "{grade.note}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
