"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Plus, FileText, CheckCircle2, XCircle, Clock, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getApplicants } from "./actions";

export default function AdmisiPage() {
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApplicants() {
      const data = await getApplicants();
      setApplicants(data);
      setIsLoading(false);
    }
    fetchApplicants();
  }, []);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case "VERIFIED": return { color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", icon: <CheckCircle2 size={16} className="text-sky-500" />, label: "Diverifikasi", gradient: "from-sky-500 to-sky-400" };
      case "ACCEPTED":
      case "ENROLLED": return { color: "text-leaf-600", bg: "bg-leaf-50", border: "border-leaf-200", icon: <CheckCircle2 size={16} className="text-leaf-500" />, label: "Diterima", gradient: "from-leaf-500 to-leaf-400" };
      case "REJECTED": return { color: "text-coral-600", bg: "bg-coral-50", border: "border-coral-200", icon: <XCircle size={16} className="text-coral-500" />, label: "Ditolak", gradient: "from-coral-500 to-coral-400" };
      case "SUBMITTED":
      case "PENDING": default: return { color: "text-gold-600", bg: "bg-gold-50", border: "border-gold-200", icon: <Clock size={16} className="text-gold-500" />, label: "Menunggu Review", gradient: "from-gold-400 to-gold-300" };
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Playful & Premium Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-50 via-white to-cloud border border-sky-100 p-8 sm:p-10 shadow-sm">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-sky-200/40 to-sky-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-leaf-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100/50 text-sky-700 text-xs font-bold tracking-wide uppercase mb-4 border border-sky-200/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Portal Admisi PPDB
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Manajemen <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky to-sky-600">Pendaftar</span>
            </h1>
            <p className="text-ink-400 mt-3 text-lg leading-relaxed">
              Kelola dan verifikasi aplikasi pendaftaran calon siswa baru dengan mudah dan cepat.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl shadow-ink/5">
            <div className="flex items-center gap-4 px-4 py-3 bg-cloud/50 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-1">Status Pendaftaran</span>
                <Label htmlFor="admission-status" className="font-bold cursor-pointer text-sm">
                  {isAdmissionOpen ? (
                    <span className="text-leaf flex items-center gap-1.5"><CheckCircle2 size={14}/> Dibuka untuk Umum</span>
                  ) : (
                    <span className="text-coral flex items-center gap-1.5"><XCircle size={14}/> Ditutup Sementara</span>
                  )}
                </Label>
              </div>
              <div className="h-8 w-px bg-ink/10 mx-2" />
              <Switch 
                id="admission-status" 
                checked={isAdmissionOpen}
                onCheckedChange={setIsAdmissionOpen}
                className="data-[state=checked]:bg-leaf scale-110"
              />
            </div>
            
            <Link href="/management/admisi/tambah" className="shrink-0">
              <Button className="w-full sm:w-auto h-14 px-6 bg-ink hover:bg-ink-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <Plus size={20} className="mr-2" /> Input Manual
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-ink-300 group-focus-within:text-sky transition-colors" />
          </div>
          <Input 
            placeholder="Cari nama, ID pendaftaran, atau program..." 
            className="pl-12 h-14 rounded-full bg-white border-none shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-sky/30 focus-visible:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.2)] text-base font-medium transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Button variant="ghost" className="h-12 px-5 bg-ink text-white hover:bg-ink-600 rounded-full font-bold whitespace-nowrap shadow-sm">
            Semua Status
          </Button>
          <Button variant="ghost" className="h-12 px-5 bg-white text-ink hover:bg-sky-50 hover:text-sky rounded-full font-bold whitespace-nowrap shadow-sm">
            Menunggu
          </Button>
          <Button variant="ghost" className="h-12 px-5 bg-white text-ink hover:bg-leaf-50 hover:text-leaf rounded-full font-bold whitespace-nowrap shadow-sm">
            Diterima
          </Button>
          <Button variant="outline" className="h-12 w-12 p-0 rounded-full bg-white border-none shadow-sm text-ink hover:text-sky flex items-center justify-center shrink-0">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {/* Premium Applicant Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-ink-300 font-medium">Memuat data pendaftar...</div>
      ) : applicants.length === 0 ? (
        <div className="py-20 text-center text-ink-300 font-medium">Belum ada pendaftar PPDB.</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8 pt-4">
        {applicants.map((app) => {
          const style = getStatusStyle(app.status);
          const parentName = app.guardians && app.guardians.length > 0 ? app.guardians[0].full_name : "-";
          const avatar = app.student_name ? app.student_name.substring(0, 2).toUpperCase() : "AA";
          const formattedDate = new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          
          return (
            <div key={app.id} className="group relative bg-white rounded-[2rem] p-1.5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_-10px_rgba(14,165,233,0.2)] transition-all duration-500 hover:-translate-y-2">
              {/* Colored side indicator / glowing border effect */}
              <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />
              
              <div className="relative bg-white rounded-[1.75rem] h-full flex flex-col p-6 overflow-hidden border border-ink/5">
                {/* Decorative background shape */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.gradient} opacity-5 rounded-bl-[100px] -z-0`} />
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-[1.1rem] bg-gradient-to-br ${style.gradient} flex items-center justify-center font-display font-extrabold text-xl text-white shadow-md shadow-${style.color.split('-')[1]}/30`}>
                    {avatar}
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${style.bg} ${style.color} border border-${style.color.split('-')[1]}-100`}>
                    {style.icon}
                    {style.label}
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="flex-1 relative z-10 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-bold text-ink-300 tracking-wider uppercase">{app.registration_no || app.id.substring(0, 8)}</p>
                    <span className="w-1 h-1 rounded-full bg-ink/20" />
                    <p className="text-xs font-bold text-ink-300">{formattedDate}</p>
                  </div>
                  
                  <h2 className="font-display text-2xl font-extrabold text-ink mb-3 group-hover:text-sky transition-colors">{app.student_name}</h2>
                  
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cloud text-ink font-semibold text-xs border border-ink/5">
                      {app.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                      {app.program === "KINDERGARTEN" ? "Kindergarten" : "Primary School"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-cloud/40 border border-ink/5">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink-300 shadow-sm">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-300 uppercase">Wali / Orang Tua</p>
                      <p className="text-sm font-semibold text-ink">{parentName}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="mt-auto relative z-10">
                  <Link href={`/management/admisi/${app.id}`}>
                    <Button className="w-full h-12 bg-white border-2 border-ink/5 group-hover:border-sky group-hover:bg-sky text-ink group-hover:text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm">
                      <FileText size={16} className="group-hover/btn:hidden" />
                      <span className="group-hover/btn:hidden">Detail</span>
                      <span className="hidden group-hover/btn:inline-block">Lihat Aplikasi Penuh →</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
