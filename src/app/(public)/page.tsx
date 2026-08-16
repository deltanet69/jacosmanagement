import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="w-full">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={180} height={50} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={180} height={50} className="hidden dark:block object-contain" />
        </div>
        {/* <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-ink-400">
          <Link href="#" className="hover:text-sky transition">Profile</Link>
          <Link href="#" className="hover:text-sky transition">Programs</Link>
          <Link href="#" className="hover:text-sky transition">News</Link>
          <Link href="#" className="text-sky">Admission</Link>
          <Link href="#" className="hover:text-sky transition">Contact</Link>
        </div> */}
        <Link href="/ppdb/daftar">
          <Button className="bg-gold hover:bg-gold-600 text-ink font-bold text-sm px-5 py-2.5 rounded-full shadow-sm transition h-auto">Apply Now</Button>
        </Link>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2790%27%20height=%2790%27%20viewBox=%270%200%2090%2090%27%3E%3Cg%20fill=%27none%27%20stroke=%27%232F6FED%27%20stroke-width=%271%27%20opacity=%270.08%27%3E%3Cpath%20d=%27M45%206%20L57%2027%20L81%2027%20L63%2041%20L71%2065%20L45%2051%20L19%2065%20L27%2041%20L9%2027%20L33%2027%20Z%27/%3E%3C/g%3E%3C/svg%3E')] bg-[length:90px_90px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 bg-coral-50 text-coral-600 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 mt-20">
              Online School Admission 2026/2027
            </span>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] mb-5">
              Tumbuh dalam iman,<br/><span className="text-sky">berkarakter</span> global.
            </h1>
            <p className="text-ink-400 text-lg leading-relaxed mb-8 max-w-md">
              JACOS memadukan nilai Islam, kurikulum global, dan teknologi modern — membentuk generasi cerdas, kreatif, dan siap bersaing di panggung dunia. Daftar hanya dalam 4 langkah, langsung dari HP.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/ppdb/daftar">
                <Button className="bg-sky hover:bg-sky-600 text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-sky/20 transition h-auto">Daftar Sekarang</Button>
              </Link>
              <Button variant="outline" className="flex items-center gap-2 font-bold text-ink px-2 py-3.5 rounded-full border-none shadow-none bg-transparent hover:bg-transparent group h-auto">
                <span className="w-9 h-9 rounded-full bg-white border-2 border-ink flex items-center justify-center group-hover:bg-ink group-hover:text-white transition">▶</span>
                Unduh Brosur
              </Button>
            </div>
            <div className="flex items-center gap-7 mt-10 mb-20 pt-8 border-t border-ink/10">
              <div><p className="font-display text-3xl text-sky">3</p><p className="text-md text-ink-300 font-medium">Bahasa pengantar</p></div>
              <div><p className="font-display text-3xl text-gold-600">A</p><p className="text-md text-ink-300 font-medium">Kurikulum terintegrasi</p></div>
              <div><p className="font-display text-3xl text-leaf-600">Global</p><p className="text-md text-ink-300 font-medium">Standar pendidikan</p></div>
            </div>
          </div>

          <div className="relative h-[440px] hidden lg:block">
            <div className="absolute inset-0 bg-sky-100" style={{borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%'}}></div>
            <div className="absolute top-6 left-4 w-36 h-36 bg-gold-100 opacity-90" style={{borderRadius: '63% 37% 39% 61% / 47% 41% 59% 53%'}}></div>
            <div className="absolute bottom-20 left-10 bg-white rounded-3xl shadow-xl p-4 w-56 -rotate-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-leaf-50 flex items-center justify-center text-leaf-600 font-bold">✓</span>
                <p className="font-bold text-sm">Dokumen Lengkap</p>
              </div>
              <p className="text-xs text-ink-300">KK, akte lahir & pas foto terverifikasi otomatis.</p>
            </div>
            <div className="absolute top-10 right-2 bg-white rounded-3xl shadow-xl p-4 w-48 rotate-6">
              <p className="text-xs text-ink-300 font-bold mb-1">Program tersedia</p>
              <p className="font-display text-lg text-sky">Primary School</p>
              <p className="text-[11px] text-ink-300 mt-0.5">Kindergarten segera hadir</p>
            </div>
            <div className="absolute bottom-4 right-8 w-24 h-24 bg-coral-100 flex items-center justify-center text-4xl" style={{borderRadius: '63% 37% 39% 61% / 47% 41% 59% 53%'}}>📖</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white shadow-2xl flex items-center justify-center text-5xl">🎓</div>
          </div>
        </div>
      </header>

      {/* PROGRAM PILLARS */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-lg mb-14">
            <span className="text-sky text-xs font-bold uppercase tracking-widest">Programs for outstanding generations</span>
            <h2 className="font-display text-3xl mt-3">Kurikulum yang menyeluruh, berlandaskan iman.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-3xl bg-sky-50 p-6">
              <div className="w-11 h-11 rounded-2xl bg-sky text-white flex items-center justify-center text-lg mb-5">📖</div>
              <p className="font-bold text-sm leading-snug">Islamic Integrated Curriculum, Qur'an & Hadist</p>
            </div>
            <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-3xl bg-gold-50 p-6">
              <div className="w-11 h-11 rounded-2xl bg-gold text-white flex items-center justify-center text-lg mb-5">🌐</div>
              <p className="font-bold text-sm leading-snug">Trilingual Mastery</p>
            </div>
            <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-3xl bg-coral-50 p-6">
              <div className="w-11 h-11 rounded-2xl bg-coral text-white flex items-center justify-center text-lg mb-5">🎨</div>
              <p className="font-bold text-sm leading-snug">Character Education & Play-Based Learning</p>
            </div>
            <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-3xl bg-leaf-50 p-6">
              <div className="w-11 h-11 rounded-2xl bg-leaf text-white flex items-center justify-center text-lg mb-5">💛</div>
              <p className="font-bold text-sm leading-snug">Social-Emotional Intelligent Development</p>
            </div>
            <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-3xl bg-ink/5 p-6">
              <div className="w-11 h-11 rounded-2xl bg-ink text-white flex items-center justify-center text-lg mb-5">👨‍👩‍👧</div>
              <p className="font-bold text-sm leading-snug">Family Program Enrichment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ADMISSION JOURNEY */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2790%27%20height=%2790%27%20viewBox=%270%200%2090%2090%27%3E%3Cg%20fill=%27none%27%20stroke=%27%232F6FED%27%20stroke-width=%271%27%20opacity=%270.08%27%3E%3Cpath%20d=%27M45%206%20L57%2027%20L81%2027%20L63%2041%20L71%2065%20L45%2051%20L19%2065%20L27%2041%20L9%2027%20L33%2027%20Z%27/%3E%3C/g%3E%3C/svg%3E')] bg-[length:90px_90px] pointer-events-none opacity-60"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="text-center max-w-xl mx-auto mb-26">
            <span className="text-sky text-xs font-bold uppercase tracking-widest">The JACOS journey</span>
            <h2 className="font-display text-3xl mt-3">Tiga tahap menuju keluarga besar JACOS.</h2>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
            <div className="hidden sm:block absolute top-8 left-[16%] right-[16%] h-0.5" style={{background: 'repeating-linear-gradient(90deg, #D3E3FF 0 8px, transparent 8px 16px)'}}></div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-sky text-white flex items-center justify-center text-2xl shadow-lg shadow-sky-100 mb-5 z-10">📝</div>
              <p className="font-bold text-LG mb-2">Application & Assessment</p>
              <p className="text-md text-ink-300 max-w-[330px]">Isi formulir online, lalu ikuti sesi Class Trial & Observation bersama tim kami.</p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold text-white flex items-center justify-center text-2xl shadow-lg shadow-gold-100 mb-5 z-10">📩</div>
              <p className="font-bold text-LG mb-2">Assessment & Policy Review</p>
              <p className="text-md text-ink-300 max-w-[330px]">Pengumuman hasil lewat email, dilanjutkan tinjauan Parent Handbook JACOS.</p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-leaf text-white flex items-center justify-center text-2xl shadow-lg shadow-leaf-100 mb-5 z-10">🎉</div>
              <p className="font-bold text-LG mb-2">Final Enrollment & Welcome</p>
              <p className="text-md text-ink-300 max-w-[330px]">Lengkapi administrasi & pembayaran — resmi bergabung dengan keluarga JACOS.</p>
            </div>
          </div>
          <div className="text-center mt-14">
            <span className="inline-block bg-sky-50 text-sky text-md font-bold px-4 py-2 rounded-full">Langkah 1 di atas dimulai lewat formulir online di bawah ini ↓</span>
          </div>
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid md:grid-cols-3 gap-6">
        <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-sky-50 rounded-[2rem] p-8">
          <div className="w-12 h-12 rounded-2xl bg-sky text-white flex items-center justify-center text-xl mb-6">🎂</div>
          <h3 className="font-display text-lg mb-2">Age Eligibility</h3>
          <p className="text-md text-ink-400 leading-relaxed">Usia anak harus sesuai jenjang per 1 Juli, agar tumbuh bersama kelompok sebaya yang mendukung.</p>
        </div>
        <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-gold-50 rounded-[2rem] p-8">
          <div className="w-12 h-12 rounded-2xl bg-gold text-white flex items-center justify-center text-xl mb-6">📅</div>
          <h3 className="font-display text-lg mb-2">Enrollment Sepanjang Tahun</h3>
          <p className="text-md text-ink-400 leading-relaxed">Penempatan kelas ditentukan berdasarkan usia & tahap perkembangan anak, dibuka sepanjang tahun.</p>
        </div>
        <div className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-coral-50 rounded-[2rem] p-8">
          <div className="w-12 h-12 rounded-2xl bg-coral text-white flex items-center justify-center text-xl mb-6">💬</div>
          <h3 className="font-display text-lg mb-2">Butuh Bantuan?</h3>
          <p className="text-md text-ink-400 leading-relaxed">Hubungi kami di 0821-4000-0477 atau admission@jacos.id — tim kami siap membantu.</p>
        </div>
      </section>

      <footer className="bg-ink text-white/70 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>© 2026 Jakarta Cosmopolite Islamic School</p>
          <p>Jl. Swadaya Raya Rt.08 Rw.01 No.2, Duren Sawit, Jakarta Timur</p>
        </div>
      </footer>
    </div>
  );
}
