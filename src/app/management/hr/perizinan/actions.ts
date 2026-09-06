"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveTypeRecord {
  id: string;
  name: string;
  annual_quota: number;
  is_deductible: boolean;
  is_active: boolean;
}

export interface LeaveBalanceRecord {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  leave_type_name?: string;
  employee_name?: string;
  employee_code?: string;
  position?: string;
  employee_type?: string;
  photo_url?: string | null;
}

export interface LeaveRequestRecord {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
  document_url?: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    employee_code: string;
    full_name: string;
    position: string | null;
    employee_type: string;
    photo_url: string | null;
    phone: string | null;
  } | null;
  leave_type?: {
    id: string;
    name: string;
    annual_quota: number;
    is_deductible: boolean;
  } | null;
}

export interface LeaveRequestInput {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason: string;
  document_url?: string | null;
}

export interface LeaveDashboardStats {
  totalPending: number;
  totalApprovedThisMonth: number;
  totalRejectedThisMonth: number;
  activeLeaveToday: number;
  totalEmployees: number;
}

/**
 * Fetch all leave requests, master leave types, balances, and employees
 */
export async function getHrLeaveData(params?: {
  year?: number;
  status?: string;
  leaveTypeId?: string;
}) {
  const supabase = createAdminClient();
  const currentYear = params?.year || new Date().getFullYear();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch Leave Types
    const { data: leaveTypes, error: typesErr } = await supabase
      .from("hr_leave_types")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (typesErr) console.error("Error fetching hr_leave_types:", typesErr);

    // If leave types table is empty, auto-seed defaults
    let safeTypes: LeaveTypeRecord[] = (leaveTypes || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      annual_quota: t.annual_quota ?? 12,
      is_deductible: Boolean(t.is_deductible),
      is_active: Boolean(t.is_active),
    }));

    if (safeTypes.length === 0) {
      const defaultTypes = [
        { name: "Cuti Tahunan", annual_quota: 12, is_deductible: true },
        { name: "Cuti Sakit", annual_quota: 0, is_deductible: false },
        { name: "Izin Penting", annual_quota: 3, is_deductible: true },
        { name: "Dinas Luar", annual_quota: 0, is_deductible: false },
      ];
      const { data: seeded } = await supabase
        .from("hr_leave_types")
        .insert(defaultTypes)
        .select();
      if (seeded) {
        safeTypes = seeded.map((t: any) => ({
          id: t.id,
          name: t.name,
          annual_quota: t.annual_quota ?? 12,
          is_deductible: Boolean(t.is_deductible),
          is_active: Boolean(t.is_active),
        }));
      }
    }

    // 2. Fetch Active Employees
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, full_name, position, employee_type, photo_url, phone, status")
      .eq("is_deleted", false)
      .eq("status", "ACTIVE")
      .order("full_name", { ascending: true });

    if (empErr) console.error("Error fetching employees for leave:", empErr);

    const safeEmployees = employees || [];
    const empMap = new Map<string, any>();
    for (const e of safeEmployees) {
      empMap.set(e.id, e);
    }

    const typeMap = new Map<string, LeaveTypeRecord>();
    for (const t of safeTypes) {
      typeMap.set(t.id, t);
    }

    // 3. Fetch Leave Requests
    let reqQuery = supabase
      .from("hr_leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (params?.status && params.status !== "ALL") {
      reqQuery = reqQuery.eq("status", params.status);
    }

    if (params?.leaveTypeId && params.leaveTypeId !== "ALL") {
      reqQuery = reqQuery.eq("leave_type_id", params.leaveTypeId);
    }

    const { data: requests, error: reqErr } = await reqQuery;
    if (reqErr) console.error("Error fetching hr_leave_requests:", reqErr);

    const safeRequests: LeaveRequestRecord[] = (requests || []).map((r: any) => {
      const emp = empMap.get(r.employee_id);
      const lt = typeMap.get(r.leave_type_id);

      return {
        id: r.id,
        employee_id: r.employee_id,
        leave_type_id: r.leave_type_id,
        start_date: r.start_date,
        end_date: r.end_date,
        total_days: Number(r.total_days) || 1,
        reason: r.reason || "",
        status: (r.status as LeaveStatus) || "PENDING",
        approved_by: r.approved_by || null,
        approved_at: r.approved_at || null,
        notes: r.notes || null,
        document_url: r.notes && r.notes.startsWith("http") ? r.notes : null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        employee: emp
          ? {
              id: emp.id,
              employee_code: emp.employee_code || "-",
              full_name: emp.full_name,
              position: emp.position || "-",
              employee_type: emp.employee_type || "STAF",
              photo_url: emp.photo_url || null,
              phone: emp.phone || null,
            }
          : null,
        leave_type: lt || null,
      };
    });

    // 4. Fetch Leave Balances for Current Year
    const { data: balances, error: balErr } = await supabase
      .from("hr_leave_balances")
      .select("*")
      .eq("year", currentYear);

    if (balErr) console.error("Error fetching hr_leave_balances:", balErr);

    const safeBalances: LeaveBalanceRecord[] = (balances || []).map((b: any) => {
      const emp = empMap.get(b.employee_id);
      const lt = typeMap.get(b.leave_type_id);
      const total = Number(b.total_days) || 12;
      const used = Number(b.used_days) || 0;

      return {
        id: b.id,
        employee_id: b.employee_id,
        leave_type_id: b.leave_type_id,
        year: b.year || currentYear,
        total_days: total,
        used_days: used,
        remaining_days: Math.max(0, total - used),
        leave_type_name: lt?.name || "Cuti Tahunan",
        employee_name: emp?.full_name || "Karyawan",
        employee_code: emp?.employee_code || "-",
        position: emp?.position || "-",
        employee_type: emp?.employee_type || "STAF",
        photo_url: emp?.photo_url || null,
      };
    });

    // 5. Compute Stats
    const totalPending = safeRequests.filter((r) => r.status === "PENDING").length;
    const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-09"
    const totalApprovedThisMonth = safeRequests.filter(
      (r) => r.status === "APPROVED" && r.start_date.startsWith(currentMonthPrefix)
    ).length;
    const totalRejectedThisMonth = safeRequests.filter(
      (r) => r.status === "REJECTED" && r.created_at.startsWith(currentMonthPrefix)
    ).length;

    // Active on leave today
    const activeLeaveToday = safeRequests.filter(
      (r) =>
        r.status === "APPROVED" &&
        r.start_date <= todayStr &&
        r.end_date >= todayStr
    ).length;

    const stats: LeaveDashboardStats = {
      totalPending,
      totalApprovedThisMonth,
      totalRejectedThisMonth,
      activeLeaveToday,
      totalEmployees: safeEmployees.length,
    };

    return {
      success: true,
      leaveTypes: safeTypes,
      employees: safeEmployees,
      requests: safeRequests,
      balances: safeBalances,
      stats,
    };
  } catch (err: any) {
    console.error("Error in getHrLeaveData:", err);
    return {
      success: false,
      leaveTypes: [],
      employees: [],
      requests: [],
      balances: [],
      stats: {
        totalPending: 0,
        totalApprovedThisMonth: 0,
        totalRejectedThisMonth: 0,
        activeLeaveToday: 0,
        totalEmployees: 0,
      },
      error: err.message || "Gagal mengambil data perizinan",
    };
  }
}

