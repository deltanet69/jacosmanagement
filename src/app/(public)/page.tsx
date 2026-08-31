import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Download,
  BookOpen,
  Globe2,
  HeartHandshake,
  Smile,
  Users2,
  Calendar,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Building2,
  Compass,
  FileCheck2,
  Clock,
  ChevronRight,
  GraduationCap,
  Layers,
  MapPin,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "JACOS Online Admission | Jakarta Cosmopolite Islamic School",
  description:
    "Join Jakarta Cosmopolite Islamic School (JACOS) - Nurturing Faith, Inspiring Global Character. Online Admission for Preschool, Kindergarten, and Primary School.",
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8faff] via-[#eef4ff] to-[#f8faff] text-ink selection:bg-sky/20 selection:text-sky relative overflow-hidden font-sans">
      {/* Ambient background mesh glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1300px] h-[650px] bg-gradient-to-b from-sky/15 via-sky/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-10%] w-[550px] h-[550px] bg-gold/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[15%] left-[-10%] w-[600px] h-[600px] bg-leaf/10 blur-[140px] pointer-events-none -z-10" />

      {/* Subtle geometric dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#2F6FED_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION                                        */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/publicjacos/logo.png"
              alt="JACOS Logo"
              width={160}
              height={44}
              className="dark:hidden object-contain transition group-hover:opacity-90"
              priority
            />
            <Image
              src="/publicjacos/logoputih.png"
              alt="JACOS Logo"
              width={160}
              height={44}
              className="hidden dark:block object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#pillars" className="hover:text-sky transition-colors">
              Our Pillars
            </a>
            <a href="#programs" className="hover:text-sky transition-colors">
              Programs
            </a>
            <a href="#journey" className="hover:text-sky transition-colors">
              Admission Flow
            </a>
            <a href="#campus" className="hover:text-sky transition-colors">
              Campus Life
            </a>
            <Link
              href="/openhouse"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-xs font-extrabold border border-gold-200/80 hover:bg-gold-100/70 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Open House 2026
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/parent-portal"
              className="hidden sm:inline-flex items-center justify-center text-xs font-bold text-slate-600 hover:text-sky px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white transition"
            >
              Parent Portal
            </Link>
            <Link href="/admission">
              <Button className="bg-sky hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg shadow-sky/25 transition active:scale-[0.98] h-auto cursor-pointer">
                Apply Now
                <ArrowRight className="w-4 h-4 ml-1.5 hidden sm:inline" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copywriting & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky text-xs font-extrabold border border-sky-100 shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Online School Admission 2026/2027
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl font-extrabold text-ink tracking-tight leading-[1.08]">
              Nurturing Faith, <br className="hidden sm:inline" />
              <span className="text-sky">Inspiring Global Character.</span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Jakarta Cosmopolite Islamic School (JACOS) harmonizes authentic Islamic values,
              trilingual immersion, and global academic excellence — cultivating visionary,
              morally upright young Muslim leaders. Complete your admission seamlessly online in 4 steps.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link href="/admission">
                <Button className="h-13 px-7 rounded-2xl bg-sky hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky/25 transition flex items-center gap-2 cursor-pointer">
                  <span>Start Online Admission</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <a
                href="/jacos-primary.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="h-13 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-sm sm:text-base shadow-xs active:scale-[0.98] transition flex items-center gap-2.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky" />
                <span>Download Brochure (PDF)</span>
              </a>
            </div>

            {/* Trust Highlights Bento Strip */}
            <div className="grid grid-cols-3 gap-3 pt-6 sm:pt-8 border-t border-slate-200/70 max-w-xl mx-auto lg:mx-0">
              <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/70 text-left">
                <p className="font-display text-2xl sm:text-3xl font-black text-sky">3</p>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Languages of Instruction
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/70 text-left">
                <p className="font-display text-2xl sm:text-3xl font-black text-gold-600">A</p>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Integrated Curriculum
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/70 text-left">
                <p className="font-display text-2xl sm:text-3xl font-black text-leaf-600">100%</p>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Islamic Value Integration
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Bento Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-2xl shadow-sky-950/10 p-6 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Visual Header */}
                <div className="relative h-56 rounded-3xl overflow-hidden bg-sky-50 border border-slate-100">
                  <Image
                    src="/publicjacos/campus/building.png"
                    alt="JACOS Campus"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-bold text-sky-200">
                        Campus Environment
                      </p>
                      <p className="font-display font-extrabold text-lg leading-tight">
                        Modern Islamic Learning Space
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
                      Duren Sawit, JKT
                    </span>
                  </div>
                </div>

                {/* Micro Bento Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky">
                      <GraduationCap className="w-4 h-4" />
                      Academic Levels
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Preschool, KG &amp; Primary
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-leaf-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Fast Verification
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Direct Parent Portal Access
                    </p>
                  </div>
                </div>

                {/* Open House Invitation Card */}
                <div className="rounded-2xl bg-gradient-to-r from-gold-50 via-amber-50 to-gold-50/60 border border-gold-200 p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-gold-700 bg-gold-100/80 px-2 py-0.5 rounded-md">
                      Special Invitation
                    </span>
                    <p className="font-bold text-sm text-ink mt-1">JACOS Open House 2026</p>
                    <p className="text-xs text-slate-500">29 &amp; 30 August 2026 • Free Trial Class</p>
                  </div>
                  <Link
                    href="/openhouse"
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    RSVP Now
                  </Link>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-2.5 hidden sm:flex items-center gap-2.5 animate-bounce duration-1000">
                <span className="w-7 h-7 rounded-full bg-leaf-50 text-leaf-600 flex items-center justify-center font-bold text-sm">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-extrabold text-ink leading-tight">Accredited</p>
                  <p className="text-[10px] text-slate-400">Global Trilingual Standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CORE EDUCATIONAL PILLARS (BENTO GRID)                 */}
      {/* ======================================================== */}
      <section id="pillars" className="py-20 bg-white border-y border-slate-200/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-sky font-extrabold text-xs uppercase tracking-widest">
              Our Core Philosophy
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Holistic Education Rooted in Islamic Values
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              We cultivate well-rounded students who excel intellectually, embody noble Islamic adab,
              and navigate a connected global world with confidence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-3xl bg-sky-50/60 border border-sky-100 hover:border-sky-300 transition-all hover:shadow-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-sky text-white flex items-center justify-center font-bold shadow-md shadow-sky/20 group-hover:scale-105 transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Islamic Integrated Curriculum &amp; Qur'an
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Daily Qur'an recitation with Tahsin &amp; Tahfidz, authentic Hadith exploration,
                and practical Sunnah habituation woven into every academic subject.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-3xl bg-gold-50/60 border border-gold-100 hover:border-gold-300 transition-all hover:shadow-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-gold-600 text-white flex items-center justify-center font-bold shadow-md shadow-gold/20 group-hover:scale-105 transition">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Trilingual Immersion Program
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seamless daily communication in English, Arabic, and Bahasa Indonesia to develop natural
                multilingual fluency, global worldview, and cross-cultural adaptability.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-3xl bg-leaf-50/60 border border-leaf-100 hover:border-leaf-300 transition-all hover:shadow-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-leaf-600 text-white flex items-center justify-center font-bold shadow-md shadow-leaf/20 group-hover:scale-105 transition">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                STEAM &amp; Inquiry-Based Learning
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hands-on science, technology, engineering, arts, and mathematics projects designed
                to trigger curiosity, critical problem-solving, and innovative thinking.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-7 rounded-3xl bg-rose-50/60 border border-rose-100 hover:border-rose-300 transition-all hover:shadow-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose/20 group-hover:scale-105 transition">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Social-Emotional &amp; Moral Intelligence
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nurturing empathy, self-regulation, respect, and collaborative leadership through
                mindful peer interaction and character coaching.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="p-7 rounded-3xl bg-purple-50/60 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg space-y-4 group sm:col-span-2 lg:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple/20 group-hover:scale-105 transition">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Collaborative Family &amp; School Partnership
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                We believe parents are primary partners in education. Transparent learning logs,
                parent workshops, and direct digital insights through our dedicated Parent Portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. ACADEMIC PROGRAMS SECTION                             */}
      {/* ======================================================== */}
      <section id="programs" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-sky font-extrabold text-xs uppercase tracking-widest">
              Educational Pathways
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Jacos Programs for Every Age
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              From early sensory exploration to comprehensive primary school foundations,
              JACOS supports your child’s developmental milestones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Program 1: Preschool */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-lg p-7 flex flex-col justify-between space-y-6 hover:border-sky-300 transition group">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky text-xs font-bold uppercase tracking-wider">
                  Ages 2 – 3 Years
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">Preschool</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Focusing on sensory discovery, emotional security, fitrah awakening, and positive
                  first experiences with school life.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky shrink-0" />
                    Sensory &amp; fine motor development
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky shrink-0" />
                    Basic Islamic adab &amp; prayers habituation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky shrink-0" />
                    Bilingual vocabulary exposure
                  </li>
                </ul>
              </div>
              <Link href="/admission">
                <Button className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-sky hover:text-white text-slate-700 font-bold text-xs transition active:scale-[0.98]">
                  Apply for Preschool
                </Button>
              </Link>
            </div>

            {/* Program 2: Kindergarten */}
            <div className="bg-white rounded-[2.5rem] border-2 border-gold-300 shadow-xl p-7 flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-gold-600 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-2xl">
                Popular
              </div>
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-xs font-bold uppercase tracking-wider">
                  TK A &amp; TK B (Ages 4 – 6)
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">Kindergarten</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Play-based learning cultivating early literacy, numeracy, Arabic-English immersion,
                  and Islamic character building.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />
                    Early phonics &amp; mathematical logic
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />
                    Juz 'Amma short surah memorization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />
                    Creative project &amp; science experiments
                  </li>
                </ul>
              </div>
              <Link href="/admission">
                <Button className="w-full h-12 rounded-2xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-xs transition active:scale-[0.98]">
                  Apply for Kindergarten
                </Button>
              </Link>
            </div>

            {/* Program 3: Primary School */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-lg p-7 flex flex-col justify-between space-y-6 hover:border-sky-300 transition group">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-bold uppercase tracking-wider">
                  Grade 1 – 6 (Ages 6 – 12)
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">Primary School</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Rigorous global academic standards, Quranic fluency, STEAM competencies,
                  and leadership readiness for secondary education.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf-600 shrink-0" />
                    Trilingual academic instruction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf-600 shrink-0" />
                    Qur'an Tahfidz &amp; Islamic studies
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf-600 shrink-0" />
                    Robotics, coding, &amp; science lab modules
                  </li>
                </ul>
              </div>
              <Link href="/admission">
                <Button className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-sky hover:text-white text-slate-700 font-bold text-xs transition active:scale-[0.98]">
                  Apply for Primary School
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CLEAR 4-STEP ADMISSION JOURNEY                        */}
      {/* ======================================================== */}
      <section id="journey" className="py-20 bg-white border-y border-slate-200/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-sky font-extrabold text-xs uppercase tracking-widest">
              Simple &amp; Transparent
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Your 4-Step Admission Journey
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              We have streamlined the application process so prospective parents can register easily
              from any smartphone or laptop.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-2xl bg-sky text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                1
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Inquiry &amp; Consultation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with our Admission Team via WhatsApp or attend the JACOS Open House to explore
                our curriculum and campus.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-2xl bg-gold-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                2
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Online Form &amp; Documents
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive your secure private registration link. Fill in student &amp; parent profiles,
                and upload supporting documents.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-2xl bg-leaf-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                3
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Observation &amp; Trial Class
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your child participates in a fun, supportive trial class and readiness observation
                with our certified educators.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 relative">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                4
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Welcome &amp; Parent Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive the formal acceptance letter, settle tuition digitally, and gain instant access
                to the official JACOS Parent Portal.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/admission">
              <Button className="h-13 px-8 rounded-2xl bg-sky hover:bg-sky-600 text-white font-extrabold text-sm shadow-lg shadow-sky/25 transition active:scale-[0.98]">
                Get Started with Step 1 Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CAMPUS & FACILITIES HIGHLIGHT                         */}
      {/* ======================================================== */}
      <section id="campus" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-sky font-extrabold text-xs uppercase tracking-widest">
              Campus Environment
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Designed for Inspiring Learning
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Safe, air-conditioned, technology-equipped facilities nurturing intellectual curiosity
              and physical well-being.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Interactive Classrooms",
                desc: "Bright, ergonomic, smart-screen equipped spaces.",
                img: "/publicjacos/campus/classroom.png",
              },
              {
                title: "Trilingual Library",
                desc: "Extensive collections of Arabic, English, and local literature.",
                img: "/publicjacos/campus/library.png",
              },
              {
                title: "Sports & Movement Area",
                desc: "Futsal, archery, and physical fitness grounds.",
                img: "/publicjacos/campus/sports.png",
              },
              {
                title: "Outdoor Green Zones",
                desc: "Natural sensory gardens and creative play spaces.",
                img: "/publicjacos/campus/outdoor.png",
              },
            ].map((facility, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition group"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <Image
                    src={facility.img}
                    alt={facility.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5 space-y-1">
                  <h4 className="font-display font-bold text-base text-ink">{facility.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{facility.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. BROCHURE DOWNLOAD & FINAL CALL-TO-ACTION              */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 text-white shadow-2xl shadow-sky-950/20 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                Admissions Now Open • Academic Year 2026/2027
              </span>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Give Your Child the Foundation of Faith &amp; Global Excellence.
              </h2>

              <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-2xl">
                Download the official JACOS Primary School curriculum brochure or start a direct
                consultation with our Admission Advisors today.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/admission">
                  <Button className="h-13 px-8 rounded-2xl bg-white hover:bg-slate-100 text-sky-800 font-extrabold text-sm sm:text-base shadow-xl transition active:scale-[0.98]">
                    Apply for Admission
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <a
                  href="/jacos-primary.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-13 px-6 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold text-sm sm:text-base transition active:scale-[0.98] flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Brochure
                </a>

                <a
                  href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20ingin%20berkonsultasi%20mengenai%20Pendaftaran%20Online%20Admission%20JACOS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-13 px-6 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-green-500/20 transition active:scale-[0.98] flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp Admission Advisor
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="bg-slate-900 text-slate-400 py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2 space-y-4">
              <Image
                src="/publicjacos/logoputih.png"
                alt="JACOS Logo"
                width={160}
                height={45}
                className="object-contain"
              />
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Jakarta Cosmopolite Islamic School (JACOS) delivers faith-rooted, trilingual
                Islamic education preparing children for both Dunya and Akhirah excellence.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <MapPin className="w-4 h-4 text-sky shrink-0" />
                Jl. Swadaya Raya Rt.08 Rw.01 No.2, Duren Sawit, Jakarta Timur
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                Admissions &amp; Events
              </p>
              <ul className="text-xs space-y-2">
                <li>
                  <Link href="/admission" className="hover:text-white transition">
                    Apply Online
                  </Link>
                </li>
                <li>
                  <Link href="/openhouse" className="hover:text-white transition">
                    Open House 2026 Registration
                  </Link>
                </li>
                <li>
                  <a href="/jacos-primary.pdf" target="_blank" className="hover:text-white transition">
                    Download School Brochure
                  </a>
                </li>
                <li>
                  <Link href="/parent-portal" className="hover:text-white transition">
                    Parent Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                Get in Touch
              </p>
              <ul className="text-xs space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-sky" />
                  <span>WhatsApp: 0821-4000-0477</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sky" />
                  <span>Email: admission@jacos.id</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky" />
                  <span>Mon – Fri: 08.00 – 16.00 WIB</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Jakarta Cosmopolite Islamic School. All Rights Reserved.</p>
            <p>Empowering Faith, Knowledge, and Character.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
