"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || session.user?.user_metadata?.role !== 'PARENT') {
        const isSubdomain = window.location.hostname.startsWith('parent.')
        router.push(isSubdomain ? '/login' : '/parent-portal/login')
        return
      }

      // TODO: Fetch user's admission application status from your database
      // Here we assume it's stored in user metadata for now, but it should ideally
      // be fetched from an `admissions` or `parents` table.
      const userStatus = session.user?.user_metadata?.admission_status || 'Waiting for approval'
      setStatus(userStatus)
      setLoading(false)
    }

    fetchStatus()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cloud">
        <p className="text-ink-400 font-bold">Memuat dashboard...</p>
      </div>
    )
  }

  if (status === 'Waiting for approval') {
    return (
      <div className="flex h-screen items-center justify-center bg-cloud p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-ink">Menunggu Persetujuan</h2>
          <p className="text-ink-400 text-sm">
            Pendaftaran Anda sedang ditinjau oleh staf admin kami. Kami akan memberi tahu Anda setelah disetujui.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'Rejected') {
    return (
      <div className="flex h-screen items-center justify-center bg-cloud p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-ink/10 p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-coral">Pendaftaran Ditolak</h2>
          <p className="text-ink-400 text-sm">
            Mohon maaf, pendaftaran Anda ditolak. Silakan ikuti instruksi dari admin.
          </p>
          <a href="https://wa.me/YOUR_ADMIN_NUMBER" target="_blank" rel="noreferrer" className="block mt-4">
            <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-sm">
              Hubungi Admin via WhatsApp
            </Button>
          </a>
        </div>
      </div>
    )
  }

  // Approved Status
  return (
    <div className="p-8 space-y-6 bg-cloud min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Dashboard Orang Tua</h1>
        <Button 
          variant="outline" 
          className="rounded-xl border-ink/20 font-bold"
          onClick={async () => {
            await supabase.auth.signOut()
            const isSubdomain = window.location.hostname.startsWith('parent.')
            router.push(isSubdomain ? '/login' : '/parent-portal/login')
          }}
        >
          Keluar
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/10">
          <h3 className="font-bold text-ink-400 text-sm">Kehadiran</h3>
          <p className="font-display text-3xl font-bold text-sky mt-2">98%</p>
          <p className="text-xs font-bold text-ink-400 mt-1">Bulan ini</p>
        </div>

        {/* Pickup QR Shortcut */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/10 flex flex-col items-center justify-center">
          <h3 className="font-bold text-ink-400 text-sm mb-3">Penjemputan Siswa</h3>
          <Button className="w-full h-10 bg-sky hover:bg-sky-600 rounded-xl font-bold">Generate QR Code</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Information Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-ink/10 p-6">
          <h2 className="font-display text-xl font-bold mb-4">Informasi Terbaru</h2>
          <div className="space-y-4">
            <div className="bg-sky/5 p-4 rounded-2xl border border-sky/20">
              <h3 className="font-bold text-sky-800">Kegiatan Sekolah Minggu Depan</h3>
              <p className="text-sm font-medium text-sky-700 mt-1">Jangan lupa persiapkan kebutuhan untuk festival sekolah mendatang.</p>
            </div>
          </div>
        </div>

        {/* Finance Overview */}
        <div className="bg-white rounded-3xl shadow-sm border border-ink/10 p-6">
          <h2 className="font-display text-xl font-bold mb-4">Ringkasan Keuangan</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-ink/10">
              <span className="text-sm font-bold text-ink-400">SPP Bulanan</span>
              <span className="text-sm font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full">Lunas</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b-0">
              <span className="text-sm font-bold text-ink-400">Tagihan Umum</span>
              <span className="text-sm font-bold text-coral bg-coral-50 px-3 py-1 rounded-full">Belum Lunas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
