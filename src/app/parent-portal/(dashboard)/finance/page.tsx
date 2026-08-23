"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Receipt, CalendarCheck, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Keuangan & SPP</h1>
          <p className="text-ink-400 mt-1">Pantau dan kelola seluruh tagihan administrasi sekolah.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white border border-ink/10 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('spp')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'spp' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
            }`}
          >
            SPP Bulanan
          </button>
          <button 
            onClick={() => setActiveTab('umum')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'umum' ? 'bg-sky text-white shadow-sm' : 'text-ink-400 hover:text-ink'
            }`}
          >
            Tagihan Umum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'spp' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-ink/10 overflow-hidden">
              <div className="p-6 border-b border-ink/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
                  <CalendarCheck size={20} className="text-gold-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Riwayat SPP Tahun Ajaran 2026/2027</h2>
              </div>
              
              <div className="divide-y divide-ink/5">
                {sppBills.map((bill, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cloud/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-ink text-lg">{bill.month}</h3>
                      {bill.status === 'Lunas' ? (
                        <p className="text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={16} /> Lunas pada {bill.date}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-coral-600 mt-1 flex items-center gap-1">
                          <Clock size={16} /> Menunggu Pembayaran
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-display text-xl font-bold text-ink">
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </p>
                      {bill.status !== 'Lunas' && (
                        <Button className="h-10 bg-sky hover:bg-sky-600 rounded-xl font-bold px-6">
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
              <div className="p-6 border-b border-ink/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Receipt size={20} className="text-sky-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Tagihan Umum & Administrasi</h2>
              </div>
              
              <div className="divide-y divide-ink/5">
                {generalBills.map((bill, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cloud/30 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-bold text-ink">{bill.name}</h3>
                      {bill.status === 'Lunas' ? (
                        <p className="text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={16} /> Lunas
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-coral-600 mt-1 flex items-center gap-1">
                          <Clock size={16} /> Jatuh Tempo: {bill.dueDate}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-display text-xl font-bold text-ink whitespace-nowrap">
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </p>
                      {bill.status !== 'Lunas' && (
                        <Button className="h-10 bg-sky hover:bg-sky-600 rounded-xl font-bold px-6">
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
              <h2 className="font-bold">Total Tagihan Tertunggak</h2>
            </div>
            <p className="font-display text-4xl font-black tracking-tight mb-2">
              Rp 3.700.000
            </p>
            <p className="text-sm opacity-80 font-medium">
              Terdiri dari SPP 1 Bulan & 2 Tagihan Umum
            </p>
            <div className="mt-6 pt-6 border-t border-white/20">
              <Button className="w-full h-12 bg-white text-sky-800 hover:bg-sky-50 rounded-xl font-bold shadow-sm">
                Bayar Semua Tagihan
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/10">
            <h3 className="font-bold text-ink mb-4">Informasi Rekening</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cloud border border-ink/5">
                <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Bank Central Asia (BCA)</p>
                <p className="font-display text-xl font-bold text-ink">8820 123 456</p>
                <p className="text-sm font-semibold text-ink-500 mt-1">Yayasan JACOS Islamic School</p>
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
