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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Tabungan Siswa</h1>
          <p className="text-ink-400 mt-1">Pantau saldo, riwayat transaksi, dan program menabung ananda.</p>
        </div>

        <Button className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2">
          <PlusCircle size={18} />
          Setor Tabungan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Card - Saldo & Goal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[2rem] p-8 text-white shadow-lg">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                    <PiggyBank size={26} className="text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest block">Saldo Terkumpul</span>
                    <span className="text-sm font-semibold text-white/90">Program Tabungan Cilik JACOS</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                  <ShieldCheck size={14} /> Terjamin Aman
                </span>
              </div>

              <div className="my-6">
                <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1">Total Saldo Aktif</p>
                <p className="font-display text-4xl sm:text-5xl font-black tracking-tight">
                  Rp {saldo.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Progress Target */}
              <div className="mt-8 pt-6 border-t border-white/15">
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-100">
                    <Target size={16} /> Target Tabungan Mandiri (Field Trip)
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-300 to-teal-200 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-200 mt-2 font-medium">
                  <span>Terkumpul: Rp {saldo.toLocaleString('id-ID')}</span>
                  <span>Target: Rp {targetTabungan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-ink/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-ink/5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Mutasi Tabungan</h2>
                <p className="text-xs text-ink-400 font-medium mt-0.5">Catatan seluruh setoran dan penarikan</p>
              </div>

              {/* Filters */}
              <div className="flex p-1 bg-cloud rounded-xl">
                <button
                  onClick={() => setFilter('semua')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'semua' ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilter('masuk')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'masuk' ? 'bg-white text-emerald-600 shadow-sm' : 'text-ink-400 hover:text-ink'}`}
                >
                  Setoran
                </button>
                <button
                  onClick={() => setFilter('keluar')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'keluar' ? 'bg-white text-coral shadow-sm' : 'text-ink-400 hover:text-ink'}`}
                >
                  Penarikan
                </button>
              </div>
            </div>

            <div className="divide-y divide-ink/5">
              {filteredRiwayat.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 hover:bg-cloud/30 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-coral-50 text-coral'
                    }`}>
                      {item.type === 'in' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">{item.title}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{item.date} • {item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold text-base ${
                      item.type === 'in' ? 'text-emerald-600' : 'text-coral'
                    }`}>
                      {item.type === 'in' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">
                      {item.type === 'in' ? 'Berhasil' : 'Selesai'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-ink/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
                <Sparkles size={20} className="text-gold-600" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">Manfaat Menabung</h3>
                <p className="text-xs text-ink-400">Pendidikan Finansial Sejak Dini</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-ink-500">
              JACOS Islamic School mendidik siswa untuk gemar berhemat dan mengelola uang saku melalui pembukuan tabungan yang transparan dan dapat dipantau orang tua kapan saja.
            </p>
          </div>

          <div className="bg-cloud/70 rounded-[2rem] p-6 border border-ink/5">
            <h3 className="font-bold text-ink text-sm mb-3">Informasi Rekening Tabungan</h3>
            <div className="space-y-2 text-xs text-ink-600">
              <div className="flex justify-between py-1 border-b border-ink/5">
                <span className="text-ink-400">Nomor Rekening Virtual:</span>
                <span className="font-bold text-ink">9880 7712 3456</span>
              </div>
              <div className="flex justify-between py-1 border-b border-ink/5">
                <span className="text-ink-400">Nama Rekening:</span>
                <span className="font-bold text-ink">JACOS Tabungan Siswa</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-400">Bank Penampung:</span>
                <span className="font-bold text-ink">BSI (Bank Syariah Indonesia)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
