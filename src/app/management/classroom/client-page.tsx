"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Plus, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import { createClass, updateClass, deleteClass } from "./actions";

export default function ClassroomListClient({ initialClasses }: { initialClasses: any[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [isPending, startTransition] = useTransition();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", grade: "", capacity: 25 });
  
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  
  const handleOpenModal = (mode: "create" | "edit", cls?: any) => {
    setModalMode(mode);
    if (mode === "edit" && cls) {
      setActiveClassId(cls.id);
      setFormData({ name: cls.name, grade: cls.grade, capacity: cls.capacity || 25 });
    } else {
      setActiveClassId(null);
      setFormData({ name: "", grade: "", capacity: 25 });
    }
    setShowModal(true);
    setMenuOpen(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (modalMode === "create") {
        const res = await createClass(formData);
        if (res.success) {
          setShowModal(false);
          window.location.reload(); // Quick refresh to get new data
        } else {
          alert("Gagal membuat kelas: " + res.message);
        }
      } else if (modalMode === "edit" && activeClassId) {
        const res = await updateClass(activeClassId, formData);
        if (res.success) {
          setShowModal(false);
          window.location.reload();
        } else {
          alert("Gagal mengupdate kelas: " + res.message);
        }
      }
    });
  };
  
  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelas ini? Data siswa di kelas ini akan kehilangan referensi kelas.")) {
      startTransition(async () => {
        const res = await deleteClass(id);
        if (res.success) {
          window.location.reload();
        } else {
          alert("Gagal menghapus kelas: " + res.message);
        }
      });
    }
    setMenuOpen(null);
  };
  
  return (
    <div className="px-6 sm:px-10 py-8 w-full">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-50 via-white to-cloud border border-violet-100 p-8 sm:p-10 shadow-sm mb-8">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-violet-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/50 text-violet-700 text-xs font-bold tracking-wide uppercase mb-4 border border-violet-200/50">
              Manajemen Kelas
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-ink mb-4 tracking-tight">
              Daftar Classroom
            </h1>
            <p className="text-ink-400 text-lg leading-relaxed">
              Kelola data kelas, jadwal, absensi, perizinan, dan informasi kelas.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenModal("create")}
              className="bg-sky hover:bg-sky-600 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-lg shadow-sky/20 flex items-center gap-2 transition"
            >
              <Plus size={18} />
              Tambah Kelas
            </button>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-[2rem] border border-ink/5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cloud flex items-center justify-center text-3xl mb-4">🏫</div>
          <h2 className="font-display text-xl font-bold text-ink mb-1">Belum Ada Kelas</h2>
          <p className="text-ink-400 text-sm">Mulai dengan menambahkan kelas baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map((c) => (
            <div 
              key={c.id} 
              className="group bg-white rounded-[2rem] p-7 shadow-sm border border-ink/5 hover:border-sky/30 hover:shadow-md transition-all duration-300 relative flex flex-col h-full"
            >
              {/* Dropdown Menu */}
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(menuOpen === c.id ? null : c.id);
                  }}
                  className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-ink-400 hover:text-ink hover:bg-ink/5 transition"
                >
                  <MoreVertical size={16} />
                </button>
                
                {menuOpen === c.id && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-ink/5 overflow-hidden">
                    <button 
                      onClick={() => handleOpenModal("edit", c)}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink-400 font-bold hover:bg-cloud hover:text-sky flex items-center gap-2 transition"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-coral-600 font-bold hover:bg-coral-50 flex items-center gap-2 transition"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between mb-6 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-violet-50 text-sky flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <span className="bg-sky-50 text-sky-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mr-10 mt-1">
                  Tingkat {c.grade || "-"}
                </span>
              </div>
              
              <h3 className="font-display text-2xl font-bold text-ink mb-1 group-hover:text-sky transition-colors">
                Kelas {c.name}
              </h3>
              
              <Link 
                href={`/management/classroom/${c.id}`}
                className="mt-6 w-full bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky font-bold text-sm py-3 rounded-full transition flex items-center justify-center gap-2"
              >
                Buka Kelas <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden slide-down">
            <div className="flex items-center justify-between px-7 py-5 border-b border-ink/5">
              <h3 className="font-display text-xl font-bold text-ink">
                {modalMode === "create" ? "Tambah Kelas Baru" : "Edit Kelas"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-ink-400 hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              <div>
                <label className="block text-xs font-bold text-ink-300 uppercase tracking-wide mb-2">Nama Kelas</label>
                <input 
                  required
                  type="text"
                  placeholder="Misal: 1A, Bintang, KGA"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase tracking-wide mb-2">Tingkat/Grade</label>
                  <input 
                    required
                    type="text"
                    placeholder="Misal: 1, 2, TK-A"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase tracking-wide mb-2">Kapasitas</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 25})}
                    className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-cloud hover:bg-ink/5 text-ink-400 font-bold py-3.5 rounded-full transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-sky hover:bg-sky-600 text-white font-bold py-3.5 rounded-full shadow-md shadow-sky/20 transition disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
