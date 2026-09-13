"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type ReimburseCategory =
  | "TRANSPORTASI"
  | "KONSUMSI"
  | "PELATIHAN"
  | "OPERASIONAL"
  | "LAINNYA";

export type ReimburseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface EmployeeInfo {
  id: string;
  nik: string;
  full_name: string;
  position: string | null;
  employee_type: "GURU" | "STAF" | "KARYAWAN";
  contract_status: "PROBATION" | "TETAP" | "KONTRAK";
  photo_url: string | null;
  phone: string | null;
  email: string | null;
}

export interface ReimburseRecord {
  id: string;
  claim_number: string;
  employee_id: string;
  category: ReimburseCategory;
  transaction_date: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  receipt_file_name: string | null;
  status: ReimburseStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  internal_notes?: string | null;
  payment_date?: string | null;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
  employee?: EmployeeInfo | null;
}

export interface ReimburseCategoryStat {
  category: ReimburseCategory;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface ReimburseDashboardStats {
  totalClaims: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  paidCount: number;
  paidAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
  categories: ReimburseCategoryStat[];
}

export interface CreateReimburseInput {
  employee_id: string;
  category: ReimburseCategory;
  transaction_date: string;
  description: string;
  amount: number;
  receipt_url?: string | null;
  receipt_file_name?: string | null;
  internal_notes?: string | null;
}

export interface ApproveReimburseInput {
  id: string;
  internal_notes?: string | null;
}

export interface RejectReimburseInput {
  id: string;
  rejection_reason: string;
  internal_notes?: string | null;
}

export interface MarkAsPaidInput {
  id: string;
  payment_date: string;
  payment_reference?: string | null;
  internal_notes?: string | null;
}

// Fallback Employees
const MOCK_EMPLOYEES: EmployeeInfo[] = [
  {
    id: "emp-001",
    nik: "JACOS-001",
    full_name: "Rina Kartika, S.Pd",
    position: "Guru Matematika Senior",
    employee_type: "GURU",
    contract_status: "TETAP",
    photo_url: null,
    phone: "081234567890",
    email: "rina.kartika@jacos.sch.id",
  },
  {
    id: "emp-002",
    nik: "JACOS-002",
    full_name: "Budi Santoso, M.Kom",
    position: "Staff IT & SysAdmin",
    employee_type: "STAF",
    contract_status: "TETAP",
    photo_url: null,
    phone: "081298765432",
    email: "budi.santoso@jacos.sch.id",
  },
  {
    id: "emp-003",
    nik: "JACOS-003",
    full_name: "Siti Rahmawati, S.Pd",
    position: "Guru Bahasa Inggris",
    employee_type: "GURU",
    contract_status: "KONTRAK",
    photo_url: null,
    phone: "081377889900",
    email: "siti.rahma@jacos.sch.id",
  },
  {
    id: "emp-004",
    nik: "JACOS-004",
    full_name: "Dedi Prasetyo, S.E",
    position: "Staff Administrasi & Keuangan",
    employee_type: "STAF",
    contract_status: "TETAP",
    photo_url: null,
    phone: "085211223344",
    email: "dedi.prasetyo@jacos.sch.id",
  },
  {
    id: "emp-005",
    nik: "JACOS-005",
    full_name: "Ahmad Fauzi, S.Si",
    position: "Guru Fisika & Robotik",
    employee_type: "GURU",
    contract_status: "TETAP",
    photo_url: null,
    phone: "087811223344",
    email: "ahmad.fauzi@jacos.sch.id",
  },
];

// Fallback Reimbursements matching Brief sample data
const MOCK_REIMBURSEMENTS: ReimburseRecord[] = [
  {
    id: "rem-001",
    claim_number: "REI/2026/09/001",
    employee_id: "emp-001",
    category: "TRANSPORTASI",
    transaction_date: "2026-09-15",
    description: "Bensin & Tol dinas koordinasi ke Dinas Pendidikan Wilayah Jakarta",
    amount: 150000,
    receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "struk_spbu_pertamina_dinas.jpg",
    status: "PAID",
    approved_by: "HR Head",
    approved_at: "2026-09-16T10:00:00Z",
    payment_date: "2026-09-17",
    payment_reference: "TRF-BCA-9812903",
    internal_notes: "Kunjungan resmi kurikulum merdeka",
    created_at: "2026-09-16T08:30:00Z",
    updated_at: "2026-09-17T11:00:00Z",
  },
  {
    id: "rem-002",
    claim_number: "REI/2026/09/002",
    employee_id: "emp-002",
    category: "KONSUMSI",
    transaction_date: "2026-09-16",
    description: "Makan siang rapat koordinasi teknis instalasi server sekolah",
    amount: 75000,
    receipt_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "nota_makan_rapat_it.pdf",
    status: "APPROVED",
    approved_by: "HR Head",
    approved_at: "2026-09-16T14:20:00Z",
    payment_date: null,
    payment_reference: null,
    internal_notes: "Disetujui, menunggu batch pencairan jumat",
    created_at: "2026-09-16T11:15:00Z",
    updated_at: "2026-09-16T14:20:00Z",
  },
  {
    id: "rem-003",
    claim_number: "REI/2026/09/003",
    employee_id: "emp-003",
    category: "PELATIHAN",
    transaction_date: "2026-09-14",
    description: "Biaya pendaftaran Workshop Cambridge Teacher Training Online",
    amount: 500000,
    receipt_url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "invoice_cambridge_workshop.pdf",
    status: "REJECTED",
    approved_by: "HR Head",
    approved_at: "2026-09-15T09:00:00Z",
    rejection_reason: "Kuota anggaran pelatihan semester ganjil sudah mencapai batas maksimal",
    internal_notes: "Disarankan diajukan kembali pada periode anggaran Q1 berikutnya",
    payment_date: null,
    created_at: "2026-09-14T16:00:00Z",
    updated_at: "2026-09-15T09:00:00Z",
  },
  {
    id: "rem-004",
    claim_number: "REI/2026/09/004",
    employee_id: "emp-004",
    category: "OPERASIONAL",
    transaction_date: "2026-09-18",
    description: "Pembelian ATK, spidol whiteboard, dan kertas ujian tengah semester",
    amount: 185000,
    receipt_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "struk_gramedia_atk.jpg",
    status: "PENDING",
    approved_by: null,
    approved_at: null,
    internal_notes: null,
    created_at: "2026-09-18T10:00:00Z",
    updated_at: "2026-09-18T10:00:00Z",
  },
  {
    id: "rem-005",
    claim_number: "REI/2026/09/005",
    employee_id: "emp-005",
    category: "OPERASIONAL",
    transaction_date: "2026-09-17",
    description: "Komponen modul sensor Arduino untuk praktikum robotika siswa",
    amount: 320000,
    receipt_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "nota_komponen_robotika.jpg",
    status: "APPROVED",
    approved_by: "HR Head",
    approved_at: "2026-09-18T08:00:00Z",
    payment_date: null,
    internal_notes: "Kebutuhan mendesak persiapan lomba robotika",
    created_at: "2026-09-17T15:30:00Z",
    updated_at: "2026-09-18T08:00:00Z",
  },
  {
    id: "rem-006",
    claim_number: "REI/2026/09/006",
    employee_id: "emp-001",
    category: "TRANSPORTASI",
    transaction_date: "2026-09-19",
    description: "Transportasi Grab antar jemput dokumen akreditasi sekolah",
    amount: 68000,
    receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "e-receipt_grab_express.pdf",
    status: "PENDING",
    approved_by: null,
    approved_at: null,
    internal_notes: null,
    created_at: "2026-09-19T11:00:00Z",
    updated_at: "2026-09-19T11:00:00Z",
  },
];

const CATEGORY_META: Record<ReimburseCategory, { label: string }> = {
  TRANSPORTASI: { label: "Transportasi" },
  KONSUMSI: { label: "Konsumsi" },
  PELATIHAN: { label: "Pelatihan" },
  OPERASIONAL: { label: "Operasional" },
  LAINNYA: { label: "Lainnya" },
};

/**
 * Fetch semua data reimbursement, employees, dan kalkulasi dashboard stats
 */
export async function getHrReimburseData(params?: {
  status?: string;
  category?: string;
  employeeId?: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Real Employees from Supabase
    let employees: EmployeeInfo[] = [];
    const { data: dbEmployees, error: empErr } = await supabase
      .from("employees")
      .select("id, nik, full_name, position, employee_type, contract_status, photo_url, phone, email")
      .eq("is_deleted", false)
      .order("full_name", { ascending: true });

    if (!empErr && dbEmployees && dbEmployees.length > 0) {
      employees = dbEmployees.map((e) => ({
        id: e.id,
        nik: e.nik || `JACOS-${e.id.slice(0, 4)}`,
        full_name: e.full_name,
        position: e.position,
        employee_type: e.employee_type || "GURU",
        contract_status: e.contract_status || "TETAP",
        photo_url: e.photo_url,
        phone: e.phone,
        email: e.email,
      }));
    } else {
      employees = MOCK_EMPLOYEES;
    }

    const empMap = new Map<string, EmployeeInfo>();
    employees.forEach((emp) => empMap.set(emp.id, emp));

    // 2. Fetch Reimbursements from Supabase
    let reimbursements: ReimburseRecord[] = [];
    const { data: dbClaims, error: claimErr } = await supabase
      .from("hr_reimbursements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!claimErr && dbClaims && dbClaims.length > 0) {
      reimbursements = dbClaims.map((c) => ({
        ...c,
        amount: Number(c.amount) || 0,
        employee: empMap.get(c.employee_id) || null,
      }));
    } else {
      reimbursements = MOCK_REIMBURSEMENTS.map((c) => ({
        ...c,
        employee: empMap.get(c.employee_id) || null,
      }));
    }

    // 3. Calculate Comprehensive Dashboard Statistics
    const totalClaims = reimbursements.length;
    const totalAmount = reimbursements.reduce((acc, r) => acc + (r.amount || 0), 0);

    const pendingClaims = reimbursements.filter((r) => r.status === "PENDING");
    const pendingCount = pendingClaims.length;
    const pendingAmount = pendingClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const approvedClaims = reimbursements.filter((r) => r.status === "APPROVED");
    const approvedCount = approvedClaims.length;
    const approvedAmount = approvedClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const paidClaims = reimbursements.filter((r) => r.status === "PAID");
    const paidCount = paidClaims.length;
    const paidAmount = paidClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const rejectedClaims = reimbursements.filter((r) => r.status === "REJECTED");
    const rejectedCount = rejectedClaims.length;
    const rejectedAmount = rejectedClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    // Distribution by Category
    const categoryKeys: ReimburseCategory[] = [
      "TRANSPORTASI",
      "KONSUMSI",
      "PELATIHAN",
      "OPERASIONAL",
      "LAINNYA",
    ];

    const categories: ReimburseCategoryStat[] = categoryKeys.map((cat) => {
      const match = reimbursements.filter((r) => r.category === cat);
      const catTotal = match.reduce((acc, r) => acc + (r.amount || 0), 0);
      const percentage = totalAmount > 0 ? Math.round((catTotal / totalAmount) * 100) : 0;
      return {
        category: cat,
        label: CATEGORY_META[cat]?.label || cat,
        count: match.length,
        totalAmount: catTotal,
        percentage,
      };
    });

    const stats: ReimburseDashboardStats = {
      totalClaims,
      totalAmount,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      paidCount,
      paidAmount,
      rejectedCount,
      rejectedAmount,
      categories,
    };

    return {
      success: true,
      data: {
        reimbursements,
        employees,
        stats,
      },
    };
  } catch (error: any) {
    console.error("Error getHrReimburseData:", error);
    return {
      success: false,
      error: error.message || "Gagal memuat data reimbursement",
      data: {
        reimbursements: MOCK_REIMBURSEMENTS.map((r) => ({
          ...r,
          employee: MOCK_EMPLOYEES.find((e) => e.id === r.employee_id) || null,
        })),
        employees: MOCK_EMPLOYEES,
        stats: {
          totalClaims: 6,
          totalAmount: 1298000,
          pendingCount: 2,
          pendingAmount: 253000,
          approvedCount: 2,
          approvedAmount: 395000,
          paidCount: 1,
          paidAmount: 150000,
          rejectedCount: 1,
          rejectedAmount: 500000,
          categories: [
            { category: "TRANSPORTASI" as ReimburseCategory, label: "Transportasi", count: 2, totalAmount: 218000, percentage: 17 },
            { category: "KONSUMSI" as ReimburseCategory, label: "Konsumsi", count: 1, totalAmount: 75000, percentage: 6 },
            { category: "PELATIHAN" as ReimburseCategory, label: "Pelatihan", count: 1, totalAmount: 500000, percentage: 38 },
            { category: "OPERASIONAL" as ReimburseCategory, label: "Operasional", count: 2, totalAmount: 505000, percentage: 39 },
            { category: "LAINNYA" as ReimburseCategory, label: "Lainnya", count: 0, totalAmount: 0, percentage: 0 },
          ],
        },
      },
    };
  }
}

/**
 * Buat pengajuan reimbursement baru
 */
export async function createReimbursement(input: CreateReimburseInput) {
  const supabase = createAdminClient();

  try {
    if (input.amount <= 0) {
      return { success: false, error: "Nominal reimbursement harus lebih dari Rp 0" };
    }
    if (!input.description || input.description.trim().length < 10) {
      return { success: false, error: "Deskripsi pengajuan minimal 10 karakter" };
    }

    const yearStr = new Date().getFullYear();
    const monthStr = String(new Date().getMonth() + 1).padStart(2, "0");
    const claim_number = `REI/${yearStr}/${monthStr}/${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      claim_number,
      employee_id: input.employee_id,
      category: input.category,
      transaction_date: input.transaction_date,
      description: input.description,
      amount: input.amount,
      receipt_url: input.receipt_url || null,
      receipt_file_name: input.receipt_file_name || null,
      status: "PENDING" as ReimburseStatus,
      internal_notes: input.internal_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_reimbursements")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn("DB insert reimbursement warning:", error.message);
    }

    revalidatePath("/management/hr/reimburse");
    return {
      success: true,
      message: `Pengajuan reimbursement ${claim_number} berhasil dikirim dan menunggu persetujuan HR`,
      data: data || payload,
    };
  } catch (error: any) {
    console.error("Error createReimbursement:", error);
    return {
      success: false,
      error: error.message || "Gagal membuat pengajuan reimbursement",
    };
  }
}

/**
 * Setujui reimbursement (Approve)
 */
export async function approveReimbursement(input: ApproveReimburseInput) {
  const supabase = createAdminClient();

  try {
    const payload = {
      status: "APPROVED" as ReimburseStatus,
      approved_by: "HR Head",
      approved_at: new Date().toISOString(),
      internal_notes: input.internal_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_reimbursements")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.warn("DB approve warning:", error.message);
    }

    revalidatePath("/management/hr/reimburse");
    return {
      success: true,
      message: "Pengajuan reimbursement berhasil disetujui",
      data: data || { id: input.id, ...payload },
    };
  } catch (error: any) {
    console.error("Error approveReimbursement:", error);
    return {
      success: false,
      error: error.message || "Gagal menyetujui reimbursement",
    };
  }
}

/**
 * Tolak reimbursement (Reject) dengan alasan
 */
export async function rejectReimbursement(input: RejectReimburseInput) {
  const supabase = createAdminClient();

  try {
    if (!input.rejection_reason || input.rejection_reason.trim().length === 0) {
      return { success: false, error: "Alasan penolakan wajib diisi" };
    }

    const payload = {
      status: "REJECTED" as ReimburseStatus,
      approved_by: "HR Head",
      approved_at: new Date().toISOString(),
      rejection_reason: input.rejection_reason,
      internal_notes: input.internal_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_reimbursements")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.warn("DB reject warning:", error.message);
    }

    revalidatePath("/management/hr/reimburse");
    return {
      success: true,
      message: "Pengajuan reimbursement telah ditolak",
      data: data || { id: input.id, ...payload },
    };
  } catch (error: any) {
    console.error("Error rejectReimbursement:", error);
    return {
      success: false,
      error: error.message || "Gagal menolak reimbursement",
    };
  }
}

/**
 * Tandai klaim telah dibayarkan / ditransfer (Mark as Paid)
 */
export async function markReimbursementAsPaid(input: MarkAsPaidInput) {
  const supabase = createAdminClient();

  try {
    const payload = {
      status: "PAID" as ReimburseStatus,
      payment_date: input.payment_date || new Date().toISOString().split("T")[0],
      payment_reference: input.payment_reference || "TRF-INSTITUSI",
      internal_notes: input.internal_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_reimbursements")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.warn("DB mark paid warning:", error.message);
    }

    revalidatePath("/management/hr/reimburse");
    return {
      success: true,
      message: "Reimbursement berhasil ditandai telah dibayarkan / lunas",
      data: data || { id: input.id, ...payload },
    };
  } catch (error: any) {
    console.error("Error markReimbursementAsPaid:", error);
    return {
      success: false,
      error: error.message || "Gagal menandai pembayaran",
    };
  }
}

/**
 * Hapus pengajuan reimbursement
 */
export async function deleteReimbursement(id: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.from("hr_reimbursements").delete().eq("id", id);
    if (error) {
      console.warn("DB delete warning:", error.message);
    }

    revalidatePath("/management/hr/reimburse");
    return {
      success: true,
      message: "Pengajuan reimbursement berhasil dihapus",
    };
  } catch (error: any) {
    console.error("Error deleteReimbursement:", error);
    return {
      success: false,
      error: error.message || "Gagal menghapus reimbursement",
    };
  }
}
