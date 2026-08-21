"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await login(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex">
      {/* LEFT — School Photo Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/publicjacos/bglogin.jpeg"
          alt="JACOS School Building"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/80 via-sky-800/60 to-transparent" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Image
              src="/publicjacos/logoputih.png"
              alt="JACOS Logo"
              width={140}
              height={40}
              className="object-contain"
            />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
              <ShieldCheck size={14} className="text-sky-200" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                ADMIN MANAGEMENT SYSTEM
              </span>
            </div>
            <h1 className="font-display text-4xl font-black text-white leading-tight">
              Selamat Datang<br />di JACOS Dashboard
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Kelola data siswa, pendaftaran, keuangan, dan operasional sekolah dalam satu platform terintegrasi.
            </p>
          </div>

          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Jakarta Cosmopolite Islamic School. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT — Login Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50/50 p-6 relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-100 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={120} height={36} className="object-contain" />
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-sky/5 border border-white p-8 space-y-6">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-sky/10 flex items-center justify-center mb-4">
                <ShieldCheck size={20} className="text-sky-600" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-800">
                Login Admin
              </h2>
              <p className="text-slate-500 text-sm">
                Masukkan kredensial Anda untuk mengakses dashboard.
              </p>
            </div>

            <form action={formAction} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  Email
                </Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="admin@jacos.id"
                  className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky/20 text-slate-800 placeholder:text-slate-400 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  Password
                </Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-sky focus-visible:ring-2 focus-visible:ring-sky/20 text-slate-800 placeholder:text-slate-400 transition-all"
                  required
                />
              </div>

              {state?.error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-600">{state.error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl shadow-md shadow-sky/25 transition-all hover:shadow-lg hover:shadow-sky/30 hover:-translate-y-0.5 active:translate-y-0 mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Memeriksa...
                  </span>
                ) : (
                  "Masuk ke Dashboard →"
                )}
              </Button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
