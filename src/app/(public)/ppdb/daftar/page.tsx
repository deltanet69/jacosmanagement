"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitApplicant } from "./actions";

export default function DaftarPPDB() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const stepLabels = ["Informasi Siswa", "Data Orang Tua", "Dokumen", "Review & Kirim"];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationNo, setRegistrationNo] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    nisn: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki",
    category: "Siswa Baru",
    address: "",
    program: "Primary",
    parentName: "",
    parentBirthPlace: "",
    parentBirthDate: "",
    parentJob: "",
    parentRelation: "ayah",
    phone: "",
    email: "",
    agreed: false
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = async () => {
    if (currentStep === totalSteps) {
      if (!formData.agreed) {
        alert("Anda harus menyetujui pernyataan untuk melanjutkan.");
        return;
      }
      setIsSubmitting(true);
      const res = await submitApplicant(formData);
      setIsSubmitting(false);
      
      if (res.success) {
        setRegistrationNo(res.registrationNo!);
        setIsSuccess(true);
      } else {
        alert(res.message);
      }
    } else {
      setCurrentStep(c => c + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        try {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          await imageCompression(file, options);
          // Upload logic here...
        } catch (error) {
          console.error("Error compressing image:", error);
        }
      }
    }
  };

  const renderSidebar = () => {
    return (
      <aside className="hidden lg:flex w-80 bg-white border-r border-ink/10 flex-col px-8 py-10 shrink-0 min-h-screen">
        <div className="flex items-center gap-2.5 mb-14">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={140} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </div>
        {!isSuccess && (
          <div className="space-y-8 relative">
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5" style={{ background: "repeating-linear-gradient(180deg,#D3E3FF 0 8px, transparent 8px 16px)" }}></div>
            {[1, 2, 3, 4].map(step => {
              const isActive = step === currentStep;
              const isPast = step < currentStep;
              return (
                <button key={step} onClick={() => setCurrentStep(step)} className="flex items-start gap-4 relative text-left w-full group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition ${isActive || isPast ? "bg-sky text-white" : "bg-white border-2 border-ink/15 text-ink-300 group-hover:border-sky/50"}`}>
                    {isPast ? "✓" : step}
                  </div>
                  <div className="pt-2">
                    <p className={`font-bold text-sm ${isActive || isPast ? "text-sky" : "text-ink-300"}`}>Langkah {step}</p>
                    <p className={`font-semibold ${isActive || isPast ? "text-ink" : "text-ink-300"}`}>{stepLabels[step - 1]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-auto bg-cloud rounded-3xl p-5">
          <p className="text-xs font-bold text-ink-400 mb-1">Butuh bantuan?</p>
          <p className="text-xs text-ink-300 leading-relaxed">WhatsApp 0821-4000-0477 atau email admission@jacos.id, setiap hari kerja.</p>
        </div>
      </aside>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex bg-cloud">
        {renderSidebar()}
        <div className="flex-1 overflow-y-auto flex">
          <main className="w-full max-w-2xl px-6 sm:px-12 py-10 mx-auto min-h-screen flex flex-col justify-center text-center">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-ink/5">
              <div className="w-24 h-24 bg-leaf-50 text-leaf-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
              <h1 className="font-display text-3xl font-bold mb-4">Pendaftaran Berhasil!</h1>
              <p className="text-ink-400 mb-8">Terima kasih telah mendaftar di JACOS. Berikut adalah nomor pendaftaran Anda:</p>
              <div className="bg-cloud p-6 rounded-3xl mb-8">
                <p className="font-mono text-3xl font-bold text-sky">{registrationNo}</p>
              </div>
              <p className="text-sm text-ink-400 mb-8">Tim admisi kami akan segera memproses data Anda dan menghubungi Anda melalui WhatsApp atau Email untuk tahap selanjutnya.</p>
              <Button onClick={() => window.location.reload()} className="bg-sky hover:bg-sky-600 text-white font-bold h-12 px-8 rounded-full">Daftar Siswa Lain</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-cloud">
      {renderSidebar()}
      
      <div className="flex-1 overflow-y-auto flex">
        <main className="w-full max-w-3xl px-6 sm:px-12 py-10 mx-auto min-h-screen flex flex-col justify-center">
          <div className="w-full">
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold text-ink-300 mb-2">
                <span className="text-sky">Langkah {currentStep} dari {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white overflow-hidden shadow-inner">
                <div className="h-full bg-sky rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
              </div>
            </div>

            <form onSubmit={e => e.preventDefault()}>
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">Informasi Siswa</span>
                  <h1 className="font-display text-3xl mb-2">Ceritakan tentang ananda.</h1>
                  <p className="text-ink-400 mb-10">Isi sesuai dokumen resmi (akte lahir / KK) ya, Bapak/Ibu.</p>

                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-bold mb-2">Nama Lengkap Anak</Label>
                      <Input value={formData.fullName} onChange={e => updateForm('fullName', e.target.value)} placeholder="Contoh: Nayla Putri Ramadhani" className="h-12 rounded-2xl bg-white border-ink/10" />
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">NISN (Jika ada)</Label>
                      <Input value={formData.nisn} onChange={e => updateForm('nisn', e.target.value)} placeholder="Nomor Induk Siswa Nasional" className="h-12 rounded-2xl bg-white border-ink/10" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Tempat Lahir</Label>
                        <Input value={formData.birthPlace} onChange={e => updateForm('birthPlace', e.target.value)} placeholder="Jakarta" className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Tanggal Lahir</Label>
                        <Input type="date" value={formData.birthDate} onChange={e => updateForm('birthDate', e.target.value)} className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">Jenis Kelamin</Label>
                      <RadioGroup value={formData.gender} onValueChange={v => updateForm('gender', v)} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Laki-laki" />
                          <span className="text-sm font-semibold">Laki-laki</span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Perempuan" />
                          <span className="text-sm font-semibold">Perempuan</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">Status Pendaftaran</Label>
                      <RadioGroup value={formData.category} onValueChange={v => updateForm('category', v)} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Siswa Baru" />
                          <span className="text-sm font-semibold">Siswa Baru</span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 hover:border-sky/50 bg-white px-5 py-3.5 cursor-pointer transition-colors [&:has([data-state=checked])]:border-sky [&:has([data-state=checked])]:bg-sky-50">
                          <RadioGroupItem value="Pindahan" />
                          <span className="text-sm font-semibold">Pindahan</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">Alamat Lengkap Siswa</Label>
                      <Textarea value={formData.address} onChange={e => updateForm('address', e.target.value)} placeholder="Alamat domisili saat ini" className="min-h-[100px] rounded-2xl bg-white border-ink/10 p-4" />
                    </div>
                    <div>
                      <Label className="block text-sm font-bold mb-2">Apply untuk Sekolah</Label>
                      <RadioGroup value={formData.program} onValueChange={v => updateForm('program', v)} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-sky bg-sky-50 px-5 py-3.5 cursor-pointer">
                          <RadioGroupItem value="Primary" />
                          <span className="text-sm font-semibold">Primary School</span>
                        </Label>
                        <Label className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 px-5 py-3.5 opacity-50 cursor-not-allowed">
                          <RadioGroupItem value="Kindergarten" disabled />
                          <span className="text-sm font-semibold">Kindergarten <span className="block text-[10px] font-medium text-ink-300">Segera hadir</span></span>
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">Data Orang Tua</span>
                  <h1 className="font-display text-3xl mb-2">Data orang tua / wali.</h1>
                  <p className="text-ink-400 mb-10">Kontak utama yang akan kami hubungi terkait proses admisi.</p>
                  
                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-bold mb-2">Nama Lengkap Orang Tua / Wali</Label>
                      <Input value={formData.parentName} onChange={e => updateForm('parentName', e.target.value)} placeholder="Contoh: Ahmad Ramadhan" className="h-12 rounded-2xl bg-white border-ink/10" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Tempat Lahir</Label>
                        <Input value={formData.parentBirthPlace} onChange={e => updateForm('parentBirthPlace', e.target.value)} placeholder="Bandung" className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Tanggal Lahir</Label>
                        <Input type="date" value={formData.parentBirthDate} onChange={e => updateForm('parentBirthDate', e.target.value)} className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Pekerjaan</Label>
                        <Input value={formData.parentJob} onChange={e => updateForm('parentJob', e.target.value)} placeholder="Contoh: Wiraswasta" className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Hubungan dengan Anak</Label>
                        <Select value={formData.parentRelation} onValueChange={v => updateForm('parentRelation', v)}>
                          <SelectTrigger className="h-12 w-full rounded-2xl bg-white border-ink/10">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ayah">Ayah</SelectItem>
                            <SelectItem value="ibu">Ibu</SelectItem>
                            <SelectItem value="wali">Wali</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-bold mb-2">Nomor WhatsApp</Label>
                        <Input value={formData.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="08xx-xxxx-xxxx" className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                      <div>
                        <Label className="block text-sm font-bold mb-2">Email</Label>
                        <Input type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} placeholder="nama@email.com" className="h-12 rounded-2xl bg-white border-ink/10" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">Dokumen</span>
                  <h1 className="font-display text-3xl mb-2">Unggah dokumen pendukung.</h1>
                  <p className="text-ink-400 mb-10">Format JPG, PNG, atau PDF — maksimal 5MB per file.</p>
                  
                  <div className="space-y-4">
                    {[
                      { title: "Kartu Keluarga (KK)", type: "📄" },
                      { title: "Akte Lahir", type: "📄" },
                      { title: "Pas Foto 4x3", type: "🖼️", desc: "Latar belakang polos" },
                    ].map((doc, idx) => (
                      <Label key={idx} className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink/15 bg-white px-6 py-5 cursor-pointer hover:border-sky hover:bg-sky-50 transition-all">
                        <Input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileUpload} />
                        <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky flex items-center justify-center text-lg shrink-0">{doc.type}</div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{doc.title}</p>
                          <p className="text-xs text-ink-300 font-normal mt-0.5">{doc.desc || "Belum diunggah"}</p>
                        </div>
                        <span className="text-xs font-bold text-sky">Pilih File</span>
                      </Label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="inline-block bg-sky-50 text-sky text-xs font-bold px-3 py-1 rounded-full mb-4">Review & Kirim</span>
                  <h1 className="font-display text-3xl mb-2">Periksa kembali datanya.</h1>
                  <p className="text-ink-400 mb-10">Pastikan semua data sudah benar sebelum dikirim ke tim admisi JACOS.</p>
                  
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-sky">Informasi Siswa</p>
                        <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold text-ink-300 hover:text-sky">Ubah</button>
                      </div>
                      <p className="text-sm font-bold text-ink mb-1">{formData.fullName || "-"}</p>
                      <p className="text-xs text-ink-400">{formData.birthPlace || "-"}, {formData.birthDate || "-"}</p>
                    </div>
                    
                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-sky">Data Orang Tua</p>
                        <button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-bold text-ink-300 hover:text-sky">Ubah</button>
                      </div>
                      <p className="text-sm font-bold text-ink mb-1">{formData.parentName || "-"}</p>
                      <p className="text-xs text-ink-400">{formData.phone || "-"} · {formData.email || "-"}</p>
                    </div>

                    <Label className="flex items-start gap-3 pt-4 cursor-pointer">
                      <Checkbox 
                        className="mt-0.5" 
                        checked={formData.agreed} 
                        onCheckedChange={v => updateForm('agreed', !!v)} 
                      />
                      <span className="text-xs text-ink-400 leading-relaxed font-normal">
                        Saya menyatakan bahwa seluruh data & dokumen yang diberikan adalah benar dan dapat dipertanggungjawabkan.
                      </span>
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className={`font-bold text-sm text-ink-400 px-4 sm:px-6 py-6 rounded-full hover:bg-ink/5 ${currentStep === 1 ? "invisible" : ""}`}
                >
                  ← Kembali
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="bg-sky hover:bg-sky-600 text-white font-bold text-sm px-6 sm:px-8 py-6 rounded-full shadow-lg shadow-sky/30 transition h-auto"
                >
                  {isSubmitting ? "Memproses..." : (currentStep === totalSteps ? "Kirim Pendaftaran" : "Lanjut →")}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
