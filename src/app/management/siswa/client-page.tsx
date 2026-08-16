"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Plus, FileSpreadsheet, Fingerprint, User, LayoutGrid, List as ListIcon, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SiswaClientPage({ students }: { students: any[] }) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClassDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract unique classes
  const classes = useMemo(() => {
    const uniqueClasses = new Set<string>();
    students.forEach(s => {
      if (s.school_classes?.name) uniqueClasses.add(s.school_classes.name);
    });
    return Array.from(uniqueClasses).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        s.nis?.toLowerCase().includes(search.toLowerCase()) || 
        s.rf_id?.toLowerCase().includes(search.toLowerCase());
        
      const matchProgram = filterProgram === "all" || s.program?.toLowerCase() === filterProgram.toLowerCase();
      const matchClass = filterClass === "all" || s.school_classes?.name === filterClass;

      return matchSearch && matchProgram && matchClass;
    });
  }, [students, search, filterClass, filterProgram]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gold-50 via-white to-cloud border border-gold-100 p-8 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-gold-200/40 to-gold-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-100/50 text-gold-700 text-xs font-bold tracking-wide uppercase mb-4 border border-gold-200/50">
              Database Master
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-600">Siswa Aktif</span>
            </h1>
            <p className="text-ink-400 mt-3 text-lg leading-relaxed">
              Pusat informasi biodata lengkap siswa, data RFID, dan rekam keluarga.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/management/siswa/tambah" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-14 px-6 bg-white/80 backdrop-blur-xl border-ink/10 hover:bg-gold-50 hover:text-gold text-ink font-bold rounded-2xl shadow-sm transition-all duration-300">
                <Plus size={20} className="mr-2" /> Tambah Siswa
              </Button>
            </Link>
            <Link href="/management/siswa/import" className="w-full sm:w-auto">
              <Button className="w-full h-14 px-6 bg-ink hover:bg-ink-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <FileSpreadsheet size={20} className="mr-2" /> Import Excel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-ink-300 group-focus-within:text-gold transition-colors" />
          </div>
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIS, atau RFID..." 
            className="pl-12 h-14 rounded-full bg-white border-none shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-gold/30 text-base font-medium transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Button 
            onClick={() => setFilterProgram("all")}
            variant="ghost" 
            className={`h-12 px-5 rounded-full font-bold whitespace-nowrap shadow-sm transition-colors ${filterProgram === "all" ? "bg-ink text-white hover:bg-ink-600" : "bg-white text-ink hover:bg-sky-50 hover:text-sky"}`}
          >
            Semua Jenjang
          </Button>
          <Button 
            onClick={() => setFilterProgram("primary")}
            variant="ghost" 
            className={`h-12 px-5 rounded-full font-bold whitespace-nowrap shadow-sm transition-colors ${filterProgram === "primary" ? "bg-ink text-white hover:bg-ink-600" : "bg-white text-ink hover:bg-sky-50 hover:text-sky"}`}
          >
            Primary
          </Button>
          <Button 
            onClick={() => setFilterProgram("middle")}
            variant="ghost" 
            className={`h-12 px-5 rounded-full font-bold whitespace-nowrap shadow-sm transition-colors ${filterProgram === "middle" ? "bg-ink text-white hover:bg-ink-600" : "bg-white text-ink hover:bg-leaf-50 hover:text-leaf"}`}
          >
            Middle
          </Button>

          {/* Filter Kelas — Custom Dropdown */}
          <div ref={dropdownRef} className="relative">
            <Button
              onClick={() => setClassDropdownOpen(!classDropdownOpen)}
              variant="outline"
              className={`h-12 px-4 rounded-full bg-white border-none shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors ${filterClass !== 'all' ? 'text-gold' : 'text-ink hover:text-gold'}`}
            >
              <Filter size={16} />
              <span className="text-sm font-bold">{filterClass === 'all' ? 'Semua Kelas' : filterClass}</span>
              <ChevronDown size={14} className={`transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
            {classDropdownOpen && (
              <div className="absolute right-0 top-14 z-50 w-48 bg-white rounded-2xl p-2 shadow-xl border border-ink/8 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { setFilterClass("all"); setClassDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold mb-1 transition-colors hover:bg-cloud ${filterClass === 'all' ? 'bg-gold-50 text-gold-700' : 'text-ink'}`}
                >
                  Semua Kelas
                </button>
                {classes.map(c => (
                  <button
                    key={c}
                    onClick={() => { setFilterClass(c); setClassDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-cloud ${filterClass === c ? 'bg-gold-50 text-gold-700' : 'text-ink'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex bg-white rounded-full p-1 shadow-sm h-12 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("list")}
              className={`w-10 h-10 rounded-full transition-all ${view === "list" ? "bg-gold text-white shadow-md hover:bg-gold-600 hover:text-white" : "text-ink-400 hover:text-ink hover:bg-ink/5"}`}
            >
              <ListIcon size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("grid")}
              className={`w-10 h-10 rounded-full transition-all ${view === "grid" ? "bg-gold text-white shadow-md hover:bg-gold-600 hover:text-white" : "text-ink-400 hover:text-ink hover:bg-ink/5"}`}
            >
              <LayoutGrid size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State / Student List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-ink/20">
          <div className="w-20 h-20 bg-cloud rounded-full flex items-center justify-center mx-auto mb-4 text-ink-300">
            <User size={32} />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Belum Ada Data Siswa</h2>
          <p className="text-ink-400 max-w-md mx-auto mb-6">Pencarian atau filter tidak menemukan hasil, atau database siswa masih kosong.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8 pt-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="group relative bg-white rounded-[2rem] p-1.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_-10px_rgba(250,204,21,0.3)] transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
              
              <div className="relative bg-white rounded-[1.75rem] h-full flex flex-col p-6 overflow-hidden border border-ink/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-100 to-transparent opacity-10 rounded-bl-[100px] -z-0" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  {student.profile_picture ? (
                    <img src={student.profile_picture} alt={student.full_name} className="w-16 h-16 rounded-[1.2rem] object-cover shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-gold-50 to-cloud flex items-center justify-center font-display font-extrabold text-2xl text-gold shadow-md">
                      {student.full_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.is_active ? 'bg-leaf-50 text-leaf-600' : 'bg-coral-50 text-coral-600'}`}>
                      {student.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                    {student.school_classes?.name && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700">
                        {student.school_classes.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 relative z-10 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-bold text-ink-300 tracking-wider uppercase">NIS: {student.nis || '-'}</p>
                    <span className="w-1 h-1 rounded-full bg-ink/20" />
                    <p className="text-xs font-bold text-ink-300">NISN: {student.nisn || '-'}</p>
                  </div>
                  
                  <h2 className="font-display text-2xl font-extrabold text-ink mb-3 group-hover:text-gold transition-colors">{student.full_name}</h2>
                  
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cloud text-ink font-semibold text-xs border border-ink/5">
                      {student.program || 'Tanpa Program'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                      {student.gender || '-'}
                    </span>
                  </div>

                  {student.rf_id && (
                    <div className="flex items-center gap-2 mb-5 p-2 bg-cloud/50 rounded-xl border border-ink/5 w-max">
                      <Fingerprint size={14} className="text-leaf" />
                      <span className="text-[10px] font-bold text-ink-400 tracking-wider">RFID: {student.rf_id}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-cloud/40 border border-ink/5">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink-300 shadow-sm">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-300 uppercase">
                        Orang Tua / Wali
                      </p>
                      <p className="text-sm font-semibold text-ink">
                        {student.student_parents?.[0]?.father_name || student.student_guardians?.[0]?.guardian_name || 'Belum di-set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <Link href={`/management/siswa/${student.id}`}>
                    <Button className="w-full h-12 bg-white border-2 border-ink/5 group-hover:border-gold group-hover:bg-gold-50 text-ink group-hover:text-gold-700 font-bold rounded-xl transition-all duration-300 shadow-sm">
                      Lihat Profil Lengkap
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-2 sm:p-4 shadow-sm border border-ink/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-ink/5 text-ink-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-4 pl-6">Siswa</th>
                  <th className="py-4 px-4">NIS / NISN</th>
                  <th className="py-4 px-4">Kelas</th>
                  <th className="py-4 px-4">Program</th>
                  <th className="py-4 px-4">RFID</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-cloud/30 transition-colors group">
                    <td className="py-4 px-4 pl-6">
                      <div className="flex items-center gap-3">
                        {student.profile_picture ? (
                          <img src={student.profile_picture} alt={student.full_name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-50 to-cloud flex items-center justify-center font-display font-extrabold text-sm text-gold shadow-sm">
                            {student.full_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-ink group-hover:text-gold transition-colors">{student.full_name}</p>
                          <p className="text-xs text-ink-400">{student.gender || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink text-sm">{student.nis || '-'}</span>
                        <span className="text-xs text-ink-400">{student.nisn || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold">
                        {student.school_classes?.name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-ink-500">
                        {student.program || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {student.rf_id ? (
                        <div className="flex items-center gap-1 text-leaf-600">
                          <Fingerprint size={14} />
                          <span className="text-xs font-bold">{student.rf_id}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${student.is_active ? 'bg-leaf-50 text-leaf-600' : 'bg-coral-50 text-coral-600'}`}>
                        {student.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="py-4 px-4 pr-6 text-right">
                      <Link href={`/management/siswa/${student.id}`}>
                        <Button variant="ghost" className="h-8 px-3 text-gold hover:bg-gold-50 font-bold rounded-lg transition-colors">
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