/**
 * Calculate working days between two dates (excluding weekends)
 */
function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (end < start) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    // Exclude Sunday (0) and Saturday (6) if school 5-day week, or at least count positive
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

/**
 * Create a new leave request with balance verification
 */
export async function createLeaveRequest(input: LeaveRequestInput) {
  const supabase = createAdminClient();

  try {
    if (!input.employee_id) {
      return { success: false, message: "Karyawan pemohon wajib dipilih" };
    }
    if (!input.leave_type_id) {
      return { success: false, message: "Jenis perizinan wajib dipilih" };
    }
    if (!input.start_date || !input.end_date) {
      return { success: false, message: "Tanggal mulai dan selesai wajib diisi" };
    }
    if (new Date(input.end_date) < new Date(input.start_date)) {
      return { success: false, message: "Tanggal selesai tidak boleh sebelum tanggal mulai" };
    }
    if (!input.reason || input.reason.trim().length < 3) {
      return { success: false, message: "Alasan pengajuan izin wajib diisi minimal 3 karakter" };
    }

    const totalDays =
      input.total_days || calculateDaysBetween(input.start_date, input.end_date);

    if (totalDays <= 0) {
      return { success: false, message: "Durasi perizinan minimal 1 hari" };
    }

    // 1. Fetch leave type info
    const { data: leaveType, error: typeErr } = await supabase
      .from("hr_leave_types")
      .select("*")
      .eq("id", input.leave_type_id)
      .single();

    if (typeErr || !leaveType) {
      return { success: false, message: "Jenis perizinan tidak ditemukan" };
    }

    const leaveYear = new Date(input.start_date).getFullYear();

    // 2. If deductible (e.g. Cuti Tahunan), ensure balance exists and has enough days
    if (leaveType.is_deductible) {
      let { data: balance } = await supabase
        .from("hr_leave_balances")
        .select("*")
        .eq("employee_id", input.employee_id)
        .eq("leave_type_id", input.leave_type_id)
        .eq("year", leaveYear)
        .single();

      // If no balance record exists yet, initialize it
      if (!balance) {
        const { data: newBal, error: initErr } = await supabase
          .from("hr_leave_balances")
          .insert({
            employee_id: input.employee_id,
            leave_type_id: input.leave_type_id,
            year: leaveYear,
            total_days: leaveType.annual_quota || 12,
            used_days: 0,
          })
          .select()
          .single();
        balance = newBal;
      }

      if (balance) {
        const remaining = (balance.total_days || 12) - (balance.used_days || 0);
        if (remaining < totalDays) {
          return {
            success: false,
            message: `Saldo ${leaveType.name} tidak mencukupi. Sisa saldo: ${remaining} hari, diajukan: ${totalDays} hari.`,
          };
        }
      }
    }

    // 3. Insert leave request
    const insertPayload = {
      employee_id: input.employee_id,
      leave_type_id: input.leave_type_id,
      start_date: input.start_date,
      end_date: input.end_date,
      total_days: totalDays,
      reason: input.reason.trim(),
      status: "PENDING",
      notes: input.document_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_leave_requests")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/management/hr/perizinan");
    revalidatePath("/management/hr");

    return {
      success: true,
      data,
      message: "Permohonan izin berhasil diajukan dan menunggu persetujuan HR",
    };
  } catch (err: any) {
    console.error("Error in createLeaveRequest:", err);
    return {
      success: false,
      message: err.message || "Gagal mengajukan permohonan izin",
    };
  }
}

