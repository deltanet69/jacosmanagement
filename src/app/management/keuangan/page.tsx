"use client";

import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_INVOICES = [
  { id: "INV-26-001", student: "Ahmad Rayyan", class: "1A", type: "SPP Agustus 2026", amount: "Rp 1.500.000", status: "LUNAS", date: "05 Aug 2026" },
  { id: "INV-26-002", student: "Nayla Putri", class: "1B", type: "SPP Agustus 2026", amount: "Rp 1.500.000", status: "BELUM LUNAS", date: "-" },
  { id: "INV-26-003", student: "Rizky Firmansyah", class: "1A", type: "Uang Pangkal", amount: "Rp 15.000.000", status: "CICILAN", date: "10 Aug 2026" },
];

export default function KeuanganPage() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink">Keuangan & SPP Sekolah</h1>
          <p className="text-ink-400 text-xs sm:text-sm mt-0.5">Manajemen tagihan dan pembayaran siswa.</p>
        </div>
        <Button className="flex items-center justify-center gap-1.5 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-sm text-xs sm:text-sm h-10 sm:h-11 px-4 cursor-pointer w-full sm:w-auto">
          <Plus size={16} /> Buat Tagihan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-ink/5">
          <p className="text-xs font-bold text-ink-300 mb-1 uppercase tracking-wider">Total Tagihan (Bulan Ini)</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-ink">Rp 245.0M</p>
        </div>
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-ink/5 border-l-4 border-l-leaf">
          <p className="text-xs font-bold text-ink-300 mb-1 uppercase tracking-wider">Sudah Dibayar</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-leaf">Rp 120.5M</p>
        </div>
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-ink/5 border-l-4 border-l-coral">
          <p className="text-xs font-bold text-ink-300 mb-1 uppercase tracking-wider">Belum Dibayar</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-coral">Rp 124.5M</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-ink/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input placeholder="Cari Siswa atau No. Tagihan..." className="pl-10 h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-cloud border-transparent text-xs sm:text-sm" />
          </div>
          <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border-ink/10 font-bold text-ink-400 text-xs sm:text-sm h-10 sm:h-11 px-4 cursor-pointer">
            <Filter size={15} /> Filter Status
          </Button>
        </div>

        {/* MOBILE CARD VIEW (md:hidden) */}
        <div className="space-y-2.5 md:hidden">
          {MOCK_INVOICES.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 rounded-2xl bg-cloud/30 border border-ink/5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-sky">{inv.id}</span>
                  <p className="font-bold text-sm text-ink truncate">{inv.student}</p>
                  <p className="text-xs text-ink-400">Kelas {inv.class} • {inv.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-black text-sm text-ink">{inv.amount}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === 'LUNAS' ? 'bg-leaf-50 text-leaf-600' : 
                    inv.status === 'BELUM LUNAS' ? 'bg-coral-50 text-coral-600' : 'bg-gold-50 text-gold-600'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
              {inv.date !== "-" && (
                <div className="pt-1 border-t border-ink/5 flex justify-between text-[11px] text-ink-300 font-medium">
                  <span>Tanggal Bayar:</span>
                  <span>{inv.date}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ink-300 uppercase bg-cloud rounded-xl">
              <tr>
                <th className="px-5 py-3.5 font-bold rounded-l-xl">No. Tagihan</th>
                <th className="px-5 py-3.5 font-bold">Nama Siswa</th>
                <th className="px-5 py-3.5 font-bold">Jenis Tagihan</th>
                <th className="px-5 py-3.5 font-bold">Total</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold rounded-r-xl text-right">Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-ink/5 hover:bg-cloud/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-sky">{inv.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold">{inv.student}</p>
                    <p className="text-xs text-ink-400">Kelas {inv.class}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-400">{inv.type}</td>
                  <td className="px-5 py-3.5 font-bold">{inv.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      inv.status === 'LUNAS' ? 'bg-leaf-50 text-leaf-600' : 
                      inv.status === 'BELUM LUNAS' ? 'bg-coral-50 text-coral-600' : 'bg-gold-50 text-gold-600'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-ink-400">{inv.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
