"use client";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_TEACHERS = [
  { id: "T001", name: "Ust. Ahmad Syarif", nip: "19800101", role: "Wali Kelas 1A", phone: "08111222333", status: "Aktif" },
  { id: "T002", name: "Ms. Sarah Johnson", nip: "19850202", role: "Guru Bahasa Inggris", phone: "08111222444", status: "Aktif" },
];

export default function GuruPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Data Guru & Staf</h1>
          <p className="text-ink-400 text-sm mt-1">Manajemen profil pengajar dan penugasan kelas.</p>
        </div>
        <Button className="flex items-center gap-2 bg-gold text-ink font-bold hover:bg-gold-600 rounded-xl shadow-sm">
          <Plus size={18} /> Tambah Guru
        </Button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input placeholder="Cari Nama Guru atau NIP..." className="pl-10 h-10 rounded-xl bg-cloud border-transparent" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ink-300 uppercase bg-cloud rounded-xl">
              <tr>
                <th className="px-6 py-4 font-bold rounded-l-xl">NIP / ID</th>
                <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                <th className="px-6 py-4 font-bold">Peran / Penugasan</th>
                <th className="px-6 py-4 font-bold">Kontak</th>
                <th className="px-6 py-4 font-bold rounded-r-xl text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TEACHERS.map((guru) => (
                <tr key={guru.id} className="border-b border-ink/5 hover:bg-cloud/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-ink-400">{guru.nip}</td>
                  <td className="px-6 py-4 font-bold">{guru.name}</td>
                  <td className="px-6 py-4 text-ink-400">{guru.role}</td>
                  <td className="px-6 py-4 text-sky hover:underline cursor-pointer">{guru.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-leaf-50 text-leaf-600 px-3 py-1 rounded-full text-xs font-bold">{guru.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
