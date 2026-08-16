"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await login(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-ink/10 p-8">
        <div className="flex justify-center mb-8">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={140} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </div>
        
        <h1 className="font-display text-2xl font-bold text-center mb-2">Login ke Dashboard</h1>
        <p className="text-ink-400 text-sm text-center mb-8">Masukkan email dan password Anda untuk masuk ke sistem manajemen JACOS.</p>

        <form action={formAction} className="space-y-5">
          <div>
            <Label className="block text-sm font-bold mb-2">Email</Label>
            <Input 
              name="email" 
              type="email" 
              placeholder="admin@jacos.id" 
              className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
              required 
            />
          </div>
          <div>
            <Label className="block text-sm font-bold mb-2">Password</Label>
            <Input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
              required 
            />
          </div>

          {state?.error && (
            <p className="text-sm font-bold text-coral bg-coral-50 px-4 py-3 rounded-xl">
              {state.error}
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl shadow-sm mt-4"
            disabled={isPending}
          >
            {isPending ? "Memeriksa..." : "Masuk Sekarang"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-bold text-ink-400 hover:text-sky transition-colors">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
