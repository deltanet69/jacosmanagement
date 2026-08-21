"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

      const isFirstLogin = data.user?.user_metadata?.first_login !== false
      const isSubdomain = window.location.hostname.startsWith('parent.')

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
    <div className="min-h-screen flex items-center justify-center bg-cloud p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-ink/10 p-8">
        <div className="flex justify-center mb-8">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={140} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </div>

        <h1 className="font-display text-2xl font-bold text-center mb-2">Portal Orang Tua</h1>
        <p className="text-ink-400 text-sm text-center mb-8">Masukkan email pendaftaran dan password sementara Anda.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label className="block text-sm font-bold mb-2">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="orangtua@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="block text-sm font-bold">Password</Label>
              <a href="#" className="text-sm font-bold text-sky hover:text-sky-600 transition-colors">Lupa Password?</a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Memeriksa...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  )
}
