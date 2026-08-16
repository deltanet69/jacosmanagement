import { Calendar, Download, UserCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStaffAttendance } from "./actions";

export const dynamic = "force-dynamic";

export default async function AbsensiGuruPage() {
  const staffAttendance = await getStaffAttendance();

  const totalHadir = staffAttendance.filter(a => a.status === 'HADIR').length;
  const totalSakit = staffAttendance.filter(a => a.status !== 'HADIR').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Absensi Guru & Staf</h1>
          <p className="text-ink-400 text-sm mt-1">Pantau kehadiran guru dan staf sekolah hari ini.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-white text-ink font-bold hover:bg-cloud rounded-xl shadow-sm border-ink/10">
            <Download size={18} /> Laporan Bulanan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Kehadiran Staf</h2>
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Calendar size={16} /> Hari Ini
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-leaf-50 p-4 rounded-2xl border border-leaf-100">
                <p className="text-xs font-bold text-leaf-600 uppercase">Hadir</p>
                <p className="font-display text-4xl text-leaf mt-1">{totalHadir}</p>
              </div>
              <div className="bg-coral-50 p-4 rounded-2xl border border-coral-100">
                <p className="text-xs font-bold text-coral-600 uppercase">Sakit/Izin</p>
                <p className="font-display text-4xl text-coral mt-1">{totalSakit}</p>
              </div>
            </div>
            
            <div className="p-4 bg-cloud rounded-2xl border border-ink/5 flex items-start gap-3">
              <ShieldAlert className="text-gold shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-ink-500 font-medium">Data absensi siswa aktif tidak berada di halaman ini. Silakan periksa melalui modul <strong className="text-ink">Classroom</strong>.</p>
            </div>
          </div>
        </div>

        {/* Log Kehadiran */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Log Absensi Terbaru (Guru)</h2>
          </div>

          {staffAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-cloud rounded-full flex items-center justify-center text-ink-300 mb-4">
                <UserCheck size={24} />
              </div>
              <p className="font-bold text-ink">Belum Ada Absensi</p>
              <p className="text-sm text-ink-400 mt-1">Belum ada guru yang melakukan absensi hari ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffAttendance.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-cloud/40 rounded-2xl border border-ink/5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-50 to-cloud border border-gold-100 flex items-center justify-center font-display font-bold text-gold-600">
                      {log.teachers?.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink">{log.teachers?.full_name}</h3>
                      <p className="text-xs text-ink-400 font-medium tracking-wide">Status: <span className={log.status === 'HADIR' ? 'text-leaf font-bold' : 'text-coral font-bold'}>{log.status}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-ink-300 uppercase">Check In</p>
                      <p className="text-sm font-bold text-ink">{log.check_in_time ? log.check_in_time.substring(0, 5) : '-'}</p>
                    </div>
                    <div className="w-px h-6 bg-ink/10" />
                    <div>
                      <p className="text-[10px] font-bold text-ink-300 uppercase">Check Out</p>
                      <p className={`text-sm font-bold ${log.check_out_time ? 'text-ink' : 'text-ink-300'}`}>
                        {log.check_out_time ? log.check_out_time.substring(0, 5) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
