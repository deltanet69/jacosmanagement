"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, CreditCard, School, MapPin, Phone, Users, Camera, RefreshCw } from "lucide-react";
import { updateStudent } from "../actions-detail";

export default function SiswaDetailClient({
  student,
  classes
}: {
  student: any;
  classes: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: student.full_name || "",
    nis: student.nis || "",
    nisn: student.nisn || "",
    rf_id: student.rf_id || "",
    gender: student.gender || "Laki-laki",
    program: student.program || "",
    class_id: student.class_id || "",
    is_active: student.is_active,
    birth_place: student.birth_place || "",
    birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split("T")[0] : "",
    address: student.address || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_active" ? value === "true" : value,
    }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await updateStudent(student.id, formData);
      if (res.success) {
        setMessage({ type: "success", text: "Data siswa berhasil disimpan!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.message || "Gagal menyimpan data." });
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="bg-white border-b border-ink/8 px-6 sm:px-10 py-5 sticky top-0 z-10">
        <div className="w-full flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/management/siswa" 
              className="w-11 h-11 rounded-full bg-white shadow-sm border border-ink/5 flex items-center justify-center text-ink-400 hover:bg-cloud transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Profil Siswa</h1>
              <p className="text-sm text-ink-400 font-medium">Edit data dan integrasi kartu RFID</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-gold hover:bg-gold-600 text-ink font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-gold/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save size={18} />
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-10 py-8 overflow-y-auto w-full">
        <div className="space-y-6">
          
          {message && (
            <div className={`slide-down flex items-center gap-3 font-bold text-sm px-5 py-4 rounded-2xl mb-6 ${
              message.type === "success" ? "bg-leaf-50 text-leaf-600" : "bg-coral-50 text-coral-600"
            }`}>
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs shrink-0 text-white ${
                message.type === "success" ? "bg-leaf" : "bg-coral"
              }`}>
                {message.type === "success" ? "✓" : "!"}
              </span>
              {message.text}
              <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* ============ LEFT COLUMN ============ */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-[2rem] p-7 shadow-sm text-center border border-ink/5">
                <div className="relative inline-block mb-4">
                  <div className="w-30 h-30 rounded-full bg-gradient-to-br from-sky to-violet flex items-center justify-center font-display text-3xl text-white shadow-lg overflow-hidden">
                    {student.profile_picture ? (
                      <img src={student.profile_picture} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      formData.full_name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-ink/5 flex items-center justify-center text-ink-400 hover:text-sky transition">
                    <Camera size={20} />
                  </button>
                </div>
                <p className="font-display text-2xl font-bold mb-0.5">{formData.full_name}</p>
                <p className="font-mono text-md text-ink-300 mb-3">NIS {formData.nis || "-"}</p>
                <span className={`inline-flex items-center gap-1.5 text-md font-bold px-6 py-1.5 rounded-full ${
                  formData.is_active ? "bg-leaf-50 text-leaf-600" : "bg-coral-50 text-coral-600"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.is_active ? "bg-leaf" : "bg-coral"}`}></span> 
                  {formData.is_active ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>

              {/* RFID Card */}
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-ink/5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky flex items-center justify-center shrink-0">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="font-display text-lg text-base font-bold leading-tight">Kartu RFID</p>
                    <p className="text-md text-ink-300 font-medium">Untuk tap absensi & jemput</p>
                  </div>
                </div>
                
                <div className="relative group">
                  <input
                    type="text"
                    name="rf_id"
                    value={formData.rf_id}
                    onChange={handleChange}
                    placeholder="Tap kartu disini..."
                    className="w-full rounded-2xl border-2 border-dashed border-sky/30 bg-sky-50 px-5 py-3.5 text-sm font-mono font-bold text-sky tracking-wider text-center focus:outline-none focus:border-sky focus:ring-4 focus:ring-sky/10 transition-all z-10 relative"
                  />
                  {/* Subtle pulsing effect around input when empty to attract attention */}
                  {!formData.rf_id && (
                    <span className="pulse-ring absolute inset-0 rounded-2xl border-2 border-sky pointer-events-none"></span>
                  )}
                </div>
                
                <p className="text-[13px] text-ink-300 text-center mt-3 font-medium">Arahkan kursor ke input, lalu tap kartu ke reader</p>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, rf_id: "" }))}
                  type="button" 
                  className="w-full mt-4 bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky font-bold text-xs py-3 rounded-full transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Reset Kartu
                </button>
              </div>
            </div>

            {/* ============ RIGHT COLUMN ============ */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-ink/5">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-14 h-14 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                    <User size={24} />
                  </span>
                  <h2 className="font-display text-lg font-bold">Informasi Dasar</h2>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Nama Lengkap</label>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">NIS</label>
                      <input
                        name="nis"
                        value={formData.nis}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-mono font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">NISN</label>
                      <input
                        name="nisn"
                        value={formData.nisn}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-mono font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Jenis Kelamin</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all appearance-none cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Status Siswa</label>
                      <select
                        name="is_active"
                        value={formData.is_active ? "true" : "false"}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all appearance-none cursor-pointer"
                      >
                        <option value="true">Aktif</option>
                        <option value="false">Tidak Aktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-ink/5">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-14 h-14 rounded-xl bg-violet-50 text-violet flex items-center justify-center">
                    <School size={24} />
                  </span>
                  <h2 className="font-display text-lg font-bold">Data Akademik</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Kelas</label>
                    <select
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Jenjang / Program</label>
                    <input
                      name="program"
                      value={formData.program}
                      onChange={handleChange}
                      placeholder="Contoh: SD, SMP, SMA"
                      className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Birth & Address Info */}
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-ink/5">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-14 h-14 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center">
                    <MapPin size={24} />
                  </span>
                  <h2 className="font-display text-lg font-bold">Tempat Lahir & Alamat</h2>
                </div>
                
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Tempat Lahir</label>
                      <input
                        name="birth_place"
                        value={formData.birth_place}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Tanggal Lahir</label>
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink-300 uppercase tracking-wide mb-2">Alamat Lengkap</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky/10 focus:border-sky transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
