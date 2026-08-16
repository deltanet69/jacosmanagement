"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TambahApplicantPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/management/admisi">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-sky transition-colors">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Input Data Pendaftar (Manual)</h1>
          <p className="text-ink-400 text-sm">Formulir admin untuk calon siswa yang datang langsung.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
        <h2 className="text-lg font-bold mb-6 border-b border-ink/5 pb-4">Data Calon Siswa</h2>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <Label className="block text-sm font-bold mb-2">Nama Lengkap</Label>
            <Input placeholder="Contoh: Ahmad Rayyan" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
          <div>
            <Label className="block text-sm font-bold mb-2">NISN (Opsional)</Label>
            <Input placeholder="NISN" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
          <div>
            <Label className="block text-sm font-bold mb-2">Tempat Lahir</Label>
            <Input placeholder="Kota" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
          <div>
            <Label className="block text-sm font-bold mb-2">Tanggal Lahir</Label>
            <Input type="date" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
        </div>

        <h2 className="text-lg font-bold mb-6 border-b border-ink/5 pb-4">Data Orang Tua / Wali</h2>
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <Label className="block text-sm font-bold mb-2">Nama Lengkap Orang Tua</Label>
            <Input placeholder="Contoh: Budi Santoso" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
          <div>
            <Label className="block text-sm font-bold mb-2">Nomor Telepon</Label>
            <Input placeholder="08xx-xxxx-xxxx" className="h-12 rounded-2xl bg-cloud border-transparent" />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-ink/5">
          <Link href="/management/admisi">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold text-ink-400 hover:text-ink hover:bg-cloud">
              Batal
            </Button>
          </Link>
          <Button className="h-12 px-8 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm">
            <Save size={18} className="mr-2" /> Simpan Data
          </Button>
        </div>
      </div>
    </div>
  );
}
