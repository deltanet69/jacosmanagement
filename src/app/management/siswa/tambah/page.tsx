"use client";

import Link from "next/link";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TambahSiswaPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/management/siswa">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-gold transition-colors">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Input Data Siswa</h1>
          <p className="text-ink-400 text-sm">Formulir pendaftaran siswa baru ke dalam database master.</p>
        </div>
      </div>

      <form className="space-y-8">
        {/* Foto Profil & Identitas Dasar */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-ink/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-100 to-transparent opacity-20 rounded-bl-[100px] pointer-events-none" />
          
          <h2 className="text-lg font-bold mb-6 border-b border-ink/5 pb-4">Identitas Siswa</h2>
          
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-3xl bg-cloud border-2 border-dashed border-ink/20 flex flex-col items-center justify-center text-ink-300 hover:border-gold hover:text-gold transition-colors cursor-pointer group">
                <UploadCloud size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload Foto</span>
              </div>
              <p className="text-xs text-ink-400 text-center max-w-[120px]">Format JPG/PNG<br/>Max 2MB</p>
            </div>
            
            <div className="flex-1 grid sm:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-bold mb-2">Nama Lengkap</Label>
                <Input placeholder="Nama Siswa" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Nomor Induk Siswa (NIS)</Label>
                <Input placeholder="NIS" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">NISN (Opsional)</Label>
                <Input placeholder="NISN" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Nomor RF ID</Label>
                <Input placeholder="Scan Kartu RFID..." className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <Label className="block text-sm font-bold mb-2">Jenjang Pendidikan</Label>
              <select className="w-full h-12 px-3 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30 text-sm font-medium">
                <option>Pilih Jenjang</option>
                <option>Primary School (SD)</option>
                <option>Middle School (SMP)</option>
                <option>High School (SMA)</option>
              </select>
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Jenis Kelamin</Label>
              <select className="w-full h-12 px-3 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30 text-sm font-medium">
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Agama</Label>
              <Input placeholder="Islam" defaultValue="Islam" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Tempat Lahir</Label>
              <Input placeholder="Kota Lahir" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Tanggal Lahir</Label>
              <Input type="date" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Status dalam Keluarga</Label>
              <select className="w-full h-12 px-3 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30 text-sm font-medium">
                <option>Anak Kandung</option>
                <option>Anak Tiri</option>
                <option>Anak Angkat</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Label className="block text-sm font-bold mb-2">Alamat Lengkap</Label>
            <textarea className="w-full h-24 p-4 rounded-2xl bg-cloud border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 text-sm font-medium resize-none" placeholder="Alamat domisili saat ini..."></textarea>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-ink/5">
          <h2 className="text-lg font-bold mb-6 border-b border-ink/5 pb-4">Data Orang Tua</h2>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-display font-bold text-sky">Data Ayah</h3>
              <div>
                <Label className="block text-sm font-bold mb-2">Nama Ayah</Label>
                <Input placeholder="Nama Lengkap Ayah" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Pekerjaan Ayah</Label>
                <Input placeholder="Pekerjaan" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Status Ayah</Label>
                <select className="w-full h-12 px-3 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30 text-sm font-medium">
                  <option>Masih Hidup</option>
                  <option>Meninggal</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-display font-bold text-coral">Data Ibu</h3>
              <div>
                <Label className="block text-sm font-bold mb-2">Nama Ibu</Label>
                <Input placeholder="Nama Lengkap Ibu" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Pekerjaan Ibu</Label>
                <Input placeholder="Pekerjaan" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">Status Ibu</Label>
                <select className="w-full h-12 px-3 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30 text-sm font-medium">
                  <option>Masih Hidup</option>
                  <option>Meninggal</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-ink/5 pt-6 grid sm:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-bold mb-2">Nomor Telepon Orang Tua</Label>
              <Input placeholder="08xx-xxxx-xxxx" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Nomor KIP (Kartu Indonesia Pintar)</Label>
              <Input placeholder="Jika ada..." className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
          </div>
        </div>

        {/* Data Wali (Opsional) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-ink/5 opacity-80 hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-bold mb-6 border-b border-ink/5 pb-4">Data Wali (Opsional)</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-bold mb-2">Nama Wali</Label>
              <Input placeholder="Kosongkan jika sama dengan orang tua" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Hubungan Keluarga</Label>
              <Input placeholder="Contoh: Paman / Kakek" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Pekerjaan Wali</Label>
              <Input placeholder="Pekerjaan" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
            <div>
              <Label className="block text-sm font-bold mb-2">Nomor Telepon Wali</Label>
              <Input placeholder="08xx-xxxx-xxxx" className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:ring-gold/30" />
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="sticky bottom-6 z-20 flex justify-end gap-4 p-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-ink/10 shadow-2xl">
          <Link href="/management/siswa">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold text-ink-400 hover:text-ink hover:bg-cloud">
              Batal
            </Button>
          </Link>
          <Button className="h-12 px-8 bg-gold hover:bg-gold-600 text-ink font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <Save size={18} className="mr-2" /> Simpan Data Master
          </Button>
        </div>
      </form>
    </div>
  );
}
