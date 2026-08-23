"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserClient } from '@supabase/ssr';
import { QRCodeSVG } from 'qrcode.react';
import { History, Car, UserCircle, Users, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function PenjemputanPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrKey, setQrKey] = useState(Date.now());
  const [pickerType, setPickerType] = useState('parent');
  const [pickerName, setPickerName] = useState('');
  const [pickerRole, setPickerRole] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const studentId = session?.user?.user_metadata?.student_id;
        
        let loadedStudent = null;

        if (studentId) {
          const { data: studentData, error } = await supabase
            .from('students')
            .select('id, full_name, school_classes(name)')
            .eq('id', studentId)
            .maybeSingle();
            
          if (!error && studentData) {
            loadedStudent = studentData;
          }
        }

        if (!loadedStudent) {
          loadedStudent = {
            id: studentId || 'student-demo',
            full_name: session?.user?.user_metadata?.student_name || 'Ananda Siswa JACOS',
            school_classes: [{ name: 'Grade 1 - Al-Fatih' }]
          };
        }

        setStudent(loadedStudent);
      } catch (err) {
        console.error("Error fetching student in penjemputan:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [supabase]);

  // Auto reload QR every 30 seconds for security if it's shown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR) {
      interval = setInterval(() => {
        setQrKey(Date.now());
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showQR]);

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickerType === 'other' && (!pickerName || !pickerRole)) {
      alert("Harap lengkapi nama dan peran penjemput.");
      return;
    }
    setQrKey(Date.now());
    setShowQR(true);
  };

  if (loading) {
    return <div className="p-8 text-ink-400 font-bold animate-pulse">Memuat data penjemputan...</div>;
  }

  if (!student) {
    return <div className="text-center p-8 bg-white rounded-3xl border border-ink/10">Data siswa tidak ditemukan.</div>;
  }

  const qrValue = JSON.stringify({
    studentId: student.id,
    timestamp: qrKey,
    picker: pickerType === 'parent' ? 'Orang Tua' : pickerName,
    role: pickerType === 'parent' ? 'Orang Tua / Wali Utama' : pickerRole
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Sistem Penjemputan</h1>
        <p className="text-ink-400 mt-1">Buat QR Code unik dan aman untuk menjemput siswa di sekolah.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Pembuatan QR */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-ink/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Car size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Generate QR Jemput</h2>
              <p className="text-sm font-medium text-ink-400">Pilih siapa yang akan menjemput hari ini.</p>
            </div>
          </div>

          <form onSubmit={handleGenerateQR} className="space-y-8">
            <RadioGroup value={pickerType} onValueChange={setPickerType} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${pickerType === 'parent' ? 'border-sky bg-sky-50' : 'border-ink/10 hover:border-sky/50'}`} onClick={() => setPickerType('parent')}>
                <UserCircle size={32} className={`mb-2 ${pickerType === 'parent' ? 'text-sky' : 'text-ink-300'}`} />
                <span className={`font-bold text-sm ${pickerType === 'parent' ? 'text-sky-700' : 'text-ink-400'}`}>Saya Sendiri (Orang Tua)</span>
                {pickerType === 'parent' && <CheckCircle2 size={16} className="absolute top-3 right-3 text-sky" />}
              </div>
              <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${pickerType === 'other' ? 'border-sky bg-sky-50' : 'border-ink/10 hover:border-sky/50'}`} onClick={() => setPickerType('other')}>
                <Users size={32} className={`mb-2 ${pickerType === 'other' ? 'text-sky' : 'text-ink-300'}`} />
                <span className={`font-bold text-sm ${pickerType === 'other' ? 'text-sky-700' : 'text-ink-400'}`}>Orang Lain (Utusan)</span>
                {pickerType === 'other' && <CheckCircle2 size={16} className="absolute top-3 right-3 text-sky" />}
              </div>
            </RadioGroup>

            {pickerType === 'other' && (
              <div className="space-y-4 p-5 bg-cloud/50 rounded-2xl border border-ink/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="pickerName" className="font-bold text-ink-600">Nama Lengkap Penjemput</Label>
                  <Input 
                    id="pickerName" 
                    placeholder="Contoh: Budi Santoso" 
                    value={pickerName}
                    onChange={(e) => setPickerName(e.target.value)}
                    className="h-12 bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickerRole" className="font-bold text-ink-600">Tanggung Jawab / Relasi</Label>
                  <Input 
                    id="pickerRole" 
                    placeholder="Contoh: Supir Pribadi / Paman" 
                    value={pickerRole}
                    onChange={(e) => setPickerRole(e.target.value)}
                    className="h-12 bg-white rounded-xl"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-600/20 transition-transform hover:-translate-y-0.5">
              Generate QR Code
            </Button>
          </form>
        </div>

        {/* Riwayat Penjemputan */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-ink/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center">
              <History size={24} className="text-ink-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Riwayat Penjemputan</h2>
              <p className="text-sm font-medium text-ink-400">Bulan Ini (Agustus 2026)</p>
            </div>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-ink/10">
            {[
              { date: '24 Agu 2026', time: '14:35', by: 'Saya Sendiri (Orang Tua)', role: 'Wali Utama' },
              { date: '23 Agu 2026', time: '14:40', by: 'Budi Santoso', role: 'Supir Pribadi' },
              { date: '22 Agu 2026', time: '12:15', by: 'Saya Sendiri (Orang Tua)', role: 'Wali Utama' },
              { date: '21 Agu 2026', time: '14:30', by: 'Siti Aminah', role: 'Tante' },
            ].map((item, idx) => (
              <div key={idx} className="relative pl-10 group">
                <span className="absolute left-2 top-2 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white shadow-sm" />
                <div className="bg-cloud/30 p-4 rounded-2xl border border-ink/5 group-hover:bg-cloud/80 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-ink-400 tracking-wider uppercase">{item.date}</p>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {item.time}
                    </span>
                  </div>
                  <p className="font-bold text-ink text-sm">Dijemput oleh {item.by}</p>
                  <p className="text-xs font-medium text-ink-400 mt-1">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="font-display text-2xl font-bold text-ink mb-2">QR Penjemputan</h3>
            <p className="text-sm font-medium text-ink-400 mb-6">Tunjukkan kode ini kepada security saat menjemput. QR akan otomatis diperbarui setiap 30 detik untuk keamanan.</p>
            
            <div className="bg-cloud p-4 rounded-[1.5rem] flex justify-center mb-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />
              <QRCodeSVG 
                value={qrValue} 
                size={220}
                level="H"
                includeMargin={true}
                className="rounded-xl"
              />
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 text-left mb-6 border border-purple-100">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Informasi Penjemput</p>
              <p className="font-bold text-purple-900">{pickerType === 'parent' ? 'Orang Tua' : pickerName}</p>
              <p className="text-sm font-semibold text-purple-600">{pickerType === 'parent' ? 'Wali Utama' : pickerRole}</p>
            </div>
            
            <Button 
              onClick={() => setShowQR(false)}
              variant="outline"
              className="w-full h-14 rounded-2xl font-bold text-ink-400 border-ink/10 hover:bg-cloud hover:text-ink"
            >
              Tutup QR Code
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
