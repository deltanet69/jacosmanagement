"use client";

import { useState } from 'react';
import { CalendarDays, ClipboardCheck, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClassroomPage() {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'absensi' | 'penilaian'>('jadwal');

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Classroom</h1>
          <p className="text-ink-400 mt-1">Pantau jadwal, absensi, dan perkembangan akademik siswa di kelas.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white border border-ink/10 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('jadwal')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === 'jadwal' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Jadwal Pelajaran
          </button>
          <button 
            onClick={() => setActiveTab('absensi')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === 'absensi' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Rekap Absensi
          </button>
          <button 
            onClick={() => setActiveTab('penilaian')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === 'penilaian' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Penilaian Guru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-ink/5 p-6 lg:p-10">
        
        {/* Jadwal Tab */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center">
                <CalendarDays size={24} className="text-gold-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Jadwal Kelas</h2>
                <p className="text-sm font-medium text-ink-400">Semester Ganjil 2026/2027</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedule.map((day, idx) => (
                <div key={idx} className="bg-cloud/50 rounded-3xl p-6 border border-ink/5">
                  <h3 className="font-bold text-lg text-ink mb-4">{day.day}</h3>
                  <div className="space-y-4">
                    {day.subjects.map((subj, sIdx) => (
                      <div key={sIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                        <p className="text-xs font-bold text-sky-600 mb-1 flex items-center gap-1.5">
                          <Clock size={12} /> {subj.time}
                        </p>
                        <p className="font-bold text-ink">{subj.name}</p>
                        <p className="text-xs font-medium text-ink-400 mt-1">{subj.teacher}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Absensi Tab */}
        {activeTab === 'absensi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                  <ClipboardCheck size={24} className="text-sky-600" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Rekap Absensi</h2>
                  <p className="text-sm font-medium text-ink-400">Agustus 2026</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl border-ink/10 font-bold">Bulan Ini</Button>
                <Button variant="outline" className="rounded-xl border-ink/10 font-bold">Semester Ini</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink/5 text-xs font-bold text-ink-300 uppercase tracking-wider">
                    <th className="pb-4 px-4">Tanggal</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {attendance.map((record, idx) => (
                    <tr key={idx} className="hover:bg-cloud/30 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-ink">{record.date}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          record.status === 'Hadir' ? 'bg-leaf-50 text-leaf-600 border-leaf-100' :
                          record.status === 'Izin' ? 'bg-gold-50 text-gold-600 border-gold-100' :
                          'bg-coral-50 text-coral-600 border-coral-100'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-ink-400">{record.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Penilaian Tab */}
        {activeTab === 'penilaian' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-leaf-50 flex items-center justify-center">
                <BookOpen size={24} className="text-leaf-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Catatan & Penilaian Guru</h2>
                <p className="text-sm font-medium text-ink-400">Penilaian formatif dan catatan perkembangan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grades.map((grade, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 border border-ink/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-50 to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:scale-110 transition-transform" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="font-bold text-lg text-ink leading-tight pr-4">{grade.subject}</h3>
                    <div className="w-12 h-12 shrink-0 rounded-full bg-sky-100 flex items-center justify-center font-display font-bold text-sky-700 text-xl border-2 border-white shadow-sm">
                      {grade.score}
                    </div>
                  </div>
                  
                  <div className="bg-cloud p-4 rounded-2xl relative z-10">
                    <p className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Catatan Guru
                    </p>
                    <p className="text-sm font-medium text-ink-600 leading-relaxed">
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
