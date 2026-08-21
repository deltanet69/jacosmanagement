"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const validatePassword = (pass: string) => {
    if (pass.length < 6) return 'Password minimal 6 karakter.'
    if (!/[A-Z]/.test(pass)) return 'Password harus memiliki minimal satu huruf kapital.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Password tidak sama.')
      return
    }

    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Force session hydration
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sesi tidak ditemukan. Silakan login kembali.')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { first_login: false }
      })

      if (updateError) throw updateError

      const isSubdomain = window.location.hostname.startsWith('parent.')
      router.push(isSubdomain ? '/' : '/parent-portal')
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password')
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
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/75 via-teal-800/55 to-transparent" />

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
              <ShieldCheck size={14} className="text-emerald-200" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                LANGKAH KEAMANAN AKUN
              </span>
            </div>
            <h1 className="font-display text-4xl font-black text-white leading-tight">
              Buat Password<br />Yang Aman
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Demi keamanan akun Anda, silakan buat password baru yang kuat dan mudah diingat.
            </p>
            <ul className="space-y-2 pt-2">
              {[
                'Minimal 6 karakter',
                'Setidaknya 1 huruf kapital',
                'Jangan gunakan password yang mudah ditebak',
              ].map((tip) => (
                <li key={tip} className="flex items-center gap-2 text-white/70 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Jakarta Cosmopolite Islamic School
          </p>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/50 p-6 relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={120} height={36} className="object-contain" />
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-900/5 border border-white p-8 space-y-6">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <KeyRound size={20} className="text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-800">
                Buat Password Baru
              </h2>
              <p className="text-slate-500 text-sm">
                Ini adalah langkah keamanan pertama kali login. Password sementara Anda akan diganti.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700">
                  Password Baru
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 karakter, 1 huruf kapital"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 pr-12 transition-all"
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

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700">
                  Konfirmasi Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Masukkan ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all"
                  required
                />
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          password.length >= level * 2 && /[A-Z]/.test(password)
                            ? 'bg-emerald-500'
                            : password.length >= level * 2
                            ? 'bg-yellow-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Kekuatan password</p>
                </div>
              )}

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
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Password Baru →'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
