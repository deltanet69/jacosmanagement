import { Car, QrCode, History, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPickupQueue } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PenjemputanAdminPage() {
  const queueData = await getPickupQueue();
  
  const waitingQueue = queueData.filter(q => q.status === 'WAITING');
  const pickedUpQueue = queueData.filter(q => q.status === 'PICKED_UP');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Penjemputan Siswa</h1>
          <p className="text-ink-400 text-sm mt-1">Kelola dan pantau proses penjemputan siswa hari ini.</p>
        </div>
        
        <Link href="/management/absensi/penjemputan/scanner">
          <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-6 rounded-2xl shadow-sm">
            <QrCode size={18} /> Buka Scanner Penjemputan
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Statistik Hari Ini</h2>
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <History size={16} /> Update Live
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Sedang Antri</p>
                <p className="font-display text-4xl text-sky mt-1">{waitingQueue.length}</p>
              </div>
              <div className="bg-leaf-50 p-4 rounded-2xl border border-leaf-100">
                <p className="text-[10px] font-bold text-leaf-600 uppercase tracking-wider">Sudah Dijemput</p>
                <p className="font-display text-4xl text-leaf mt-1">{pickedUpQueue.length}</p>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
              <ShieldAlert className="text-purple-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-purple-900 font-medium leading-relaxed">
                Fitur ini terhubung langsung dengan aplikasi layar monitor di lobby. Pastikan Anda menekan <strong>Konfirmasi</strong> di halaman scanner setelah anak berhasil dijemput.
              </p>
            </div>
          </div>
        </div>

        {/* Live Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Car size={20} />
                </div>
                <h2 className="font-bold text-lg">Antrian Saat Ini</h2>
              </div>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-bold text-ink">Tidak Ada Antrian</p>
                <p className="text-sm text-ink-400 mt-1">Belum ada orang tua yang men-scan QR penjemputan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitingQueue.map((queue, idx) => (
                  <div key={queue.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-sky-50/50 rounded-2xl border border-sky-100 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-sky flex items-center justify-center font-display font-bold text-white text-lg shadow-inner">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-ink text-base">{queue.students?.full_name}</h3>
                        <p className="text-xs text-ink-400 font-medium tracking-wide">
                          Kelas {queue.students?.class_id || '-'} • Dijemput: <span className="text-sky-600">{queue.picked_by_name}</span> ({queue.picked_by_relation})
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Waktu Scan</p>
                        <p className="text-sm font-bold text-ink">
                          {new Date(queue.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-leaf-50 flex items-center justify-center text-leaf-600">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="font-bold text-lg">Riwayat Selesai (Hari Ini)</h2>
              </div>
            </div>

            {pickedUpQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-ink-400 mt-1">Belum ada histori penjemputan selesai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pickedUpQueue.map((queue) => (
                  <div key={queue.id} className="flex items-center justify-between p-3 px-4 bg-cloud rounded-xl border border-ink/5">
                    <div className="flex items-center gap-3">
                      <span className="text-leaf">✓</span>
                      <div>
                        <p className="font-bold text-ink text-sm">{queue.students?.full_name}</p>
                        <p className="text-[10px] font-medium text-ink-400">Oleh: {queue.picked_by_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-ink-300 uppercase">Selesai</p>
                      <p className="text-xs font-bold text-ink">
                        {queue.picked_up_at ? new Date(queue.picked_up_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
