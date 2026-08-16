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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Keuangan & SPP Sekolah</h1>
          <p className="text-ink-400 text-sm mt-1">Manajemen tagihan dan pembayaran siswa.</p>
        </div>
        <Button className="flex items-center gap-2 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm">
          <Plus size={18} /> Buat Tagihan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5">
          <p className="text-sm font-bold text-ink-300 mb-1">Total Tagihan (Bulan Ini)</p>
          <p className="font-display text-3xl">Rp 245.0M</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5 border-l-4 border-l-leaf">
          <p className="text-sm font-bold text-ink-300 mb-1">Sudah Dibayar</p>
          <p className="font-display text-3xl text-leaf">Rp 120.5M</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5 border-l-4 border-l-coral">
          <p className="text-sm font-bold text-ink-300 mb-1">Belum Dibayar</p>
          <p className="font-display text-3xl text-coral">Rp 124.5M</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input placeholder="Cari Siswa atau No. Tagihan..." className="pl-10 h-10 rounded-xl bg-cloud border-transparent" />
          </div>
          <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 rounded-xl border-ink/10 font-bold text-ink-400">
            <Filter size={16} /> Filter Status
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ink-300 uppercase bg-cloud rounded-xl">
              <tr>
                <th className="px-6 py-4 font-bold rounded-l-xl">No. Tagihan</th>
                <th className="px-6 py-4 font-bold">Nama Siswa</th>
                <th className="px-6 py-4 font-bold">Jenis Tagihan</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold rounded-r-xl text-right">Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-ink/5 hover:bg-cloud/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-sky">{inv.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold">{inv.student}</p>
                    <p className="text-xs text-ink-400">Kelas {inv.class}</p>
                  </td>
                  <td className="px-6 py-4 text-ink-400">{inv.type}</td>
                  <td className="px-6 py-4 font-bold">{inv.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      inv.status === 'LUNAS' ? 'bg-leaf-50 text-leaf-600' : 
                      inv.status === 'BELUM LUNAS' ? 'bg-coral-50 text-coral-600' : 'bg-gold-50 text-gold-600'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-ink-400">{inv.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
