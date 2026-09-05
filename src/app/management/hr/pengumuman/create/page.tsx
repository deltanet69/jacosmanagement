"use client";

import { useState } from "react";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatePengumumanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Kebijakan",
    content: "",
    isPriority: false,
    targets: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real implementation, we would send this to an API route
    // that validates and inserts into the Supabase hr_announcements table
    // For now, simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/management/hr/pengumuman");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/management/hr/pengumuman">
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-ink/10 bg-white">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Buat Pengumuman</h1>
          <p className="text-ink-500 text-sm mt-1">Buat informasi baru untuk disebarkan ke karyawan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink/5 space-y-8">
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-ink-700 font-bold">Judul Pengumuman</Label>
            <Input 
              id="title"
              placeholder="Contoh: Penyesuaian Jam Kerja Bulan Ramadhan"
              required
              className="h-12 bg-cloud/50 border-ink/10 focus-visible:ring-sky-500 text-base"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-ink-700 font-bold">Kategori</Label>
              <select 
                id="category"
                className="w-full h-12 px-4 rounded-xl bg-cloud/50 border border-ink/10 text-sm font-semibold text-ink-600 outline-none focus:border-sky-500 transition-colors"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Kebijakan">Kebijakan Baru</option>
                <option value="Info Cuti">Info Cuti</option>
                <option value="Event">Event Perusahaan</option>
                <option value="Penting">Pengumuman Penting</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-center space-y-2 pt-2 md:pt-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/50">
                <div className="space-y-0.5">
                  <Label className="font-bold text-rose-900 cursor-pointer" htmlFor="priority">Tandai Penting</Label>
                  <p className="text-xs text-rose-700/70">Akan mengirim notifikasi langsung ke semua staf.</p>
                </div>
                <Switch 
                  id="priority" 
                  checked={formData.isPriority}
                  onCheckedChange={(checked) => setFormData({...formData, isPriority: checked})}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-ink-700 font-bold">Isi Pengumuman</Label>
            <Textarea 
              id="content"
              placeholder="Tuliskan detail pengumuman di sini..."
              required
              className="min-h-[200px] resize-y bg-cloud/50 border-ink/10 focus-visible:ring-sky-500 p-4 text-base leading-relaxed"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-ink-700 font-bold">Lampiran File (Opsional)</Label>
            <div className="border-2 border-dashed border-ink/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-cloud/50 transition-colors cursor-pointer text-center">
              <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-2">
                <Upload size={20} />
              </div>
              <p className="font-semibold text-ink">Klik untuk upload atau drag & drop</p>
              <p className="text-xs text-ink-400">PDF, JPG, atau PNG (Maks. 5MB)</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-ink/5 flex justify-end gap-3">
          <Link href="/management/hr/pengumuman">
            <Button type="button" variant="ghost" className="rounded-xl h-12 px-6 font-bold text-ink-500 hover:text-ink">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm gap-2">
            {isSubmitting ? (
              "Menyimpan..."
            ) : (
              <>
                <Save size={18} /> Terbitkan Pengumuman
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
