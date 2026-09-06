"use client";

import { useState, useTransition, useRef } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Users,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileSpreadsheet,
  FileText,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  MapPin,
  IdCard,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Lock,
  Copy,
  CheckCheck,
  Calendar,
  Award,
  BookOpen,
  MessageCircle,
  Building,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EmployeeRecord,
  EmployeeInput,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  importEmployeesBatch,
  getNextEmployeeCode,
} from "@/app/management/hr/guru/actions";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type SortField = "employee_code" | "full_name" | "position" | "phone" | "status";
type SortDirection = "asc" | "desc";

export function GuruListClient({ initialData }: { initialData: EmployeeRecord[] }) {
  const [data, setData] = useState<EmployeeRecord[]>(initialData);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [educationFilter, setEducationFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("employee_code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Pending Actions
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State & Validation
  const [formData, setFormData] = useState<EmployeeInput>({
    employee_code: "",
    nik: "",
    full_name: "",
    birth_place: "",
    birth_date: "",
    gender: "LAKI_LAKI",
    religion: "ISLAM",
    address: "",
    phone: "",
    email: "",
    photo_url: "",
    employee_type: "GURU",
    contract_status: "TETAP",
    position: "",
    join_date: new Date().toISOString().split("T")[0],
    contract_end_date: "",
    status: "ACTIVE",
    last_education: "S1",
    major: "",
    academic_field: "",
    gpa: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [activeFormTab, setActiveFormTab] = useState<"personal" | "education">("personal");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [importRecords, setImportRecords] = useState<EmployeeInput[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification helper
  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Formatting helpers
  const formatNikDisplay = (nik: string | null) => {
    if (!nik) return "-";
    const clean = nik.replace(/\D/g, "");
    if (clean.length === 16) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
    }
    return nik;
  };

  const formatIndoDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredData = data
    .filter((emp) => {
      const term = search.toLowerCase();
      const matchesSearch =
        (emp.full_name || "").toLowerCase().includes(term) ||
        (emp.employee_code || "").toLowerCase().includes(term) ||
        (emp.nik || "").toLowerCase().includes(term) ||
        (emp.email || "").toLowerCase().includes(term) ||
        (emp.position || "").toLowerCase().includes(term) ||
        (emp.phone || "").toLowerCase().includes(term);

      const matchesRole = roleFilter === "ALL" || emp.employee_type?.toUpperCase() === roleFilter;

      const isEmpActive = emp.status?.toUpperCase() === "ACTIVE";
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isEmpActive) ||
        (statusFilter === "INACTIVE" && !isEmpActive);

      const matchesEdu =
        educationFilter === "ALL" ||
        (emp.last_education || "").toUpperCase() === educationFilter.toUpperCase();

      return matchesSearch && matchesRole && matchesStatus && matchesEdu;
    })
    .sort((a, b) => {
      let valA: any = a[sortField] || "";
      let valB: any = b[sortField] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Open Add Modal
  const handleOpenAdd = async () => {
    setEditingEmployee(null);
    setFormErrors({});
    const nextCode = await getNextEmployeeCode();
    setFormData({
      employee_code: nextCode,
      nik: "",
      full_name: "",
      birth_place: "",
      birth_date: "",
      gender: "LAKI_LAKI",
      religion: "ISLAM",
      address: "",
      phone: "",
      email: "",
      photo_url: "",
      employee_type: "GURU",
      contract_status: "TETAP",
      position: "",
      join_date: new Date().toISOString().split("T")[0],
      contract_end_date: "",
      status: "ACTIVE",
      last_education: "S1",
      major: "",
      academic_field: "",
      gpa: "",
    });
    setActiveFormTab("personal");
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: EmployeeRecord) => {
    setEditingEmployee(emp);
    setFormErrors({});
    setFormData({
      employee_code: emp.employee_code || "",
      nik: emp.nik || "",
      full_name: emp.full_name || "",
      birth_place: emp.birth_place || "",
      birth_date: emp.birth_date || "",
      gender: emp.gender || "LAKI_LAKI",
      religion: emp.religion || "ISLAM",
      address: emp.address || "",
      phone: emp.phone || "",
      email: emp.email || "",
      photo_url: emp.photo_url || "",
      employee_type: emp.employee_type || "GURU",
      contract_status: emp.contract_status || "TETAP",
      position: emp.position || "",
      join_date: emp.join_date || new Date().toISOString().split("T")[0],
      contract_end_date: emp.contract_end_date || "",
      status: emp.status || "ACTIVE",
      last_education: emp.last_education || "S1",
      major: emp.major || "",
      academic_field: emp.academic_field || "",
      gpa: emp.gpa || "",
    });
    setActiveFormTab("personal");
    setIsAddEditOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    setIsDetailOpen(true);
  };

  // Handle Photo Upload (FileReader conversion to Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar (format JPG, PNG, atau WEBP).", true);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran foto maksimal adalah 2MB.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, photo_url: result }));
      setFormErrors((prev) => ({ ...prev, photo_url: "" }));
      showToast("Foto profil berhasil dipilih!");
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // STEP-BY-STEP & OVERALL VALIDATION
  // =========================================================================
  
  // Validate Step 1 (Personal & Contact)
  const validatePersonalTab = (): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    // 1. Nama Lengkap (Min 3 Karakter)
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      errors.full_name = "Nama lengkap wajib diisi minimal 3 karakter.";
    }

    // 2. NIK KTP (Harus tepat 16 digit angka)
    const cleanNik = (formData.nik || "").replace(/\D/g, "");
    if (!cleanNik) {
      errors.nik = "NIK KTP wajib diisi (16 digit angka).";
    } else if (cleanNik.length !== 16) {
      errors.nik = `NIK harus tepat 16 digit angka sesuai KTP (saat ini ${cleanNik.length} digit).`;
    }

    // 3. Email Aktif (Format email valid)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !formData.email.trim()) {
      errors.email = "Email aktif wajib diisi.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Format email tidak valid (contoh: ahmad.fauzi@jacos.sch.id).";
    }

    // 4. No HP / WhatsApp (Min 8 digit, max 15 digit)
    const cleanPhone = (formData.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Nomor WhatsApp / HP wajib diisi.";
    } else if (cleanPhone.length < 8) {
      errors.phone = `Nomor WhatsApp minimal 8 digit angka (saat ini ${cleanPhone.length} digit).`;
    } else if (cleanPhone.length > 15) {
      errors.phone = `Nomor WhatsApp maksimal 15 digit angka (saat ini ${cleanPhone.length} digit).`;
    }

    // 5. Jabatan / Posisi Spesifik
    if (!formData.position || formData.position.trim().length < 2) {
      errors.position = "Jabatan atau posisi spesifik wajib diisi (minimal 2 karakter).";
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Validate Step 2 (Education & Employment)
  const validateEducationTab = (): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    // 6. Pendidikan Terakhir (Wajib)
    if (!formData.last_education || !formData.last_education.trim()) {
      errors.last_education = "Pendidikan terakhir wajib dipilih.";
    }

    // 7. Jurusan / Program Studi (Wajib, min 2 karakter)
    if (!formData.major || formData.major.trim().length < 2) {
      errors.major = "Jurusan / program studi wajib diisi (minimal 2 karakter).";
    }

    // 8. Status Kontrak (Wajib)
    if (!formData.contract_status) {
      errors.contract_status = "Status kontrak kerja wajib dipilih.";
    }

    // 9. Tanggal Bergabung (Wajib)
    if (!formData.join_date || !formData.join_date.trim()) {
      errors.join_date = "Tanggal bergabung wajib diisi.";
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Full validation combining both tabs
  const validateForm = (): boolean => {
    const pRes = validatePersonalTab();
    const eRes = validateEducationTab();

    const combinedErrors = { ...pRes.errors, ...eRes.errors };
    setFormErrors(combinedErrors);

    if (!pRes.isValid) {
      setActiveFormTab("personal");
      return false;
    }

    if (!eRes.isValid) {
      setActiveFormTab("education");
      return false;
    }

    return true;
  };

  // Handle Proceed button click from Step 1 to Step 2
  const handleProceedToEducation = () => {
    const pRes = validatePersonalTab();
    if (!pRes.isValid) {
      setFormErrors((prev) => ({ ...prev, ...pRes.errors }));
      showToast("Mohon lengkapi seluruh data pribadi & kontak yang bertanda (*) sebelum melanjutkan.", true);
    } else {
      setFormErrors((prev) => {
        const cleaned = { ...prev };
        delete cleaned.full_name;
        delete cleaned.nik;
        delete cleaned.email;
        delete cleaned.phone;
        delete cleaned.position;
        return cleaned;
      });
      setActiveFormTab("education");
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Data belum lengkap. Silakan lengkapi seluruh kolom wajib bertanda merah (*).", true);
      return;
    }

    startTransition(async () => {
      if (editingEmployee) {
        // Update
        const res = await updateEmployee(editingEmployee.id, formData);
        if (res.success) {
          setData((prev) =>
            prev.map((item) => (item.id === editingEmployee.id ? { ...item, ...formData, id: item.id } : item))
          );
          setIsAddEditOpen(false);
          showToast(`Data pegawai ${formData.full_name} berhasil diperbarui!`);
        } else {
          showToast(res.error || "Gagal memperbarui data pegawai.", true);
        }
      } else {
        // Create
        const res = await createEmployee(formData);
        if (res.success && res.data) {
          setData((prev) => [res.data, ...prev]);
          setIsAddEditOpen(false);
          showToast(`Pegawai baru ${formData.full_name} berhasil ditambahkan dengan ID ${res.data.employee_code}!`);
        } else {
          showToast(res.error || "Gagal menambahkan pegawai baru.", true);
        }
      }
    });
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const res = await deleteEmployee(deletingId);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== deletingId));
        setIsDeleteConfirmOpen(false);
        setDeletingId(null);
        showToast("Data pegawai berhasil dinonaktifkan dari sistem.");
      } else {
        showToast(res.error || "Gagal menghapus data pegawai.", true);
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = [
      "ID Pegawai",
      "NIK",
      "Nama Lengkap",
      "Tipe Karyawan",
      "Jabatan",
      "Email",
      "No HP",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Agama",
      "Alamat",
      "Pendidikan Terakhir",
      "Jurusan",
      "Bidang Akademik",
      "GPA",
      "Status Kontrak",
      "Tanggal Bergabung",
      "Status",
    ];

    const rows = filteredData.map((e) => [
      `"${e.employee_code || ""}"`,
      `"${e.nik || ""}"`,
      `"${e.full_name || ""}"`,
      `"${e.employee_type || ""}"`,
      `"${e.position || ""}"`,
      `"${e.email || ""}"`,
      `"${e.phone || ""}"`,
      `"${e.birth_place || ""}"`,
      `"${e.birth_date || ""}"`,
      `"${e.gender || ""}"`,
      `"${e.religion || ""}"`,
      `"${(e.address || "").replace(/"/g, '""')}"`,
      `"${e.last_education || ""}"`,
      `"${e.major || ""}"`,
      `"${e.academic_field || ""}"`,
      `"${e.gpa || ""}"`,
      `"${e.contract_status || ""}"`,
      `"${e.join_date || ""}"`,
      `"${e.status || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_guru_staf_jacos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File CSV berhasil diekspor.");
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const exportRows = filteredData.map((e) => ({
      "ID Pegawai": e.employee_code || "-",
      "NIK KTP": e.nik || "-",
      "Nama Lengkap": e.full_name,
      "Tipe Karyawan": e.employee_type,
      "Jabatan / Posisi": e.position || "-",
      "Email": e.email,
      "No HP / WhatsApp": e.phone || "-",
      "Tempat Lahir": e.birth_place || "-",
      "Tanggal Lahir": e.birth_date || "-",
      "Jenis Kelamin": e.gender || "-",
      "Agama": e.religion || "-",
      "Alamat": e.address || "-",
      "Pendidikan Terakhir": e.last_education || "-",
      "Jurusan": e.major || "-",
      "Bidang Akademik": e.academic_field || "-",
      "GPA / Nilai": e.gpa || "-",
      "Status Kontrak": e.contract_status || "-",
      "Tanggal Bergabung": e.join_date || "-",
      "Status Keaktifan": e.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Guru & Staf");
    XLSX.writeFile(workbook, `Data_Guru_Staf_JACOS_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast("File Excel (.xlsx) berhasil diekspor.");
  };

  // Download Template
  const handleDownloadTemplate = (format: "csv" | "xlsx") => {
    const templateData = [
      {
        "ID Pegawai (Opsional)": "JCS2026001",
        "NIK KTP (Wajib 16 Digit)": "3171012345670001",
        "Nama Lengkap (Wajib)": "Ahmad Fauzi, S.Pd",
        "Tipe Karyawan (GURU/STAF/KARYAWAN)": "GURU",
        "Jabatan / Posisi": "Guru Matematika SMP",
        "Email (Wajib)": "ahmad.fauzi@jacos.sch.id",
        "No HP / WA (Min 8 Digit)": "081234567890",
        "Tempat Lahir": "Jakarta",
        "Tanggal Lahir (YYYY-MM-DD)": "1990-05-15",
        "Jenis Kelamin (LAKI_LAKI/PEREMPUAN)": "LAKI_LAKI",
        "Agama (ISLAM/KRISTEN/dll)": "ISLAM",
        "Alamat Lengkap": "Jl. Tebet Barat Dalam No. 12, Jakarta Selatan",
        "Pendidikan Terakhir (SMA/D3/S1/S2/S3)": "S1",
        "Jurusan (Wajib)": "Pendidikan Matematika",
        "Bidang Akademik": "Matematika & Sains",
        "GPA / Nilai Akhir": "3.85",
        "Status Kontrak (TETAP/KONTRAK/PROBATION)": "TETAP",
        "Tanggal Bergabung (YYYY-MM-DD)": "2024-07-01",
        "Status (ACTIVE/INACTIVE)": "ACTIVE",
      },
    ];

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template_Guru_Staf");
      XLSX.writeFile(wb, "Template_Import_Guru_Staf_JACOS.xlsx");
    } else {
      const csv = Papa.unparse(templateData);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_Import_Guru_Staf_JACOS.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle File Upload (Parse XLSX or CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);
        parseRawImportRows(rawJson);
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parseRawImportRows(results.data as any[]);
        },
      });
    }
  };

  const parseRawImportRows = (rows: any[]) => {
    const parsed: EmployeeInput[] = [];

    rows.forEach((r) => {
      const name = r["Nama Lengkap (Wajib)"] || r["Nama Lengkap"] || r["Nama"] || r["full_name"] || "";
      const email = r["Email (Wajib)"] || r["Email"] || r["email"] || "";
      const nik = (r["NIK KTP (Wajib 16 Digit)"] || r["NIK KTP (Wajib)"] || r["NIK KTP"] || r["NIK"] || r["nik"] || "").toString().trim();

      if (name && email) {
        parsed.push({
          employee_code: (r["ID Pegawai (Opsional)"] || r["ID Pegawai"] || r["employee_code"] || "").toString().trim(),
          nik: nik || `317101${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          full_name: name.toString().trim(),
          employee_type: ((r["Tipe Karyawan (GURU/STAF/KARYAWAN)"] || r["Tipe Karyawan"] || r["employee_type"] || "STAF").toString().toUpperCase()) as any,
          position: (r["Jabatan / Posisi"] || r["Jabatan"] || r["position"] || "Staf").toString().trim(),
          email: email.toString().trim().toLowerCase(),
          phone: (r["No HP / WA (Min 8 Digit)"] || r["No HP / WA"] || r["No HP"] || r["phone"] || "").toString().trim(),
          birth_place: (r["Tempat Lahir"] || r["birth_place"] || "").toString().trim(),
          birth_date: r["Tanggal Lahir (YYYY-MM-DD)"] || r["Tanggal Lahir"] || r["birth_date"] || null,
          gender: ((r["Jenis Kelamin (LAKI_LAKI/PEREMPUAN)"] || r["Jenis Kelamin"] || "LAKI_LAKI").toString().toUpperCase()) as any,
          religion: ((r["Agama (ISLAM/KRISTEN/dll)"] || r["Agama"] || "ISLAM").toString().toUpperCase()) as any,
          address: (r["Alamat Lengkap"] || r["Alamat"] || r["address"] || "").toString().trim(),
          last_education: (r["Pendidikan Terakhir (SMA/D3/S1/S2/S3)"] || r["Pendidikan Terakhir"] || r["last_education"] || "S1").toString().trim(),
          major: (r["Jurusan (Wajib)"] || r["Jurusan"] || r["major"] || "Pendidikan Umum").toString().trim(),
          academic_field: (r["Bidang Akademik"] || r["academic_field"] || "").toString().trim(),
          gpa: (r["GPA / Nilai Akhir"] || r["GPA"] || r["gpa"] || "").toString().trim(),
          contract_status: ((r["Status Kontrak (TETAP/KONTRAK/PROBATION)"] || r["Status Kontrak"] || "TETAP").toString().toUpperCase()) as any,
          join_date: r["Tanggal Bergabung (YYYY-MM-DD)"] || r["Tanggal Bergabung"] || new Date().toISOString().split("T")[0],
          status: ((r["Status (ACTIVE/INACTIVE)"] || r["Status"] || "ACTIVE").toString().toUpperCase()) as any,
        });
      }
    });

    setImportRecords(parsed);
  };

  // Commit Batch Import
  const handleCommitImport = () => {
    if (importRecords.length === 0) {
      showToast("Tidak ada data valid untuk diimpor.", true);
      return;
    }

    startTransition(async () => {
      const res = await importEmployeesBatch(importRecords);
      if (res.success) {
        setIsImportOpen(false);
        setImportRecords([]);
        setImportFileName(null);
        showToast(`Berhasil mengimpor ${res.count || importRecords.length} data pegawai!`);
        window.location.reload();
      } else {
        showToast(res.error || "Gagal mengimpor batch data.", true);
      }
    });
  };

  // Helper format WhatsApp link
  const formatWaLink = (phone: string | null) => {
    if (!phone) return "#";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
    return `https://wa.me/${cleaned}`;
  };

  // Live validation states
  const nikDigits = (formData.nik || "").replace(/\D/g, "").length;
  const isNikValid = nikDigits === 16;
  const phoneDigits = (formData.phone || "").replace(/\D/g, "").length;
  const isPhoneValid = phoneDigits >= 8 && phoneDigits <= 15;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test((formData.email || "").trim());

  // Error indicators for tabs
  const hasPersonalErrors = Boolean(
    formErrors.full_name || formErrors.nik || formErrors.email || formErrors.phone || formErrors.position
  );
  const hasEducationErrors = Boolean(
    formErrors.last_education || formErrors.major || formErrors.contract_status || formErrors.join_date
  );

  return (
    <div className="space-y-6 sm:space-y-8 w-full font-sans">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-ink/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-leaf-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check size={18} />
          </div>
          <div>
            <p className="text-xs font-bold">{actionSuccess}</p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-950 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-bold">{actionError}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky border border-sky-200">
              <Users size={12} /> Master Data Pegawai
            </span>
            <span className="text-[11px] font-bold text-ink-400">
              Total: {data.length} Pegawai
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            Data Guru & Staf
          </h1>
          <p className="text-ink-400 text-xs sm:text-sm mt-0.5">
            Manajemen master data seluruh staf & guru JACOS Islamic School dengan sistem ID otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-10 sm:h-11 px-3.5 rounded-2xl bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
            >
              <FileSpreadsheet size={15} /> Excel
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="h-10 sm:h-11 px-3.5 rounded-2xl bg-white border-ink/10 text-ink-500 hover:text-ink text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
            >
              <Download size={15} /> CSV
            </Button>
          </div>

          {/* Import Button */}
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="h-10 sm:h-11 px-4 rounded-2xl bg-white border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
          >
            <Upload size={15} /> Import File
          </Button>

          {/* Add Employee Button */}
          <Button
            onClick={handleOpenAdd}
            className="h-10 sm:h-11 px-5 rounded-2xl bg-ink hover:bg-ink/90 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <Plus size={16} /> Tambah Pegawai
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLE FILTER & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[2rem] p-5 sm:p-7 border border-ink/5 shadow-sm space-y-6">
        {/* Filters & Search Row */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input
              placeholder="Cari nama lengkap, ID Pegawai (JCS...), NIK, jabatan, email, atau no HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 sm:h-12 rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm focus-visible:ring-sky font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 sm:h-12 px-3.5 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink outline-none focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Tipe Pegawai</option>
              <option value="GURU">Guru (Pendidik)</option>
              <option value="STAF">Staf (Administrasi)</option>
              <option value="KARYAWAN">Karyawan / Ops</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 sm:h-12 px-3.5 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink outline-none focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif (Active)</option>
              <option value="INACTIVE">Non-Aktif (Inactive)</option>
            </select>

            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="h-11 sm:h-12 px-3.5 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink outline-none focus:border-sky cursor-pointer"
            >
              <option value="ALL">Semua Pendidikan</option>
              <option value="S3">S3 (Doktor)</option>
              <option value="S2">S2 (Magister)</option>
              <option value="S1">S1 (Sarjana)</option>
              <option value="D3">D3 (Diploma)</option>
              <option value="SMA/SMK">SMA / SMK</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Active Sorter */}
        <div className="flex items-center justify-between text-xs text-ink-400 pt-1">
          <span>
            Menampilkan <strong className="text-ink font-mono">{filteredData.length}</strong> dari{" "}
            <strong className="text-ink font-mono">{data.length}</strong> pegawai
          </span>
          <span className="hidden sm:inline-block">
            Klik judul kolom tabel untuk mengurutkan data (Asc / Desc)
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. INTERACTIVE DATA TABLE (CLICK TO SORT) */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/5 text-[11px] font-bold text-ink-400 uppercase tracking-wider select-none">
                {/* 1. ID Pegawai */}
                <th
                  onClick={() => handleSort("employee_code")}
                  className="pb-3.5 pl-2 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID Pegawai</span>
                    {sortField === "employee_code" ? (
                      sortDirection === "asc" ? <ArrowUp size={12} className="text-sky" /> : <ArrowDown size={12} className="text-sky" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </div>
                </th>

                {/* 2. Nama Lengkap & Email */}
                <th
                  onClick={() => handleSort("full_name")}
                  className="pb-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Lengkap & Kontak</span>
                    {sortField === "full_name" ? (
                      sortDirection === "asc" ? <ArrowUp size={12} className="text-sky" /> : <ArrowDown size={12} className="text-sky" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </div>
                </th>

                {/* 3. Jabatan */}
                <th
                  onClick={() => handleSort("position")}
                  className="pb-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Jabatan & Pendidikan</span>
                    {sortField === "position" ? (
                      sortDirection === "asc" ? <ArrowUp size={12} className="text-sky" /> : <ArrowDown size={12} className="text-sky" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </div>
                </th>

                {/* 4. No HP / WhatsApp */}
                <th
                  onClick={() => handleSort("phone")}
                  className="pb-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>WhatsApp</span>
                    {sortField === "phone" ? (
                      sortDirection === "asc" ? <ArrowUp size={12} className="text-sky" /> : <ArrowDown size={12} className="text-sky" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </div>
                </th>

                {/* 5. Status */}
                <th
                  onClick={() => handleSort("status")}
                  className="pb-3.5 text-center cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    {sortField === "status" ? (
                      sortDirection === "asc" ? <ArrowUp size={12} className="text-sky" /> : <ArrowDown size={12} className="text-sky" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </div>
                </th>

                {/* 6. Action */}
                <th className="pb-3.5 text-right pr-3">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink/5">
              {filteredData.map((emp) => {
                const isActive = emp.status?.toUpperCase() === "ACTIVE";
                const initials = emp.full_name
                  ? emp.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "EMP";

                return (
                  <tr
                    key={emp.id}
                    className="group hover:bg-cloud/40 transition-colors"
                  >
                    {/* ID Pegawai */}
                    <td className="py-4 pl-2">
                      <span className="font-mono text-xs font-extrabold text-ink bg-cloud/80 px-2.5 py-1 rounded-lg border border-ink/5">
                        {emp.employee_code || "JCS-EMP"}
                      </span>
                    </td>

                    {/* Nama & Email */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={emp.full_name}
                            className="w-10 h-10 rounded-2xl object-cover border border-ink/10 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky border border-sky-100 flex items-center justify-center font-display font-black text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            onClick={() => handleOpenDetail(emp)}
                            className="font-bold text-sm text-ink group-hover:text-sky transition-colors text-left truncate block cursor-pointer hover:underline"
                          >
                            {emp.full_name}
                          </button>
                          <p className="text-[11px] text-ink-400 font-medium truncate flex items-center gap-1.5">
                            <span>{emp.email}</span>
                            {emp.nik && (
                              <span className="font-mono text-[10px] text-ink-300">
                                • NIK: {emp.nik.slice(0, 6)}...
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan & Tipe */}
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-ink text-xs">
                          {emp.position || emp.employee_type}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              emp.employee_type === "GURU"
                                ? "bg-sky-50 text-sky-700"
                                : emp.employee_type === "STAF"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {emp.employee_type}
                          </span>
                          {emp.last_education && (
                            <span className="text-[10px] font-semibold text-ink-500 bg-cloud px-1.5 py-0.5 rounded">
                              {emp.last_education}
                              {emp.major ? ` • ${emp.major}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* No HP / WA */}
                    <td className="py-4">
                      {emp.phone ? (
                        <a
                          href={formatWaLink(emp.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition cursor-pointer"
                        >
                          <Phone size={12} /> {emp.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-ink-300">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isActive
                            ? "bg-leaf-50 text-leaf-700 border-leaf-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isActive ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right pr-3">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenDetail(emp)}
                          title="Lihat Detail Profil"
                          className="w-8 h-8 rounded-xl bg-white border border-ink/10 text-ink-400 hover:text-sky hover:border-sky-200 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-90"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit Data"
                          className="w-8 h-8 rounded-xl bg-white border border-ink/10 text-ink-400 hover:text-amber-600 hover:border-amber-200 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-90"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(emp.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          title="Nonaktifkan Pegawai"
                          className="w-8 h-8 rounded-xl bg-white border border-ink/10 text-ink-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={36} className="opacity-20 text-ink" />
                      <p className="text-sm font-bold text-ink">Tidak ada data pegawai ditemukan</p>
                      <p className="text-xs text-ink-400">
                        Coba sesuaikan kata kunci pencarian atau filter yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card format) */}
        <div className="md:hidden space-y-3">
          {filteredData.map((emp) => {
            const isActive = emp.status?.toUpperCase() === "ACTIVE";
            const initials = emp.full_name
              ? emp.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "EMP";

            return (
              <div
                key={emp.id}
                className="bg-cloud/30 border border-ink/5 rounded-2xl p-4 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {emp.photo_url ? (
                      <img
                        src={emp.photo_url}
                        alt={emp.full_name}
                        className="w-11 h-11 rounded-2xl object-cover border border-ink/10 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky border border-sky-100 flex items-center justify-center font-display font-black text-xs shrink-0 shadow-2xs">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{emp.full_name}</p>
                      <span className="font-mono text-[11px] font-extrabold text-sky-700">
                        {emp.employee_code || "JCS-EMP"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      isActive
                        ? "bg-leaf-50 text-leaf-700 border-leaf-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isActive ? "Aktif" : "Non-Aktif"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-ink/5">
                  <div>
                    <p className="text-[10px] font-bold text-ink-300 uppercase">Jabatan</p>
                    <p className="font-semibold text-ink truncate">{emp.position || emp.employee_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ink-300 uppercase">Kontak</p>
                    {emp.phone ? (
                      <a
                        href={formatWaLink(emp.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        {emp.phone}
                      </a>
                    ) : (
                      <span className="text-ink-400">-</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/5">
                  <Button
                    onClick={() => handleOpenDetail(emp)}
                    variant="outline"
                    className="h-8 px-3 rounded-xl text-xs font-bold border-ink/10"
                  >
                    <Eye size={12} className="mr-1" /> Detail
                  </Button>
                  <Button
                    onClick={() => handleOpenEdit(emp)}
                    variant="outline"
                    className="h-8 px-3 rounded-xl text-xs font-bold border-ink/10 text-amber-700"
                  >
                    <Edit2 size={12} className="mr-1" /> Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setDeletingId(emp.id);
                      setIsDeleteConfirmOpen(true);
                    }}
                    variant="outline"
                    className="h-8 px-3 rounded-xl text-xs font-bold border-rose-200 text-rose-600"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DETAIL PEGAWAI (RE-DESIGNED, EXECUTIVE & CRYSTAL CLEAR) */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] flex flex-col border border-ink/10 shadow-2xl overflow-hidden">
             
            {/* Header Hero Executive Banner */}
            <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white p-6 sm:p-8 shrink-0 overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Top Navigation Row */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-sky-200 border border-white/15 backdrop-blur-md">
                    <ShieldCheck size={12} className="text-sky-300" /> Profil Terverifikasi HR
                  </span>
                  <span className="text-[11px] font-mono font-black text-white/90 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15">
                    {selectedEmployee.employee_code}
                  </span>
                </div>

                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer backdrop-blur-md active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Main Row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {selectedEmployee.photo_url ? (
                    <img
                      src={selectedEmployee.photo_url}
                      alt={selectedEmployee.full_name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white/25 shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white flex items-center justify-center font-display font-black text-3xl shadow-2xl ring-4 ring-white/25">
                      {selectedEmployee.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                      selectedEmployee.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    title={selectedEmployee.status === "ACTIVE" ? "Pegawai Aktif" : "Non-Aktif"}
                  />
                </div>

                {/* Profile Identity Info */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        selectedEmployee.employee_type === "GURU"
                          ? "bg-sky-400/20 text-sky-200 border border-sky-400/30"
                          : selectedEmployee.employee_type === "STAF"
                          ? "bg-purple-400/20 text-purple-200 border border-purple-400/30"
                          : "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                      }`}
                    >
                      {selectedEmployee.employee_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                        selectedEmployee.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedEmployee.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                      {selectedEmployee.status === "ACTIVE" ? "Pegawai Aktif" : "Non-Aktif"}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    {selectedEmployee.full_name}
                  </h2>
                  <p className="text-sky-200/90 text-sm font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <Building size={14} className="text-sky-400" />
                    {selectedEmployee.position || selectedEmployee.employee_type}
                  </p>

                  {/* Quick Action Contacts */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    {selectedEmployee.phone && (
                      <a
                        href={formatWaLink(selectedEmployee.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <MessageCircle size={13} /> Chat WhatsApp
                      </a>
                    )}
                    {selectedEmployee.email && (
                      <a
                        href={`mailto:${selectedEmployee.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition active:scale-95 cursor-pointer"
                      >
                        <Mail size={13} /> Kirim Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Information Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/50">
              
              {/* SECTION 1: DATA PRIBADI & IDENTITAS */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-sky flex items-center justify-center font-bold">
                      <IdCard size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-md uppercase tracking-wider text-ink">
                        Data Pribadi & Identitas KTP
                      </h3>
                      <p className="text-xs text-ink-400">Verifikasi identitas dan kontak pegawai</p>
                    </div>
                  </div>
                  {selectedEmployee.nik && (
                    <button
                      onClick={() => handleCopy(selectedEmployee.nik, "NIK KTP")}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-100 transition cursor-pointer"
                    >
                      {copiedKey === "NIK KTP" ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedKey === "NIK KTP" ? "Tersalin!" : "Salin NIK"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NIK */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      NIK KTP (16 Digit)
                    </span>
                    <p className="font-mono text-sm font-black text-ink tracking-wider">
                      {formatNikDisplay(selectedEmployee.nik)}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Email Aktif
                    </span>
                    <p className="font-bold text-sm text-ink truncate">
                      {selectedEmployee.email}
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      No. WhatsApp / HP
                    </span>
                    <p className="font-mono text-sm font-black text-emerald-700">
                      {selectedEmployee.phone || "-"}
                    </p>
                  </div>

                  {/* Tempat Tanggal Lahir */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Tempat, Tanggal Lahir
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.birth_place || "-"},{" "}
                      {formatIndoDate(selectedEmployee.birth_date)}
                    </p>
                  </div>

                  {/* Jenis Kelamin & Agama */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Jenis Kelamin & Agama
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} •{" "}
                      {selectedEmployee.religion || "Islam"}
                    </p>
                  </div>

                  {/* Alamat KTP */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink-400">
                      <MapPin size={12} className="text-ink-300" />
                      <span>Alamat Lengkap Sesuai KTP</span>
                    </div>
                    <p className="font-medium text-sm text-ink leading-relaxed">
                      {selectedEmployee.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INFORMASI PENDIDIKAN & KEAHLIAN */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-ink/5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-md uppercase tracking-wider text-ink">
                      Pendidikan Terakhir & Kompetensi Akademik
                    </h3>
                    <p className="text-xs text-ink-400">Kualifikasi gelar dan keahlian spesifik</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pendidikan Terakhir */}
                  <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700/80 block mb-0.5">
                        Jenjang Pendidikan
                      </span>
                      <p className="font-display font-black text-base text-purple-950">
                        {selectedEmployee.last_education || "-"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                      <GraduationCap size={20} />
                    </div>
                  </div>

                  {/* GPA / Nilai */}
                  <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700/80 block mb-0.5">
                        Nilai Akhir / IPK (GPA)
                      </span>
                      <p className="font-mono font-black text-base text-purple-950">
                        {selectedEmployee.gpa || "-"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                      <Award size={20} />
                    </div>
                  </div>

                  {/* Jurusan */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Jurusan / Program Studi
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.major || "-"}
                    </p>
                  </div>

                  {/* Bidang Akademik */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Bidang Akademik / Spesialisasi
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.academic_field || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: STATUS KEPEGAWAIAN & KONTRAK */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-ink/5">
                  <div className="w-8 h-8 rounded-xl bg-coral-50 text-coral flex items-center justify-center font-bold">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-md uppercase tracking-wider text-ink">
                      Status Kepegawaian & Kontrak Kerja
                    </h3>
                    <p className="text-xs text-ink-400">Perjanjian ikatan dinas dan masa kontrak</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipe Karyawan */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Tipe Karyawan
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.employee_type}
                    </p>
                  </div>

                  {/* Status Kontrak */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Status Kontrak
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.contract_status === "TETAP"
                        ? "Karyawan Tetap (Permanen)"
                        : selectedEmployee.contract_status === "KONTRAK"
                        ? "Kontrak Kerja (PKWT)"
                        : "Probation (Masa Percobaan)"}
                    </p>
                  </div>

                  {/* Tanggal Bergabung */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Tanggal Bergabung
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {formatIndoDate(selectedEmployee.join_date)}
                    </p>
                  </div>

                  {/* Berakhir Kontrak */}
                  <div className="bg-cloud/40 p-3.5 rounded-2xl border border-ink/5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-400 block">
                      Berakhir Kontrak
                    </span>
                    <p className="font-bold text-sm text-ink">
                      {selectedEmployee.contract_end_date
                        ? formatIndoDate(selectedEmployee.contract_end_date)
                        : "Karyawan Tetap"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-5 sm:p-6 bg-white border-t border-ink/5 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] font-medium text-ink-400 hidden sm:inline-block">
                Master Data terdaftar di database resmi JACOS
              </span>

              <div className="flex items-center gap-2.5 ml-auto">
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  variant="outline"
                  className="h-11 px-5 rounded-2xl border-ink/10 text-xs font-bold hover:bg-cloud/80 cursor-pointer"
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenEdit(selectedEmployee);
                  }}
                  className="h-11 px-6 rounded-2xl bg-ink hover:bg-ink/90 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition active:scale-95"
                >
                  <Edit2 size={14} /> Edit Data Pegawai
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL FORM: TAMBAH & EDIT PEGAWAI (RE-DESIGNED, ELEGANT, & VALIDATED) */}
      {/* ========================================================================= */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-ink/10 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-50/70 via-white to-purple-50/70 p-6 sm:p-7 border-b border-ink/5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky text-white">
                    <Sparkles size={11} /> JACOS HR Portal
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-ink bg-white/90 px-2.5 py-0.5 rounded-lg border border-ink/10 shadow-2xs">
                    <Lock size={11} className="text-ink-400" /> {formData.employee_code || "Auto JCS..."}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-ink tracking-tight">
                  {editingEmployee ? "Perbarui Data Pegawai" : "Tambah Pegawai Baru"}
                </h2>
                <p className="text-ink-400 text-xs mt-0.5">
                  Lengkapi seluruh informasi data diri, verifikasi KTP, foto resmi, pendidikan, dan status kontrak.
                </p>
              </div>

              <button
                onClick={() => setIsAddEditOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white hover:bg-cloud/80 text-ink-400 hover:text-ink border border-ink/10 flex items-center justify-center cursor-pointer transition shadow-2xs active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Switcher Bar */}
            <div className="px-6 sm:px-8 pt-4 pb-2 bg-white">
              <div className="grid grid-cols-2 p-1.5 bg-cloud/60 rounded-2xl border border-ink/5 text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFormTab("personal")}
                  className={`py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2.5 ${
                    activeFormTab === "personal"
                      ? "bg-white text-ink shadow-sm border border-ink/10 font-extrabold"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    activeFormTab === "personal" ? "bg-sky text-white" : "bg-ink/10 text-ink-500"
                  }`}>
                    1
                  </div>
                  <span>1. Data Pribadi & Kontak</span>
                  {hasPersonalErrors && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ml-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFormTab("education")}
                  className={`py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2.5 ${
                    activeFormTab === "education"
                      ? "bg-white text-ink shadow-sm border border-ink/10 font-extrabold"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    activeFormTab === "education" ? "bg-purple-600 text-white" : "bg-ink/10 text-ink-500"
                  }`}>
                    2
                  </div>
                  <span>2. Pendidikan & Kepegawaian</span>
                  {hasEducationErrors && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ml-1" />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Form Area */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Validation Error Banner (if any) */}
              {Object.keys(formErrors).length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle size={16} className="text-rose-600" />
                    <span>Mohon perbaiki data wajib berikut sebelum menyimpan:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1 font-medium">
                    {Object.values(formErrors).filter(Boolean).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeFormTab === "personal" ? (
                /* ================= STEP 1: DATA PRIBADI & KONTAK ================= */
                <div className="space-y-6">
                  {/* Photo Upload Zone (Card Style) */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-cloud/30 border border-ink/5 flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar Container with Upload Icon */}
                    <div className="relative group shrink-0">
                      {formData.photo_url ? (
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-sky-300 shadow-md">
                          <img
                            src={formData.photo_url}
                            alt="Foto Profil"
                            className="w-full h-full object-cover"
                          />
                          <div
                            onClick={() => photoInputRef.current?.click()}
                            className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          >
                            <Camera size={22} />
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => photoInputRef.current?.click()}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-2 border-dashed border-sky-300 hover:border-sky flex flex-col items-center justify-center text-ink-400 hover:text-sky gap-1.5 shadow-2xs cursor-pointer transition"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky flex items-center justify-center">
                            <Camera size={20} />
                          </div>
                          <span className="text-[10px] font-extrabold text-sky-700">Upload Foto</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-ink text-white hover:bg-sky flex items-center justify-center shadow-md transition cursor-pointer active:scale-95"
                        title="Upload atau ganti foto profil"
                      >
                        <Upload size={14} />
                      </button>

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Upload Explanations & Action Buttons */}
                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Label className="text-sm font-extrabold text-ink">Foto Profil Guru / Staf</Label>
                        <span className="text-[10px] font-bold text-ink-400 bg-cloud px-2 py-0.5 rounded-md">
                          Format JPG/PNG/WEBP (Maks 2MB)
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 leading-relaxed">
                        Foto ini akan digunakan pada portal absensi digital, kartu tanda pengenal (ID Card), serta direktori wali kelas.
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2">
                        <Button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          variant="outline"
                          className="h-9 px-4 rounded-xl text-xs font-bold border-ink/10 bg-white hover:bg-cloud/80 cursor-pointer"
                        >
                          <Upload size={13} className="mr-1.5" /> Pilih File Foto
                        </Button>
                        {formData.photo_url && (
                          <Button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, photo_url: "" }))}
                            variant="ghost"
                            className="h-9 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            Hapus Foto
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 1: ID Pegawai (Auto) & NIK KTP (16 Digit Wajib) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-bold text-ink">ID Pegawai (Auto-Generate)</Label>
                        <span className="text-[10px] font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          Format JCS[Tahun][Urut]
                        </span>
                      </div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                        <Input
                          disabled
                          value={formData.employee_code}
                          className="pl-10 h-11 font-mono font-black bg-cloud/70 text-sky-900 rounded-2xl text-xs border-ink/10 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-bold text-ink">
                          NIK KTP <span className="text-rose-500">*</span>
                        </Label>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isNikValid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : nikDigits > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {isNikValid ? "✓ 16/16 Sesuai" : `${nikDigits}/16 Digit`}
                        </span>
                      </div>
                      <div className="relative">
                        <IdCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                        <Input
                          required
                          maxLength={16}
                          placeholder="Masukkan 16 digit NIK (contoh: 3171012345670001)"
                          value={formData.nik}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormData((prev) => ({ ...prev, nik: val }));
                            if (val.length === 16) {
                              setFormErrors((prev) => ({ ...prev, nik: "" }));
                            }
                          }}
                          className={`pl-10 h-11 font-mono text-xs font-semibold rounded-2xl tracking-wider transition ${
                            formErrors.nik
                              ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30"
                              : isNikValid
                              ? "border-emerald-500/50 bg-emerald-50/10 focus-visible:ring-emerald-500"
                              : "border-ink/10 focus-visible:ring-sky"
                          }`}
                        />
                      </div>
                      {formErrors.nik && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {formErrors.nik}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Nama Lengkap (dengan Gelar) & Tipe Karyawan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <Label className="text-xs font-bold text-ink mb-1.5 block">
                        Nama Lengkap (dengan Gelar) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        required
                        placeholder="Contoh: Ahmad Fauzi, S.Pd"
                        value={formData.full_name}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, full_name: e.target.value }));
                          if (e.target.value.trim().length >= 3) {
                            setFormErrors((prev) => ({ ...prev, full_name: "" }));
                          }
                        }}
                        className={`h-11 rounded-2xl text-xs font-bold ${
                          formErrors.full_name ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30" : "border-ink/10"
                        }`}
                      />
                      {formErrors.full_name && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {formErrors.full_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-ink mb-1.5 block">
                        Tipe Karyawan <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        value={formData.employee_type}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, employee_type: e.target.value as any }))
                        }
                        className="w-full h-11 px-3.5 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink outline-none focus:border-sky cursor-pointer"
                      >
                        <option value="GURU">GURU (Tenaga Pendidik / Pengajar)</option>
                        <option value="STAF">STAF (Administrasi / Finance / HR)</option>
                        <option value="KARYAWAN">KARYAWAN (Kepala Ops / Security / Maintenance)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Nama Jabatan / Posisi Spesifik */}
                  <div>
                    <Label className="text-xs font-bold text-ink mb-1.5 block">
                      Nama Jabatan / Posisi Spesifik <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="Contoh: Guru Matematika SMP / Kepala Operasional / Staff HR / Security Officer"
                      value={formData.position || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, position: e.target.value }));
                        if (e.target.value.trim().length >= 2) {
                          setFormErrors((prev) => ({ ...prev, position: "" }));
                        }
                      }}
                      className={`h-11 rounded-2xl text-xs font-medium ${
                        formErrors.position ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30" : "border-ink/10"
                      }`}
                    />
                    {formErrors.position && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {formErrors.position}
                      </p>
                    )}
                  </div>

                  {/* Row 4: Email Aktif & No HP/WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-bold text-ink">
                          Email Aktif <span className="text-rose-500">*</span>
                        </Label>
                        {isEmailValid && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ✓ Format Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                        <Input
                          required
                          type="email"
                          placeholder="ahmad.fauzi@jacos.sch.id"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, email: e.target.value }));
                            if (emailRegex.test(e.target.value.trim())) {
                              setFormErrors((prev) => ({ ...prev, email: "" }));
                            }
                          }}
                          className={`pl-10 h-11 rounded-2xl text-xs font-medium ${
                            formErrors.email
                              ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30"
                              : isEmailValid
                              ? "border-emerald-500/50 bg-emerald-50/10"
                              : "border-ink/10"
                          }`}
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-bold text-ink">
                          No. HP / WhatsApp <span className="text-rose-500">*</span>
                        </Label>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isPhoneValid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : phoneDigits > 0
                              ? "bg-amber-50 text-amber-700"
                              : "text-ink-400"
                          }`}
                        >
                          {isPhoneValid ? `✓ ${phoneDigits} Digit (Valid)` : `Min. 8 Digit (${phoneDigits}/8)`}
                        </span>
                      </div>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                        <Input
                          required
                          placeholder="Contoh: 081234567890"
                          value={formData.phone || ""}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^\d+]/g, "");
                            setFormData((prev) => ({ ...prev, phone: clean }));
                            if (clean.replace(/\D/g, "").length >= 8) {
                              setFormErrors((prev) => ({ ...prev, phone: "" }));
                            }
                          }}
                          className={`pl-10 h-11 font-mono text-xs rounded-2xl ${
                            formErrors.phone
                              ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30"
                              : isPhoneValid
                              ? "border-emerald-500/50 bg-emerald-50/10"
                              : "border-ink/10"
                          }`}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Tempat Lahir, Tanggal Lahir, Jenis Kelamin */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    <div>
                      <Label className="text-xs font-bold text-ink mb-1.5 block">Tempat Lahir</Label>
                      <Input
                        placeholder="Contoh: Jakarta"
                        value={formData.birth_place || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, birth_place: e.target.value }))}
                        className="h-11 rounded-2xl text-xs border-ink/10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-ink mb-1.5 block">Tanggal Lahir</Label>
                      <Input
                        type="date"
                        value={formData.birth_date || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, birth_date: e.target.value }))}
                        className="h-11 rounded-2xl text-xs border-ink/10 font-medium"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-ink mb-1.5 block">Jenis Kelamin</Label>
                      <select
                        value={formData.gender || "LAKI_LAKI"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                        className="w-full h-11 px-3.5 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink outline-none cursor-pointer"
                      >
                        <option value="LAKI_LAKI">Laki-laki</option>
                        <option value="PEREMPUAN">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 6: Alamat Lengkap Sesuai KTP */}
                  <div>
                    <Label className="text-xs font-bold text-ink mb-1.5 block">
                      Alamat Lengkap Sesuai KTP
                    </Label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-3.5 text-ink-300" />
                      <Textarea
                        rows={2}
                        placeholder="Contoh: Jl. Tebet Barat Dalam No. 12, RT 01/RW 02, Kel. Tebet Barat, Kec. Tebet, Jakarta Selatan"
                        value={formData.address || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                        className="pl-10 rounded-2xl text-xs leading-relaxed border-ink/10"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ================= STEP 2: PENDIDIKAN & KEPEGAWAIAN ================= */
                <div className="space-y-6">
                  {/* Card Section 1: Pendidikan & Akademik */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-purple-50/50 border border-purple-100 space-y-4">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-purple-200/50">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-purple-950">
                          Informasi Pendidikan Terakhir & Kompetensi
                        </h3>
                        <p className="text-[11px] text-purple-700/80">
                          Riwayat latar belakang pendidikan formal & jurusan pegawai (Wajib Diisi)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-purple-950 mb-1.5 block">
                          Pendidikan Terakhir <span className="text-rose-500">*</span>
                        </Label>
                        <select
                          value={formData.last_education || "S1"}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, last_education: e.target.value }));
                            if (e.target.value) {
                              setFormErrors((prev) => ({ ...prev, last_education: "" }));
                            }
                          }}
                          className={`w-full h-11 px-3.5 rounded-2xl bg-white border text-xs font-bold text-ink outline-none focus:border-purple-500 cursor-pointer ${
                            formErrors.last_education ? "border-rose-500 bg-rose-50/30" : "border-purple-200"
                          }`}
                        >
                          <option value="S3">S3 (Doktor)</option>
                          <option value="S2">S2 (Magister)</option>
                          <option value="S1">S1 (Sarjana)</option>
                          <option value="D3">D3 (Diploma)</option>
                          <option value="SMA/SMK">SMA / SMK / Sederajat</option>
                        </select>
                        {formErrors.last_education && (
                          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.last_education}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-purple-950 mb-1.5 block">
                          Jurusan / Program Studi <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          required
                          placeholder="Contoh: Pendidikan Matematika / Ilmu Komputer"
                          value={formData.major || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, major: e.target.value }));
                            if (e.target.value.trim().length >= 2) {
                              setFormErrors((prev) => ({ ...prev, major: "" }));
                            }
                          }}
                          className={`h-11 rounded-2xl text-xs bg-white ${
                            formErrors.major ? "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/30" : "border-purple-200"
                          }`}
                        />
                        {formErrors.major && (
                          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.major}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-purple-950 mb-1.5 block">
                          Bidang Akademik / Spesialisasi
                        </Label>
                        <Input
                          placeholder="Contoh: Sains Terpadu / Bahasa Inggris / Keuangan"
                          value={formData.academic_field || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, academic_field: e.target.value }))}
                          className="h-11 rounded-2xl text-xs bg-white border-purple-200"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-purple-950 mb-1.5 block">
                          Nilai Akhir / GPA (IPK)
                        </Label>
                        <Input
                          placeholder="Contoh: 3.85 / 85.0"
                          value={formData.gpa || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, gpa: e.target.value }))}
                          className="h-11 rounded-2xl text-xs font-mono bg-white border-purple-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Section 2: Status Kontrak & Kepegawaian */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-coral-50/40 border border-coral-100 space-y-4">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-coral-200/50">
                      <div className="w-8 h-8 rounded-xl bg-coral-100 text-coral flex items-center justify-center font-bold">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-coral-950">
                          Status Kontrak & Masa Kerja
                        </h3>
                        <p className="text-[11px] text-coral-700/80">
                          Informasi perjanjian kerja, durasi kontrak, serta status keaktifan (Wajib Diisi)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-coral-950 mb-1.5 block">
                          Status Kontrak <span className="text-rose-500">*</span>
                        </Label>
                        <select
                          value={formData.contract_status || "TETAP"}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, contract_status: e.target.value as any }));
                            if (e.target.value) {
                              setFormErrors((prev) => ({ ...prev, contract_status: "" }));
                            }
                          }}
                          className={`w-full h-11 px-3.5 rounded-2xl bg-white border text-xs font-bold text-ink outline-none focus:border-coral cursor-pointer ${
                            formErrors.contract_status ? "border-rose-500 bg-rose-50/30" : "border-coral-200"
                          }`}
                        >
                          <option value="TETAP">Karyawan Tetap (Permanen)</option>
                          <option value="KONTRAK">Kontrak (PKWT)</option>
                          <option value="PROBATION">Probation (Percobaan)</option>
                        </select>
                        {formErrors.contract_status && (
                          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.contract_status}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-coral-950 mb-1.5 block">
                          Tanggal Bergabung <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          required
                          type="date"
                          value={formData.join_date || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, join_date: e.target.value }));
                            if (e.target.value) {
                              setFormErrors((prev) => ({ ...prev, join_date: "" }));
                            }
                          }}
                          className={`h-11 rounded-2xl text-xs bg-white font-medium ${
                            formErrors.join_date ? "border-rose-500 bg-rose-50/30" : "border-coral-200"
                          }`}
                        />
                        {formErrors.join_date && (
                          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {formErrors.join_date}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-coral-950 mb-1.5 block">
                          Berakhir Kontrak (Jika PKWT)
                        </Label>
                        <Input
                          type="date"
                          value={formData.contract_end_date || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contract_end_date: e.target.value }))
                          }
                          className="h-11 rounded-2xl text-xs bg-white border-coral-200 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-coral-950 mb-1.5 block">
                        Status Keaktifan Pegawai
                      </Label>
                      <select
                        value={formData.status || "ACTIVE"}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                        className="w-full h-11 px-3.5 rounded-2xl bg-white border border-coral-200 text-xs font-bold text-ink outline-none focus:border-coral cursor-pointer"
                      >
                        <option value="ACTIVE">AKTIF (Pegawai Aktif Bertugas)</option>
                        <option value="INACTIVE">TIDAK AKTIF (Cuti Panjang / Non-Aktif)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Footer Action Bar */}
              <div className="pt-4 border-t border-ink/5 flex items-center justify-between gap-3">
                {activeFormTab === "personal" ? (
                  <Button
                    type="button"
                    onClick={handleProceedToEducation}
                    variant="outline"
                    className="h-11 px-5 rounded-2xl text-xs font-bold border-ink/10 hover:bg-cloud cursor-pointer ml-auto"
                  >
                    Lanjut ke Pendidikan & Kepegawaian →
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setActiveFormTab("personal")}
                    variant="outline"
                    className="h-11 px-5 rounded-2xl text-xs font-bold border-ink/10 hover:bg-cloud cursor-pointer"
                  >
                    ← Kembali ke Data Pribadi
                  </Button>
                )}

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={() => setIsAddEditOpen(false)}
                    variant="ghost"
                    className="h-11 px-4 rounded-2xl text-xs font-bold text-ink-400 hover:text-ink cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-11 px-6 rounded-2xl bg-ink hover:bg-ink/90 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Menyimpan Data...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Simpan Data Pegawai
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL IMPORT EXCEL / CSV */}
      {/* ========================================================================= */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-ink/10 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-ink/5">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-ink">
                  Import Data Guru & Staf (.xlsx / .csv)
                </h2>
                <p className="text-ink-400 text-xs mt-0.5">
                  Unggah file Excel atau CSV untuk memasukkan banyak data pegawai secara otomatis.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportRecords([]);
                  setImportFileName(null);
                }}
                className="w-9 h-9 rounded-2xl bg-cloud hover:bg-cloud/80 flex items-center justify-center text-ink-400 hover:text-ink cursor-pointer transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Template Download Area */}
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-sky-950">Belum punya template file?</p>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Unduh template standar kami agar format kolom terpetakan otomatis.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownloadTemplate("xlsx")}
                  variant="outline"
                  className="h-8 px-3 rounded-xl bg-white border-sky-200 text-sky-700 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet size={13} className="mr-1" /> Template .xlsx
                </Button>
                <Button
                  onClick={() => handleDownloadTemplate("csv")}
                  variant="outline"
                  className="h-8 px-3 rounded-xl bg-white border-sky-200 text-sky-700 text-xs font-bold cursor-pointer"
                >
                  <FileText size={13} className="mr-1" /> Template .csv
                </Button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 hover:border-sky rounded-3xl p-8 text-center cursor-pointer transition bg-cloud/20 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-ink/5 flex items-center justify-center text-sky">
                <Upload size={22} />
              </div>
              <div>
                <p className="font-bold text-sm text-ink">
                  {importFileName ? importFileName : "Klik untuk memilih file Excel / CSV"}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">Mendukung file spreadsheet .xlsx, .xls, dan .csv</p>
              </div>
            </div>

            {/* Preview Records */}
            {importRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-ink">
                    Preview Data Siap Impor ({importRecords.length} baris):
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ✓ Valid
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-ink/5 bg-cloud/30 p-2 text-xs divide-y divide-ink/5">
                  {importRecords.map((r, i) => (
                    <div key={i} className="py-2 px-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink">{r.full_name}</p>
                        <p className="text-[11px] text-ink-400">
                          {r.employee_type} - {r.position || "-"} • {r.email}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-sky-700 font-bold">
                        {r.employee_code || "Auto JCS..."}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-ink/5 flex items-center justify-end gap-2.5">
              <Button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportRecords([]);
                  setImportFileName(null);
                }}
                variant="ghost"
                className="h-10 px-4 rounded-xl text-xs font-bold text-ink-400"
              >
                Batal
              </Button>
              <Button
                disabled={importRecords.length === 0 || isPending}
                onClick={handleCommitImport}
                className="h-10 px-5 rounded-xl bg-ink hover:bg-ink/90 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Mengimpor...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Simpan {importRecords.length} Data Pegawai
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL KONFIRMASI HAPUS / NONAKTIFKAN */}
      {/* ========================================================================= */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-ink/10 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Nonaktifkan Pegawai?</h3>
              <p className="text-xs text-ink-400 mt-1 leading-relaxed">
                Data pegawai ini akan dinonaktifkan dari sistem JACOS. Anda dapat mengaktifkannya kembali sewaktu-waktu.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingId(null);
                }}
                variant="outline"
                className="flex-1 h-10 rounded-xl text-xs font-bold border-ink/10"
              >
                Batal
              </Button>
              <Button
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {isPending ? "Memproses..." : "Ya, Nonaktifkan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
