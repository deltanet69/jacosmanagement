import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import GuestbookForm from "./guestbook-form";

export const metadata = {
  title: "Buku Tamu Kunjungan Sekolah - JACOS (Jakarta Cosmopolite Islamic School)",
  description: "Formulir digital buku tamu kunjungan sekolah, konsultasi admisi, dan pendaftaran siswa baru JACOS.",
};

export default function GuestbookPage() {
  return (
    <div className="min-h-screen bg-cloud text-ink font-body selection:bg-sky selection:text-white">
      {/* Decorative backdrop gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-gold-50/20 to-transparent opacity-80" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gold-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 bg-coral-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-leaf-100/30 rounded-full blur-3xl" />
      </div>

      {/* Floating Modern Header */}
      <header className="relative z-20 border-b border-ink/5 bg-white/85 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={130}
              height={36}
              style={{ width: "auto", height: "auto" }}
              priority
              className="object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles size={12} className="text-gold" />
              <span>Campus Visit Form</span>
            </div>

            <a
              href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20Admisi%20JACOS,%20saya%20ingin%20konsultasi%20jadwal%20kunjungan%20sekolah."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white px-3.5 py-1.5 rounded-full transition-all"
            >
              <MessageSquare size={14} />
              <span>Tanya Admin</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">
        <GuestbookForm />
      </main>
    </div>
  );
}
