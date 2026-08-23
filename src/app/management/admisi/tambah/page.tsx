"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  User,
  GraduationCap,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createNewAdmission } from "../actions";

const REGISTRATION_FEE = 1_000_000;

export default function TambahAdmisiPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    studentName: "",
    program: "Primary",
    gender: "Laki-laki",
    parentRelation: "Ayah",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    paymentAmount: REGISTRATION_FEE.toString(),
    paymentMethod: "Transfer BNI",
    paymentNote: "",
  });

  const update = (key: string, value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value || "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi
    const digitRegex = /^\d+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.studentName.trim() || !form.parentName.trim() || !form.parentPhone.trim() || !form.parentEmail.trim()) {
      setError("Harap lengkapi semua kolom yang diperlukan.");
      return;
    }
    if (form.parentPhone.length < 9 || !digitRegex.test(form.parentPhone.trim())) {
      setError("No HP / WhatsApp harus minimal 9 digit angka.");
      return;
    }
    if (!emailRegex.test(form.parentEmail.trim())) {
      setError("Format email orang tua tidak valid.");
      return;
    }

    setIsSubmitting(true);
    const result = await createNewAdmission({
      ...form,
      paymentAmount: parseInt(form.paymentAmount) || REGISTRATION_FEE,
    });
    setIsSubmitting(false);

    if (result.success && result.applicantId) {
      router.push(`/management/admisi/${result.applicantId}`);
    } else {
      setError(result.message || "Gagal membuat pendaftaran.");
    }
  };

  const programMap: Record<string, string> = {
    Preschool: "Preschool (PG/TK A)",
    Kindergarten: "Kindergarten (TK B)",
    Primary: "Primary School (SD)",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/admisi">
          <Button
            variant="outline"
            className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-sky transition-colors"
          >
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Pendaftaran Baru</h1>
          <p className="text-ink-400 text-sm">
            Buat slot pendaftaran untuk calon siswa yang sudah membayar.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Seksi 1: Informasi Pendaftaran */}
        <div className="bg-white rounded-3xl border border-ink/5 shadow-sm">
          <div className="flex items-center gap-3 px-8 py-5 border-b border-ink/5 bg-cloud/50 rounded-t-3xl">
            <div className="w-9 h-9 rounded-xl bg-sky/10 flex items-center justify-center">
              <User size={18} className="text-sky" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Informasi Pendaftaran</h2>
              <p className="text-xs text-ink-400">Data dasar calon siswa dan orang tua</p>
            </div>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            {/* Nama Siswa */}
            <div>
              <Label className="block text-sm font-bold mb-2">
                Nama Lengkap Siswa <span className="text-coral">*</span>
              </Label>
              <Input
                value={form.studentName}
                onChange={(e) => update("studentName", e.target.value)}
                placeholder="Nama sesuai akte kelahiran"
                className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky"
                required
              />
            </div>

            {/* Jenjang & Jenis Kelamin */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <Label className="block text-sm font-bold mb-2">
                  Jenjang Pendidikan <span className="text-coral">*</span>
                </Label>
                <Select
                  value={form.program}
                  onValueChange={(v) => update("program", v)}
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-cloud border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(programMap).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-bold mb-2">
                  Jenis Kelamin <span className="text-coral">*</span>
                </Label>
                <RadioGroup
                  value={form.gender}
                  onValueChange={(v) => update("gender", v)}
                  className="flex gap-4 mt-3"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="Laki-laki" />
                    <span className="text-sm font-semibold">Laki-laki</span>
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="Perempuan" />
                    <span className="text-sm font-semibold">Perempuan</span>
                  </Label>
                </RadioGroup>
              </div>
            </div>

            <div className="h-px bg-ink/5" />

            {/* Orang Tua */}
            <div>
              <Label className="block text-sm font-bold mb-2">
                Orang Tua yang Mendaftarkan <span className="text-coral">*</span>
              </Label>
              <RadioGroup
                value={form.parentRelation}
                onValueChange={(v) => update("parentRelation", v)}
                className="flex gap-4 mb-4"
              >
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="Ayah" />
                  <span className="text-sm font-semibold">Ayah</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="Ibu" />
                  <span className="text-sm font-semibold">Ibu</span>
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="block text-sm font-bold mb-2">
                Nama {form.parentRelation} <span className="text-coral">*</span>
              </Label>
              <Input
                value={form.parentName}
                onChange={(e) => update("parentName", e.target.value)}
                placeholder={`Nama lengkap ${form.parentRelation}`}
                className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label className="block text-sm font-bold mb-2">
                  No. HP / WhatsApp <span className="text-coral">*</span>
                </Label>
                <Input
                  value={form.parentPhone}
                  onChange={(e) => update("parentPhone", e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-bold mb-2">
                  Email <span className="text-coral">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => update("parentEmail", e.target.value)}
                  placeholder="email@contoh.com"
                  className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seksi 2: Informasi Pembayaran */}
        <div className="bg-white rounded-3xl border border-ink/5 shadow-sm">
          <div className="flex items-center gap-3 px-8 py-5 border-b border-ink/5 bg-gold-50/50 rounded-t-3xl">
            <div className="w-9 h-9 rounded-xl bg-gold-100 flex items-center justify-center">
              <CreditCard size={18} className="text-gold-600" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Informasi Pembayaran</h2>
              <p className="text-xs text-ink-400">Catat pembayaran biaya pendaftaran</p>
            </div>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            {/* Nominal info */}
            <div className="flex items-center justify-between bg-gold-50 rounded-2xl px-6 py-4 border border-gold-100">
              <div>
                <p className="text-xs font-bold text-gold-600 uppercase tracking-wide mb-1">
                  Biaya Pendaftaran
                </p>
                <p className="font-display text-2xl font-bold text-ink">
                  Rp 1.000.000
                </p>
              </div>
              <CheckCircle2 size={28} className="text-gold-400" />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <Label className="block text-sm font-bold mb-2">
                  Nominal yang Dibayarkan (Rp)
                </Label>
                <Input
                  type="number"
                  value={form.paymentAmount}
                  onChange={(e) => update("paymentAmount", e.target.value)}
                  placeholder="1000000"
                  className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky"
                />
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-bold mb-2">
                  Metode Pembayaran
                </Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) => update("paymentMethod", v)}
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-cloud border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer BNI">Transfer Bank BNI</SelectItem>
                    <SelectItem value="QRIS">QRIS</SelectItem>
                    <SelectItem value="Tunai">Tunai (Cash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Details */}
            {form.paymentMethod === "Transfer BNI" && (
              <div className="bg-cloud rounded-2xl p-5 border border-ink/5 mt-4">
                 <p className="text-sm font-bold text-ink mb-1">Tujuan Transfer BNI</p>
                 <p className="text-sm text-ink-400">No. Rekening: <span className="font-mono font-bold text-ink">1287361001</span></p>
                 <p className="text-sm text-ink-400">Atas Nama: <span className="font-bold text-ink">Jakarta Cosmopolite International School</span></p>
              </div>
            )}
            
            {form.paymentMethod === "QRIS" && (
              <div className="bg-cloud rounded-2xl p-5 border border-ink/5 mt-4 text-center">
                 <p className="text-sm font-bold text-ink mb-3">Scan QRIS</p>
                 <div className="flex justify-center">
                   <Image src="/publicjacos/finance/qr.png" alt="QRIS" width={250} height={250} className="rounded-xl shadow-sm" />
                 </div>
              </div>
            )}

            <div>
              <Label className="block text-sm font-bold mb-2">
                Keterangan (Opsional)
              </Label>
              <Textarea
                value={form.paymentNote}
                onChange={(e) => update("paymentNote", e.target.value)}
                placeholder="Catatan tambahan mengenai pembayaran..."
                className="rounded-2xl bg-cloud border-transparent focus-visible:border-sky resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-coral-50 border border-coral-100 text-coral px-5 py-4 rounded-2xl text-sm font-bold">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-2">
          <Link href="/management/admisi">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-6 rounded-xl font-bold text-ink-400 hover:text-ink hover:bg-cloud"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm"
          >
            {isSubmitting ? (
              "Membuat..."
            ) : (
              <>
                <Send size={18} className="mr-2" /> Buat &amp; Generate Link
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
