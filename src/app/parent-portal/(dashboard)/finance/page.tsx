"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Receipt, 
  CalendarCheck, 
  CheckCircle2, 
  Clock, 
  PiggyBank, 
  ArrowRight,
  ChevronRight,
  CreditCard
} from 'lucide-react';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'spp' | 'umum'>('spp');

  // Mock Data
  const sppBills = [
    { month: 'Juli 2026', amount: 850000, status: 'Lunas', date: '05 Jul 2026' },
    { month: 'Agustus 2026', amount: 850000, status: 'Lunas', date: '02 Agu 2026' },
    { month: 'September 2026', amount: 850000, status: 'Belum Lunas', date: null },
    { month: 'Oktober 2026', amount: 850000, status: 'Belum Lunas', date: null },
  ];

  const generalBills = [
    { name: 'Sisa Uang Gedung / Pendaftaran', amount: 2500000, status: 'Belum Lunas', dueDate: '30 Sep 2026' },
    { name: 'Seragam Sekolah & Buku Paket', amount: 1200000, status: 'Lunas', dueDate: '15 Jul 2026' },
    { name: 'Kegiatan Field Trip Semester 1', amount: 350000, status: 'Belum Lunas', dueDate: '10 Okt 2026' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Keuangan & SPP</h1>
          <p className="text-ink-400 text-xs sm:text-sm mt-1">Pantau dan kelola seluruh tagihan administrasi sekolah.</p>
        </div>
        
        {/* Navigation Tabs & Tabungan Shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-white border border-ink/10 rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('spp')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'spp' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
              }`}
            >
              SPP Bulanan
            </button>
            <button 
              onClick={() => setActiveTab('umum')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'umum' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
              }`}
            >
              Tagihan Umum
            </button>
          </div>

          {/* Quick link to Tabungan Siswa */}
          <Link href="/parent-portal/tabungan" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm border border-emerald-200/60 transition shadow-2xs">
              <PiggyBank size={16} />
              <span>Tabungan Siswa</span>
              <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'spp' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-ink/10 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-ink/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                  <CalendarCheck size={20} className="text-gold-600" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Riwayat SPP Tahun Ajaran 2026/2027</h2>
              </div>
              
              <div className="divide-y divide-ink/5">
                {sppBills.map((bill, idx) => (
                  <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cloud/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-ink text-base sm:text-lg">{bill.month}</h3>
                      {bill.status === 'Lunas' ? (
                        <p className="text-xs sm:text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={15} /> Lunas pada {bill.date}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-coral-600 mt-1 flex items-center gap-1">
                          <Clock size={15} /> Menunggu Pembayaran
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <p className="font-display text-lg sm:text-xl font-bold text-ink">
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </p>
                      {bill.status !== 'Lunas' && (
                        <Button className="h-10 bg-sky hover:bg-sky-600 rounded-xl font-bold px-5 text-xs sm:text-sm">
                          Bayar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-ink/10 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-ink/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <Receipt size={20} className="text-sky-600" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Tagihan Umum & Administrasi</h2>
              </div>
              
              <div className="divide-y divide-ink/5">
                {generalBills.map((bill, idx) => (
                  <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cloud/30 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-bold text-ink text-base">{bill.name}</h3>
                      {bill.status === 'Lunas' ? (
                        <p className="text-xs sm:text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={15} /> Lunas
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-coral-600 mt-1 flex items-center gap-1">
                          <Clock size={15} /> Jatuh Tempo: {bill.dueDate}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <p className="font-display text-lg sm:text-xl font-bold text-ink whitespace-nowrap">
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </p>
                      {bill.status !== 'Lunas' && (
                        <Button className="h-10 bg-sky hover:bg-sky-600 rounded-xl font-bold px-5 text-xs sm:text-sm">
                          Bayar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-6 rounded-3xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-4 opacity-90">
              <Wallet size={24} />
              <h2 className="font-bold text-sm sm:text-base">Total Tagihan Tertunggak</h2>
            </div>
            <p className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-2">
              Rp 3.700.000
            </p>
            <p className="text-xs sm:text-sm opacity-80 font-medium">
              Terdiri dari SPP 1 Bulan & 2 Tagihan Umum
            </p>
            <div className="mt-6 pt-6 border-t border-white/20">
              <Button className="w-full h-11 sm:h-12 bg-white text-sky-800 hover:bg-sky-50 rounded-xl font-bold shadow-sm text-xs sm:text-sm">
                Bayar Semua Tagihan
              </Button>
            </div>
          </div>

          {/* Quick Card for Tabungan Siswa */}
          <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-200/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PiggyBank size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">Tabungan Siswa</h4>
                <p className="text-xs text-ink-400">Pantau saldo & setor berkala</p>
              </div>
            </div>
            <Link href="/parent-portal/tabungan">
              <Button size="sm" variant="outline" className="rounded-xl border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 text-xs font-bold">
                Buka <ArrowRight size={13} className="ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/10">
            <h3 className="font-bold text-ink text-sm sm:text-base mb-4">Informasi Rekening</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cloud border border-ink/5">
                <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Bank Central Asia (BCA)</p>
                <p className="font-display text-lg sm:text-xl font-bold text-ink">8820 123 456</p>
                <p className="text-xs font-semibold text-ink-500 mt-1">Yayasan JACOS Islamic School</p>
              </div>
              <p className="text-xs text-ink-400 text-center">
                Pembayaran otomatis terverifikasi jika menggunakan metode Virtual Account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
