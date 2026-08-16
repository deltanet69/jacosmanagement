"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Pencil, Trash2, FileCheck, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApplicantDetail, getClasses, approveAndAssignClass, rejectApplicant } from "../actions";

export default function ApplicantDetail({ params }: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = use(params);
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const applicant = await getApplicantDetail(applicantId);
      const classData = await getClasses();
      setData(applicant);
      setClasses(classData);
      setIsLoading(false);
    }
    loadData();
  }, [applicantId]);

  if (isLoading) return <div className="text-center py-20">Memuat data pendaftar...</div>;
  if (!data) return <div className="text-center py-20 text-coral">Data pendaftar tidak ditemukan.</div>;

  const parentName = data.guardians && data.guardians.length > 0 ? data.guardians[0].full_name : "-";
  const parentPhone = data.guardians && data.guardians.length > 0 ? data.guardians[0].phone : "-";
  const parentEmail = data.guardians && data.guardians.length > 0 ? data.guardians[0].email : "-";
  const parentJob = data.guardians && data.guardians.length > 0 ? data.guardians[0].occupation : "-";
  const parentRelation = data.guardians && data.guardians.length > 0 ? data.guardians[0].relation : "-";

  const handleApprove = async () => {
    if (!selectedClass) {
      alert("Pilih kelas terlebih dahulu.");
      return;
    }
    setIsApproving(true);
    const res = await approveAndAssignClass(applicantId, selectedClass);
    setIsApproving(false);
    if (res.success) {
      setShowClassModal(false);
      setData({ ...data, status: "ENROLLED" });
      alert("Siswa berhasil diterima dan dimasukkan ke kelas!");
    } else {
      alert(res.message);
    }
  };

  const handleReject = async () => {
    if (confirm("Apakah Anda yakin menolak pendaftar ini?")) {
      const res = await rejectApplicant(applicantId);
      if (res.success) {
        setData({ ...data, status: "REJECTED" });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-display text-2xl font-bold mb-2">Pilih Kelas</h3>
            <p className="text-ink-400 mb-6 text-sm">Assign siswa ini ke kelas yang sesuai sebelum menerima pendaftaran.</p>
            <select 
              className="w-full h-12 px-4 rounded-xl border border-ink/10 mb-6"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.filter(c => data.program === "KINDERGARTEN" ? c.level === "KINDERGARTEN" : c.level === "PRIMARY_SCHOOL").map(c => (
                <option key={c.id} value={c.id}>{c.name} (Tingkat {c.grade})</option>
              ))}
            </select>
            <div className="flex gap-4">
              <Button onClick={() => setShowClassModal(false)} variant="outline" className="flex-1 rounded-xl">Batal</Button>
              <Button onClick={handleApprove} disabled={isApproving} className="flex-1 rounded-xl bg-leaf hover:bg-leaf-600 text-white font-bold">
                {isApproving ? "Memproses..." : "Konfirmasi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/management/admisi">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-sky transition-colors">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Detail Pendaftaran</h1>
          <p className="text-ink-400 text-sm">{data.registration_no}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-cloud flex items-center justify-center font-display font-bold text-2xl text-sky border border-sky/10 shadow-sm">
                  {data.student_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{data.student_name}</h2>
                  <span className="text-sm font-semibold bg-cloud px-3 py-1 rounded-full mt-1 inline-block text-ink-400">
                    {data.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru"} • {data.program === "KINDERGARTEN" ? "Kindergarten" : "Primary School"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">Data Calon Siswa</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-ink-400">Tempat, Tgl Lahir</p>
                    <p className="font-bold">{data.birth_place || "-"}, {data.birth_date ? new Date(data.birth_date).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Jenis Kelamin</p>
                    <p className="font-bold">{data.gender === "MALE" ? "Laki-laki" : "Perempuan"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">NISN</p>
                    <p className="font-bold">{data.nisn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Alamat</p>
                    <p className="font-bold">{data.address || "-"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">Data Orang Tua / Wali</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-ink-400">Nama ({parentRelation})</p>
                    <p className="font-bold">{parentName}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Kontak</p>
                    <p className="font-bold">{parentPhone}</p>
                    <p className="text-ink-400">{parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Pekerjaan</p>
                    <p className="font-bold">{parentJob}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-ink/5">
            <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-4">Status Pendaftaran</h3>
            
            <div className="mb-6">
              {(data.status === "PENDING" || data.status === "SUBMITTED") && (
                <div className="bg-gold-50 text-gold-600 p-4 rounded-2xl flex items-start gap-3">
                  <Clock size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Menunggu Review Admin</p>
                    <p className="text-xs mt-1 opacity-80">Mohon periksa dokumen sebelum memberikan keputusan.</p>
                  </div>
                </div>
              )}
              {(data.status === "ACCEPTED" || data.status === "ENROLLED") && (
                <div className="bg-leaf-50 text-leaf-600 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Diterima / Terdaftar</p>
                    <p className="text-xs mt-1 opacity-80">Siswa telah dinyatakan lolos dan diterima ke dalam kelas.</p>
                  </div>
                </div>
              )}
              {data.status === "REJECTED" && (
                <div className="bg-coral-50 text-coral-600 p-4 rounded-2xl flex items-start gap-3">
                  <XCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Ditolak</p>
                    <p className="text-xs mt-1 opacity-80">Aplikasi pendaftaran ditolak oleh Admin.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowClassModal(true)}
                className="w-full bg-leaf hover:bg-leaf-600 text-white font-bold h-12 rounded-xl shadow-sm"
                disabled={data.status === "ENROLLED" || data.status === "ACCEPTED"}
              >
                Terima & Pilih Kelas
              </Button>
              <Button 
                onClick={handleReject}
                variant="outline"
                className="w-full border-coral text-coral hover:bg-coral-50 hover:text-coral-600 font-bold h-12 rounded-xl shadow-sm"
                disabled={data.status === "REJECTED" || data.status === "ENROLLED"}
              >
                Tolak
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
