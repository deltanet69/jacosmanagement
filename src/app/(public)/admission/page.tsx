import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  KeyRound,
  FileCheck2,
  GraduationCap,
  Download,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Online Admission Guide | Jakarta Cosmopolite Islamic School",
  description:
    "Learn how to apply for JACOS Online Admission. Connect with our Admissions Advisor to receive your secure private registration link.",
};

export default function OnlineAdmissionGuidePage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-ink selection:bg-sky/20 selection:text-sky relative overflow-hidden font-sans pb-20">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-sky/15 via-sky/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-gold/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[15%] left-[-10%] w-[600px] h-[600px] bg-leaf/10 blur-[130px] pointer-events-none -z-10" />

      {/* Background dot watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#2F6FED_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 1. TOP NAVBAR                                            */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={140}
              height={38}
              className="dark:hidden object-contain"
              priority
            />
            <Image
              src="/publicjacos/logoputih.png"
              alt="JACOS Logo"
              width={140}
              height={38}
              className="hidden dark:block object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white transition active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>

            <Link
              href="/openhouse"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-extrabold border border-gold-200 hover:bg-gold-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Open House 2026
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN CONTAINER & HERO                                 */}
      {/* ======================================================== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
        {/* Header Title Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky text-xs font-extrabold border border-sky-100 shadow-xs uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            JACOS Online Admission Guide
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
            How to Apply for Online Admission
          </h1>

          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            To provide a thoughtful, personalized experience for every prospective family,
            admissions at JACOS are conducted via <strong>secure, personalized registration links</strong> issued
            directly by our Admissions Team.
          </p>
        </section>

        {/* ======================================================== */}
        {/* 3. STEP-BY-STEP ADMISSION PROCESS (BENTO CARDS)          */}
        {/* ======================================================== */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-2xl shadow-sky-950/5 p-6 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                4 Easy Steps to Complete Your Application
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Follow this simple roadmap to start your child’s educational journey at JACOS.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-sky-50 text-sky text-xs font-bold font-mono">
              Academic Year 2026/2027
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Step 1 Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-50/60 via-white to-slate-50 border border-sky-100 space-y-3 relative group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-sky text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                  1
                </span>
                <span className="text-[10px] font-extrabold uppercase text-sky bg-sky-100/70 px-2.5 py-1 rounded-full">
                  Step 1 • Initial Contact
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Connect with Admissions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Contact our friendly Admissions Counselor via WhatsApp or telephone to discuss your child's age eligibility, learning goals, and program options.
              </p>
            </div>

            {/* Step 2 Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-gold-50/60 via-white to-slate-50 border border-gold-100 space-y-3 relative group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-gold-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                  2
                </span>
                <span className="text-[10px] font-extrabold uppercase text-gold-700 bg-gold-100/70 px-2.5 py-1 rounded-full">
                  Step 2 • Private Link
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Receive Personalized Link
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our Admissions Team generates your dedicated applicant profile and sends your unique, private registration link directly to your WhatsApp and Email.
              </p>
            </div>

            {/* Step 3 Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-leaf-50/60 via-white to-slate-50 border border-leaf-100 space-y-3 relative group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-leaf-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                  3
                </span>
                <span className="text-[10px] font-extrabold uppercase text-leaf-700 bg-leaf-100/70 px-2.5 py-1 rounded-full">
                  Step 3 • Online Form
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Fill Form &amp; Upload Files
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Open your personalized link on any mobile or desktop device. Fill in student biodata, parent contact info, and upload supporting documents seamlessly.
              </p>
            </div>

            {/* Step 4 Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/60 via-white to-slate-50 border border-purple-100 space-y-3 relative group hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                  4
                </span>
                <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-full">
                  Step 4 • Observation &amp; Portal
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Trial Session &amp; Enrollment
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Attend the playful student observation session, receive your formal acceptance letter, and obtain direct credentials to the official JACOS Parent Portal.
              </p>
            </div>
          </div>

          {/* Direct CTA Action Button */}
          <div className="pt-4 space-y-3 text-center">
            <a
              href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20ingin%20mendaftar%20Online%20Admission%20JACOS%20untuk%20anak%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 h-14 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-extrabold text-base shadow-xl shadow-green-500/25 transition cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              <span>Contact Admissions Advisor via WhatsApp</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-xs text-slate-400">
              Instant response during school office hours (Mon – Fri, 08:00 – 16:00 WIB).
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. HELPFUL ADMISSION INFO BENTO GRID                     */}
        {/* ======================================================== */}
        <section className="grid sm:grid-cols-3 gap-5">
          {/* Card 1: Age Eligibility */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-display text-base font-bold text-ink">Age Eligibility</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Preschool (2–3 y.o), Kindergarten (4–6 y.o), and Primary School (6+ y.o as of July 1st) to ensure developmental readiness.
            </p>
          </div>

          {/* Card 2: Required Documents */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="font-display text-base font-bold text-ink">Required Documents</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prepare digital copies / clear photos of: Birth Certificate (Akta), Family Card (KK), Parent's ID (KTP), and Recent 3x4 Photo.
            </p>
          </div>

          {/* Card 3: Free Brochure Download */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-display text-base font-bold text-ink">Curriculum Brochure</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download the complete JACOS Primary School curriculum overview in PDF.
              </p>
            </div>

            <a
              href="/jacos-primary.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-sky hover:text-sky-600 pt-2 border-t border-slate-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Brochure</span>
            </a>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. OPEN HOUSE INVITATION STRIP                           */}
        {/* ======================================================== */}
        <section className="rounded-3xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 p-6 sm:p-8 text-white shadow-xl shadow-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider">
              Experience JACOS In-Person
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold">
              Join the JACOS Open House 2026
            </h3>
            <p className="text-xs sm:text-sm text-white/90">
              Saturday, 29 Aug &amp; Sunday, 30 Aug 2026 • Free Trial Class &amp; School Tour
            </p>
          </div>

          <Link
            href="/openhouse"
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-gold-800 font-extrabold text-xs sm:text-sm shadow-md active:scale-[0.98] transition flex items-center gap-2"
          >
            <span>Register for Open House</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-400 space-y-2 pt-6">
          <p>
            Jakarta Cosmopolite Islamic School (JACOS) • Jl. Swadaya Raya Rt.08 Rw.01 No.2, Duren Sawit, Jakarta Timur
          </p>
          <p>© {new Date().getFullYear()} Jakarta Cosmopolite Islamic School. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
}
