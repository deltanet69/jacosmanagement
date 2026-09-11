"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  User, 
  PiggyBank, 
  KeyRound, 
  HelpCircle, 
  LogOut, 
  ExternalLink,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { createParentClient } from "@/lib/supabase/client";
import { getCompleteStudentProfile } from "@/app/parent-portal/server-actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function ParentTopNav() {
  const [userName, setUserName] = useState("Orang Tua");
  const [student, setStudent] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createParentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const user = session.user;
        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        const studentIdMeta = user.user_metadata?.student_id;
        const email = user.email;

        const res = await getCompleteStudentProfile(email, studentIdMeta);
        if (res.success) {
          if (res.student) {
            setStudent(res.student);
          } else if (res.applicant) {
            setStudent({
              full_name: res.applicant.student_name,
              nis: res.applicant.nisn || "-",
              school_classes: null,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching ParentTopNav profile:", err);
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const isSubdomain = window.location.hostname.startsWith("parent.");
    router.push(isSubdomain ? "/login" : "/parent-portal/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "OT";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const studentName = student?.full_name || "Siswa JACOS";
  const studentInitials = getInitials(studentName);
  const className = Array.isArray(student?.school_classes)
    ? student?.school_classes[0]?.name
    : student?.school_classes?.name || "Kelas Aktif";

  return (
    <header className="h-20 lg:h-20 bg-white/90 backdrop-blur-md border-b border-ink/5 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
      {/* LEFT AREA */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand Logo */}
        <Link href="/parent-portal" className="flex items-center gap-2 lg:hidden">
          <Image 
            src="/publicjacos/logo.png" 
            alt="JACOS Logo" 
            width={120} 
            height={38} 
            style={{ width: "auto", height: "38px" }} 
            className="dark:hidden object-contain" 
            priority
          />
          <Image 
            src="/publicjacos/logoputih.png" 
            alt="JACOS Logo" 
            width={120} 
            height={38} 
            style={{ width: "auto", height: "38px" }} 
            className="hidden dark:block object-contain" 
            priority
          />
        </Link>

        {/* Desktop Greeting */}
        <div className="hidden lg:block">
          <p className="text-xs font-bold text-ink-300 uppercase tracking-wider">Selamat Datang,</p>
          <h2 className="text-base font-bold text-ink truncate max-w-sm">{userName}</h2>
        </div>
      </div>

      {/* RIGHT AREA */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Notification / Info Link */}
        <Link 
          href="/parent-portal/informasi"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-cloud active:scale-95 transition-all text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky"
          aria-label="Pengumuman & Notifikasi"
        >
          <Bell size={19} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-coral border-2 border-white"></span>
        </Link>

        <div className="h-6 w-px bg-ink/10 hidden sm:block"></div>

        {/* Profile Sheet Trigger (Accessible on Mobile & Desktop) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-2xl hover:bg-cloud/80 border border-ink/5 sm:border-ink/10 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky cursor-pointer"
            aria-label="Buka Menu Akun & Layanan Siswa"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky to-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              {studentInitials}
            </div>
            <div className="hidden sm:block text-right pr-1">
              <p className="text-xs font-bold text-ink leading-tight truncate max-w-[130px]">{studentName}</p>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wider">{className}</p>
            </div>
          </SheetTrigger>

          <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm p-0 flex flex-col bg-white">
            <SheetHeader className="p-6 border-b border-ink/5 text-left">
              <SheetTitle className="text-base font-bold text-ink">Akun & Layanan Siswa</SheetTitle>
              <p className="text-xs text-ink-400">Kelola profil siswa, tabungan, dan pengaturan akun.</p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Student Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky/15 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {studentInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Sparkles size={10} /> Siswa Aktif
                      </span>
                    </div>
                    <h3 className="font-bold text-ink text-sm truncate mt-1">{studentName}</h3>
                    <p className="text-xs text-ink-400">{className}</p>
                  </div>
                </div>

                <Link
                  href="/parent-portal/profil-siswa"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-sky/20 text-sky text-xs font-bold shadow-2xs hover:bg-sky-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <User size={15} />
                    Lihat Profil & Kartu Pelajar
                  </span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Quick Navigation Items */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-ink-300 uppercase tracking-wider px-2 mb-2">
                  Layanan Terintegrasi
                </p>

                <Link
                  href="/parent-portal/tabungan"
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                    pathname.startsWith("/parent-portal/tabungan")
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-ink hover:bg-cloud hover:text-ink font-semibold text-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <PiggyBank size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Buku Tabungan Siswa</p>
                      <p className="text-[10.5px] text-ink-400 font-normal">Pantau saldo & setor tabungan</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-ink-300" />
                </Link>

                <Link
                  href="/parent-portal/change-password"
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                    pathname.startsWith("/parent-portal/change-password")
                      ? "bg-sky-50 text-sky font-bold"
                      : "text-ink hover:bg-cloud hover:text-ink font-semibold text-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky flex items-center justify-center">
                      <KeyRound size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Ganti Password</p>
                      <p className="text-[10.5px] text-ink-400 font-normal">Keamanan & kata sandi akun</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-ink-300" />
                </Link>

                <a
                  href="https://wa.me/628123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl text-ink hover:bg-cloud font-semibold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Bantuan Sekolah</p>
                      <p className="text-[10.5px] text-ink-400 font-normal">Hubungi tata usaha / admin</p>
                    </div>
                  </div>
                  <ExternalLink size={13} className="text-ink-300" />
                </a>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="p-5 border-t border-ink/5 bg-cloud/30">
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-coral-50 hover:bg-coral-100 text-coral-600 font-bold text-xs transition active:scale-98"
              >
                <LogOut size={15} />
                Keluar dari Portal
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
