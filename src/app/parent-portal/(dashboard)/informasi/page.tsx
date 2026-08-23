"use client";

import { Megaphone, BellRing, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InformasiPage() {
  // Mock Data
  const announcements = [
    {
      id: 1,
      type: 'sekolah',
      title: 'Pemberitahuan Libur Nasional Hari Kemerdekaan',
      date: '16 Agu 2026',
      content: 'Diberitahukan kepada seluruh orang tua siswa, sehubungan dengan peringatan Hari Kemerdekaan Republik Indonesia, kegiatan belajar mengajar pada tanggal 17 Agustus 2026 ditiadakan. Siswa diwajibkan mengikuti upacara bendera secara daring dari rumah masing-masing.',
      isUrgent: true,
    },
    {
      id: 2,
      type: 'kelas',
      title: 'Persiapan Field Trip Kelas 1',
      date: '14 Agu 2026',
      content: 'Kepada Yth. Orang tua siswa kelas 1, Field Trip akan dilaksanakan pada hari Rabu, 19 Agustus 2026. Mohon pastikan Ananda membawa bekal yang cukup, memakai seragam olahraga, dan datang tepat waktu pukul 07:00 WIB.',
      location: 'Taman Safari Indonesia',
      time: 'Rabu, 07:00 - 15:00',
      isUrgent: false,
    },
    {
      id: 3,
      type: 'sekolah',
      title: 'Jadwal Pengambilan Buku Paket Semester Ganjil',
      date: '10 Agu 2026',
      content: 'Pengambilan buku paket dapat dilakukan di perpustakaan sekolah mulai Senin depan. Silakan membawa bukti pembayaran administrasi untuk ditukarkan dengan paket buku.',
      isUrgent: false,
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Informasi & Kegiatan</h1>
        <p className="text-ink-400 mt-1">Dapatkan informasi terbaru seputar kegiatan sekolah dan pengumuman kelas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {announcements.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-ink/5 hover:shadow-md transition-shadow relative overflow-hidden group">
              {item.isUrgent && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-coral-100 to-transparent rounded-bl-full pointer-events-none opacity-50" />
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'sekolah' 
                      ? (item.isUrgent ? 'bg-coral-50 text-coral-600' : 'bg-sky-50 text-sky-600') 
                      : 'bg-gold-50 text-gold-600'
                  }`}>
                    {item.isUrgent ? <BellRing size={24} className="animate-pulse" /> : <Megaphone size={24} />}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">{item.title}</h2>
                    <span className="text-xs font-semibold text-ink-400">{item.date}</span>
                  </div>
                </div>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  item.type === 'sekolah' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-gold-50 text-gold-700 border-gold-100'
                }`}>
                  {item.type === 'sekolah' ? 'Umum / Sekolah' : 'Khusus Kelas'}
                </span>
              </div>
              
              <div className="relative z-10 mt-6">
                <p className="text-ink-600 text-sm leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
                
                {(item.time || item.location) && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-4 p-4 bg-cloud/50 rounded-2xl border border-ink/5">
                    {item.time && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink-600">
                        <Calendar size={16} className="text-sky" /> {item.time}
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink-600">
                        <MapPin size={16} className="text-coral" /> {item.location}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Sidebar Mini - Kalender Akademik */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
            <h2 className="font-display text-lg font-bold text-ink mb-6">Agenda Terdekat</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-coral-50 rounded-xl text-coral shrink-0 border border-coral-100">
                  <span className="text-xs font-bold uppercase">Agu</span>
                  <span className="text-lg font-black font-display leading-none">17</span>
                </div>
                <div>
                  <h3 className="font-bold text-ink text-sm">Libur Kemerdekaan RI</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Seluruh jenjang</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-sky-50 rounded-xl text-sky shrink-0 border border-sky-100">
                  <span className="text-xs font-bold uppercase">Agu</span>
                  <span className="text-lg font-black font-display leading-none">19</span>
                </div>
                <div>
                  <h3 className="font-bold text-ink text-sm">Field Trip Kelas 1</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Taman Safari Indonesia</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-leaf-50 rounded-xl text-leaf shrink-0 border border-leaf-100">
                  <span className="text-xs font-bold uppercase">Sep</span>
                  <span className="text-lg font-black font-display leading-none">05</span>
                </div>
                <div>
                  <h3 className="font-bold text-ink text-sm">Ujian Tengah Semester</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Persiapan UTS Ganjil</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-6 rounded-xl border-ink/10 font-bold text-ink-500 hover:text-ink">
              Lihat Kalender Penuh <ExternalLink size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
