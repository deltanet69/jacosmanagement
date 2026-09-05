"use client";

import { useState } from "react";
import { Search, Plus, Filter, Pin, Calendar, Eye, MoreHorizontal, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  is_priority: boolean;
  published_at: string;
  author: {
    full_name: string;
  } | null;
}

export function PengumumanListClient({ initialData }: { initialData: Announcement[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredData = initialData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">Pengumuman HR</h1>
          <p className="text-ink-500 text-sm mt-1">Pusat informasi, kebijakan baru, dan pengumuman untuk seluruh karyawan.</p>
        </div>
        <Link href="/management/hr/pengumuman/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 bg-coral text-white hover:bg-coral-600 rounded-xl shadow-sm">
            <Plus size={16} /> Buat Pengumuman
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input 
            placeholder="Cari judul atau isi pengumuman..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-white border-ink/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-base focus-visible:ring-sky-500" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {["ALL", "Kebijakan", "Info Cuti", "Event", "Penting"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 h-12 px-6 rounded-2xl text-sm font-bold border transition-colors ${
                categoryFilter === cat 
                  ? "bg-ink text-white border-ink shadow-sm" 
                  : "bg-white text-ink-500 border-ink/10 hover:bg-cloud"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-ink/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full relative overflow-hidden group">
            {item.is_priority && (
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl z-10 flex items-center gap-1">
                <Pin size={10} /> Penting
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                item.category === 'Kebijakan' ? 'bg-sky-50 text-sky-600' :
                item.category === 'Info Cuti' ? 'bg-emerald-50 text-emerald-600' :
                item.category === 'Event' ? 'bg-purple-50 text-purple-600' :
                'bg-ink/5 text-ink-600'
              }`}>
                {item.category}
              </span>
              <span className="text-xs text-ink-400 font-medium flex items-center gap-1">
                <Calendar size={12} /> {new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <h3 className="text-lg font-bold text-ink leading-tight mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
              {item.title}
            </h3>
            
            <p className="text-sm text-ink-500 line-clamp-3 mb-6 flex-1">
              {item.content}
            </p>

            <div className="mt-auto pt-4 border-t border-ink/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ink/5 flex items-center justify-center text-ink-400">
                  <FileText size={12} />
                </div>
                <span className="text-xs font-semibold text-ink-500">{item.author?.full_name || 'HR Admin'}</span>
              </div>
              <div className="flex items-center gap-3 text-ink-400">
                <button className="hover:text-ink transition-colors"><Eye size={16} /></button>
                <button className="hover:text-ink transition-colors"><MoreHorizontal size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-[2rem] border border-ink/5 shadow-sm">
          <div className="w-16 h-16 bg-cloud rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-ink-300" />
          </div>
          <h3 className="text-lg font-bold text-ink">Tidak ada pengumuman</h3>
          <p className="text-ink-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori.</p>
        </div>
      )}
    </div>
  );
}
