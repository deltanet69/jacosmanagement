"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createParentClient } from '@/lib/supabase/client'
import { Users, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createParentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const user = data.user
      const isSubdomain = window.location.hostname.startsWith('parent.')
      const isFirstLogin = user?.user_metadata?.first_login === true

      // Cek status approval dari DB secara realtime
      let isApprovedInDB = false
      if (user?.email) {
        const { data: guardians } = await supabase
          .from('guardians')
          .select('applicant_id, applicants(status, student_record_id)')
          .ilike('email', user.email)
          .limit(1)
        
        const applicant = (guardians?.[0] as any)?.applicants
        if (applicant?.status === 'ENROLLED' || applicant?.student_record_id) {
          isApprovedInDB = true
        }
      }

      // Jika sudah approved di DB, langsung ke dashboard tanpa paksa ganti password
      if (isApprovedInDB) {
        router.push(isSubdomain ? '/' : '/parent-portal')
        return
      }

      // Jika belum approved dan ini first_login, minta ganti password dulu
      if (isFirstLogin) {
        router.push(isSubdomain ? '/change-password' : '/parent-portal/change-password')
      } else {
        router.push(isSubdomain ? '/' : '/parent-portal')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT — School Photo Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/publicjacos/bglogin.jpeg"
          alt="JACOS School Building"
          fill
          sizes="(max-width: 1024px) 0vw, 50vw"
          className="object-cover object-center"
          priority
        />
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/75 via-teal-800/55 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Image
              src="/publicjacos/logoputih.png"
              alt="JACOS Logo"
              width={140}
              height={40}
              style={{ width: "auto", height: "auto" }}
              className="object-contain"
            />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
              <Users size={14} className="text-emerald-200" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                PORTAL ORANG TUA SISWA
              </span>
            </div>
            <h1 className="font-display text-4xl font-black text-white leading-tight">
              Pantau Perkembangan<br />Putra-Putri Anda
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Akses informasi pendaftaran, jadwal, dan perkembangan belajar anak Anda secara real-time.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['Status Pendaftaran', 'Jadwal Sekolah', 'Info Keuangan'].map((f) => (
                <span
                  key={f}
                  className="text-xs font-semibold text-white/80 bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 rounded-full"
                >
                  ✦ {f}
                </span>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Jakarta Cosmopolite Islamic School. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT — Login Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/50 p-6 relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={120} height={36} style={{ width: "auto", height: "auto" }} className="object-contain" />
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-900/5 border border-white p-8 space-y-6">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <Users size={20} className="text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-800">
                Portal Orang Tua
              </h2>
              <p className="text-slate-500 text-sm">
                Gunakan email dan password yang dikirimkan via email pendaftaran.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="orangtua@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-slate-400" />
                    Password
                  </Label>
                  <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 pr-12 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/25 transition-all hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Memeriksa...
                  </span>
                ) : (
                  'Masuk ke Portal →'
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Belum punya akun? Hubungi admin sekolah untuk informasi pendaftaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