/**
 * Approve a leave request (updates status, trigger automatically adjusts balance)
 */
export async function approveLeaveRequest(id: string, notes?: string) {
  const supabase = createAdminClient();

  try {
    const { data: req, error: fetchErr } = await supabase
      .from("hr_leave_requests")
      .select("*, hr_leave_types(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !req) {
      return { success: false, message: "Permohonan cuti tidak ditemukan" };
    }

    const { error: updateErr } = await supabase
      .from("hr_leave_requests")
      .update({
        status: "APPROVED",
        approved_at: new Date().toISOString(),
        notes: notes?.trim() || req.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    // Fallback: manually ensure balance updated if DB trigger not fired
    const leaveYear = new Date(req.start_date).getFullYear();
    const isDeductible = req.hr_leave_types?.is_deductible ?? true;

    if (isDeductible) {
      const { data: bal } = await supabase
        .from("hr_leave_balances")
        .select("*")
        .eq("employee_id", req.employee_id)
        .eq("leave_type_id", req.leave_type_id)
        .eq("year", leaveYear)
        .single();

      if (!bal) {
        await supabase.from("hr_leave_balances").insert({
          employee_id: req.employee_id,
          leave_type_id: req.leave_type_id,
          year: leaveYear,
          total_days: req.hr_leave_types?.annual_quota || 12,
          used_days: req.total_days,
        });
      }
    }

    revalidatePath("/management/hr/perizinan");
    revalidatePath("/management/hr");

    return {
      success: true,
      message: "Permohonan izin telah disetujui",
    };
  } catch (err: any) {
    console.error("Error approving leave:", err);
    return {
      success: false,
      message: err.message || "Gagal menyetujui permohonan",
    };
  }
}

/**
 * Reject a leave request (requires rejection note)
 */
export async function rejectLeaveRequest(id: string, reasonNote: string) {
  const supabase = createAdminClient();

  try {
    if (!reasonNote || reasonNote.trim().length < 3) {
      return { success: false, message: "Alasan penolakan izin wajib diisi minimal 3 karakter" };
    }

    const { error } = await supabase
      .from("hr_leave_requests")
      .update({
        status: "REJECTED",
        approved_at: new Date().toISOString(),
        notes: reasonNote.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/management/hr/perizinan");
    revalidatePath("/management/hr");

    return {
      success: true,
      message: "Permohonan izin telah ditolak",
    };
  } catch (err: any) {
    console.error("Error rejecting leave:", err);
    return {
      success: false,
      message: err.message || "Gagal menolak permohonan",
    };
  }
}

/**
 * Delete / cancel a leave request
 */
export async function deleteLeaveRequest(id: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("hr_leave_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/management/hr/perizinan");
    revalidatePath("/management/hr");

    return {
      success: true,
      message: "Permohonan izin berhasil dihapus",
    };
  } catch (err: any) {
    console.error("Error deleting leave request:", err);
    return {
      success: false,
      message: err.message || "Gagal menghapus permohonan",
    };
  }
}

/**
 * Adjust employee leave balance
 */
export async function updateEmployeeLeaveBalance(payload: {
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
}) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("hr_leave_balances")
      .upsert(
        {
          employee_id: payload.employee_id,
          leave_type_id: payload.leave_type_id,
          year: payload.year,
          total_days: Number(payload.total_days),
          used_days: Number(payload.used_days),
        },
        { onConflict: "employee_id,leave_type_id,year" }
      )
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/management/hr/perizinan");
    return {
      success: true,
      data,
      message: "Saldo cuti berhasil disesuaikan",
    };
  } catch (err: any) {
    console.error("Error in updateEmployeeLeaveBalance:", err);
    return {
      success: false,
      message: err.message || "Gagal memperbarui saldo cuti",
    };
  }
}

/**
 * Upload supporting leave document (medical cert, doctor note, assignment letter)
 */
export async function uploadLeaveDocument(formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, message: "File tidak ditemukan" };
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "Ukuran file melebihi batas 5MB" };
  }

  try {
    const ext = file.name.split(".").pop() || "pdf";
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 30);
    const filename = `leave_${Date.now()}_${cleanName}.${ext}`;
    const buffer = await file.arrayBuffer();

    const bucketName = "hr-announcements"; // Reuse or upload

    let { error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadErr) {
      // Fallback bucket
      const fb = await supabase.storage
        .from("announcement-thumbnails")
        .upload(filename, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });
      if (!fb.error) {
        const { data: pubData } = supabase.storage
          .from("announcement-thumbnails")
          .getPublicUrl(filename);
        return {
          success: true,
          url: pubData.publicUrl,
          fileName: file.name,
        };
      }
      throw uploadErr;
    }

    const { data: pubData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return {
      success: true,
      url: pubData.publicUrl,
      fileName: file.name,
    };
  } catch (err: any) {
    console.error("Error uploading leave document:", err);
    return {
      success: false,
      message: err.message || "Gagal mengunggah dokumen pendukung",
    };
  }
}
