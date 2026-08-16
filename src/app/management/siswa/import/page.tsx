"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, UploadCloud, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { importStudents } from "../actions";

import Papa from "papaparse";

export default function ImportSiswaPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{success: number, error: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Generate CSV template for maximum compatibility
    const templateData = [{
      "NISN (opsional)": "",
      "NIS": "",
      "Nama Lengkap": "Budi Santoso",
      "Kelas": "3A",
      "Gender": "Laki-laki",
      "Jenjang (Jenjang Pendidikan)": "Primary School",
      "Status": "Aktif",
      "Foto Profil": "",
      "Nomor Telepon": "08123456789",
      "Tempat Lahir": "Jakarta",
      "Tanggal Lahir": "2015-05-20",
      "Alamat": "Jl. Merdeka No. 1",
      "Agama": "Islam",
      "Status dalam Keluarga": "Anak Kandung",
      "Nama Ayah": "Santoso",
      "Nama Ibu": "Siti",
      "Pekerjaan Ayah": "Wiraswasta",
      "Pekerjaan Ibu": "Ibu Rumah Tangga",
      "Pendidikan Ayah": "S1",
      "Pendidikan Ibu": "SMA",
      "Nomor Telepon Orang Tua": "08123456789",
      "Status Ayah": "Masih Hidup",
      "Status Ibu": "Masih Hidup",
      "Nomor KIP": "",
      "Status KIP": "",
      "Nomor KKS": "",
      "Nomor KIS": "",
      "Nomor KPS": "",
      "Nama Wali": "",
      "Pekerjaan Wali": "",
      "Pendidikan Wali": "",
      "Nomor Telepon Wali": "",
      "Hubungan Keluarga": "",
      "Keterangan": ""
    }];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_Import_Siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadResult(null);

    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          try {
            const data = results.data;
            if (data.length === 0) {
              alert("File CSV kosong!");
              setIsUploading(false);
              return;
            }

            const result = await importStudents(data);
            
            if (!result.success && result.message) {
              alert("Gagal Import: " + result.message);
            }

            setUploadResult({
              success: result.successCount,
              error: result.errorCount
            });
            
            if (result.successCount > 0) {
              setTimeout(() => {
                router.push("/management/siswa");
              }, 2000);
            }
          } catch (err) {
            console.error(err);
            alert("Gagal memproses file CSV.");
          } finally {
            setIsUploading(false);
          }
        },
        error: (error) => {
          console.error(error);
          alert("Gagal membaca file CSV.");
          setIsUploading(false);
        }
      });
    } else {
      // Excel fallback
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          if (json.length === 0) {
            alert("File Excel kosong!");
            setIsUploading(false);
            return;
          }

          const result = await importStudents(json);
          
          if (!result.success && result.message) {
            alert("Gagal Import: " + result.message);
          }

          setUploadResult({
            success: result.successCount,
            error: result.errorCount
          });
          
          if (result.successCount > 0) {
            setTimeout(() => {
              router.push("/management/siswa");
            }, 2000);
          }
        } catch (err) {
          console.error(err);
          alert("Gagal memproses file Excel.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/management/siswa">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-xl bg-white border-ink/10 text-ink-400 hover:text-gold transition-colors">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Import Data Siswa</h1>
          <p className="text-ink-400 text-sm">Upload file Excel (.xlsx) atau CSV untuk memasukkan banyak data sekaligus.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] border border-ink/5 relative overflow-hidden">
        {uploadResult && (
          <div className={`mb-6 p-4 rounded-2xl border ${uploadResult.success > 0 ? 'bg-leaf-50 border-leaf-200 text-leaf-700' : 'bg-coral-50 border-coral-200 text-coral-700'}`}>
            <p className="font-bold">Proses Import Selesai!</p>
            <p className="text-sm mt-1">Berhasil: {uploadResult.success} baris | Gagal: {uploadResult.error} baris</p>
            {uploadResult.success > 0 && <p className="text-xs mt-2 opacity-80">Mengalihkan ke halaman data siswa...</p>}
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-gold-50/50 border border-gold-200 rounded-2xl mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gold-600">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="font-bold text-sm">Gunakan Template Standar</p>
              <p className="text-xs text-ink-400">Pastikan urutan kolom sesuai dengan template sistem.</p>
            </div>
          </div>
          <Button onClick={handleDownloadTemplate} variant="outline" className="h-10 border-gold text-gold hover:bg-gold hover:text-ink font-bold rounded-xl">
            <Download size={16} className="mr-2" /> Download Template
          </Button>
        </div>

        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? "border-gold bg-gold-50 scale-[1.02]" 
              : "border-ink/20 bg-cloud hover:bg-cloud/80"
          }`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragging ? "bg-gold text-ink" : "bg-white text-ink-300 shadow-sm"}`}>
            <UploadCloud size={32} />
          </div>
          
          <h3 className="font-display font-bold text-xl mb-2">
            {file ? file.name : "Drag & Drop file Excel di sini"}
          </h3>
          <p className="text-sm text-ink-400 max-w-sm mb-6">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "Atau klik area ini untuk memilih file dari komputer Anda."}
          </p>

          <Button type="button" className="h-12 px-8 bg-ink hover:bg-ink-600 text-white font-bold rounded-2xl shadow-lg pointer-events-none">
            Pilih File Excel
          </Button>
        </div>

        {file && !uploadResult && (
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={processFile} 
              disabled={isUploading}
              className="h-12 px-8 bg-gold hover:bg-gold-600 text-ink font-bold rounded-2xl shadow-lg disabled:opacity-70"
            >
              {isUploading ? (
                <><Loader2 size={18} className="mr-2 animate-spin" /> Memproses Data...</>
              ) : (
                "Mulai Proses Import"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
