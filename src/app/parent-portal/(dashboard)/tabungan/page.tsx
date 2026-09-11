"use client";

import { useState } from 'react';
import { PiggyBank, ArrowDownLeft, ArrowUpRight, PlusCircle, Target, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TabunganSiswaPage() {
  const [filter, setFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  // Mock data for Tabungan
  const saldo = 1450000;
  const targetTabungan = 2000000;
  const progressPercent = Math.min(100, Math.round((saldo / targetTabungan) * 100));

  const riwayat = [
    { id: 1, type: 'in', title: 'Setoran Rutin Mingguan', date: '22 Agu 2026', amount: 50000, desc: 'Via Wali Kelas' },
    { id: 2, type: 'in', title: 'Setoran Tambahan', date: '15 Agu 2026', amount: 200000, desc: 'Transfer Bank BCA' },
    { id: 3, type: 'out', title: 'Penarikan Pembelian Buku Tabarruk', date: '10 Agu 2026', amount: 75000, desc: 'Koperasi Sekolah' },
    { id: 4, type: 'in', title: 'Setoran Awal Tahun Ajaran', date: '01 Agu 2026', amount: 500000, desc: 'Pendaftaran Ulang' },
  ];

  const filteredRiwayat = riwayat.filter(item => {
    if (filter === 'masuk') return item.type === 'in';
    if (filter === 'keluar') return item.type === 'out';
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink">Tabungan Siswa</h1>
          <p className="text-ink-400 text-xs sm:text-sm mt-0.5">Pantau saldo, mutasi berkala, dan target tabungan mandiri ananda.</p>
        </div>

        <Button className="h-10 sm:h-11 px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-1.5 self-start sm:self-auto">
          <PlusCircle size={16} />
          Setor Tabungan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Main Card - Saldo & Goal */}
        <div className="lg:col-span-2 space-y-5">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-7 text-white shadow-md">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                    <PiggyBank size={22} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-emerald-200 uppercase tracking-widest block">Saldo Terkumpul</span>
                    <span className="text-xs sm:text-sm font-semibold text-white/90">Program Tabungan JACOS</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
                  <ShieldCheck size={13} /> Aman
                </span>
              </div>

              <div className="my-4">
                <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider mb-0.5">Total Saldo Aktif</p>
                <p className="font-display text-3xl sm:text-4xl font-black tracking-tight">
                  Rp {saldo.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Progress Target */}
              <div className="mt-5 pt-4 border-t border-white/15">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-1.5">
                  <span className="flex items-center gap-1 text-emerald-100 truncate">
                    <Target size={14} className="shrink-0" /> Target Tabungan (Field Trip)
                  </span>
                  <span className="shrink-0">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-300 to-teal-200 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10.5px] text-emerald-200 mt-1.5 font-medium">
                  <span>Terkumpul: Rp {saldo.toLocaleString('id-ID')}</span>
                  <span>Target: Rp {targetTabungan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mutasi Transaksi */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xs border border-ink/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-ink/5">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-ink">Mutasi Tabungan</h2>
                <p className="text-[11px] text-ink-400 font-medium">Catatan setoran & penarikan</p>
              </div>

              {/* Filter Pills */}
              <div className="flex p-1 bg-cloud rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setFilter('semua')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'semua' ? 'bg-white text-ink shadow-2xs' : 'text-ink-400 hover:text-ink'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilter('masuk')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'masuk' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-ink-400 hover:text-ink'}`}
                >
                  Setoran
                </button>
                <button
                  onClick={() => setFilter('keluar')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'keluar' ? 'bg-white text-coral shadow-2xs' : 'text-ink-400 hover:text-ink'}`}
                >
                  Penarikan
                </button>
              </div>
            </div>

            <div className="divide-y divide-ink/5">
              {filteredRiwayat.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 hover:bg-cloud/30 rounded-xl px-1.5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-coral-50 text-coral'
                    }`}>
                      {item.type === 'in' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-ink text-xs sm:text-sm truncate">{item.title}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5 truncate">{item.date} • {item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-display font-bold text-xs sm:text-sm ${
                      item.type === 'in' ? 'text-emerald-600' : 'text-coral'
                    }`}>
                      {item.type === 'in' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[9.5px] font-bold text-ink-300 uppercase tracking-wider block">
                      {item.type === 'in' ? 'Berhasil' : 'Selesai'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-ink/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-ink text-sm">Edukasi Finansial</h3>
                <p className="text-[11px] text-ink-400">Pembiasaan Menabung Sejak Dini</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-ink-500">
              JACOS mendidik siswa untuk gemar berhemat dan mengelola uang saku melalui pembukuan tabungan yang transparan dan dapat dipantau orang tua secara real-time.
            </p>
          </div>

          <div className="bg-cloud/70 rounded-3xl p-5 border border-ink/5">
            <h3 className="font-bold text-ink text-xs uppercase tracking-wider mb-2.5">Rekening Virtual Tabungan</h3>
            <div className="space-y-2 text-xs text-ink-600">
              <div className="flex justify-between py-1 border-b border-ink/5">
                <span className="text-ink-400">Virtual Account:</span>
                <span className="font-bold text-ink">9880 7712 3456</span>
              </div>
              <div className="flex justify-between py-1 border-b border-ink/5">
                <span className="text-ink-400">Atas Nama:</span>
                <span className="font-bold text-ink">JACOS Tabungan Siswa</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-400">Bank Penampung:</span>
                <span className="font-bold text-ink">BSI (Syariah)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
