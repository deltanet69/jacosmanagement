"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-cloud p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-ink/10 p-8">
        <div className="flex justify-center mb-8">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={140} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </div>

        <h1 className="font-display text-2xl font-bold text-center mb-2">Ubah Password</h1>
        <p className="text-ink-400 text-sm text-center mb-8">Demi keamanan, silakan ubah password sementara Anda dengan yang baru.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="block text-sm font-bold mb-2">Password Baru</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 karakter, 1 huruf kapital"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
              required
            />
          </div>
          
          <div>
            <Label className="block text-sm font-bold mb-2">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Masukkan ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
              required
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-coral bg-coral-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-sky hover:bg-sky-600 text-white font-bold rounded-2xl shadow-sm mt-4" 
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
