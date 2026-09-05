"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Employee {
  id: string;
  full_name: string;
  nik: string;
  employee_type: string;
  position: string | null;
  status: string;
  phone: string | null;
}

export function GuruListClient({ initialData }: { initialData: Employee[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredData = initialData.filter(employee => {
    const matchesSearch = 
      employee.full_name.toLowerCase().includes(search.toLowerCase()) || 
      employee.nik.includes(search);
    
    const matchesRole = roleFilter === "ALL" || employee.employee_type === roleFilter;
    const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? employee.status === "active" : employee.status !== "active");
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">Data Guru & Staf</h1>
          <p className="text-ink-500 text-sm mt-1">Manajemen profil pengajar, staf, dan penugasan divisi.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 rounded-xl border-ink/10 text-ink-600 bg-white shadow-sm flex-1 sm:flex-none">
            <Filter size={16} /> Export CSV
          </Button>
          <Button className="gap-2 bg-ink text-white hover:bg-ink-800 rounded-xl shadow-sm flex-1 sm:flex-none">
            <Plus size={16} /> Tambah Data
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink/5">
        
        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input 
              placeholder="Cari berdasarkan nama atau NIK..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-cloud/50 border-ink/10 text-base focus-visible:ring-sky-500" 
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-12 px-4 rounded-2xl bg-cloud/50 border border-ink/10 text-sm font-semibold text-ink-600 outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Jabatan</option>
              <option value="GURU">Guru</option>
              <option value="STAF">Staf</option>
              <option value="HR_ADMIN">HR Admin</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 rounded-2xl bg-cloud/50 border border-ink/10 text-sm font-semibold text-ink-600 outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/5">
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider">Karyawan</th>
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider">NIK</th>
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider">Jabatan & Dept</th>
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider">Kontak</th>
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider text-center">Status</th>
                <th className="pb-4 font-bold text-ink-400 uppercase text-xs tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filteredData.map((employee) => (
                <tr key={employee.id} className="group hover:bg-cloud/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                        {employee.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-ink">{employee.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-mono text-ink-500">{employee.nik}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink text-sm">{employee.employee_type}</span>
                      {employee.position && <span className="text-xs text-ink-400">{employee.position}</span>}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-sky-600 font-medium">{employee.phone || "-"}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      employee.status === "active" ? "bg-leaf-50 text-leaf-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {employee.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-ink-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-ink-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="opacity-20 mb-3" />
                      <p>Tidak ada data guru atau staf yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredData.map((employee) => (
            <div key={employee.id} className="bg-white border border-ink/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {employee.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm leading-tight">{employee.full_name}</h3>
                    <p className="text-xs font-mono text-ink-400">{employee.nik}</p>
                  </div>
                </div>
                <button className="text-ink-400 hover:text-ink"><MoreVertical size={18} /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-ink/5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-ink-300">Jabatan</p>
                  <p className="text-sm font-semibold">{employee.employee_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-ink-300">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                    employee.status === "active" ? "bg-leaf-50 text-leaf-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {employee.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="py-8 text-center text-ink-400 text-sm">
              Tidak ada data ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
