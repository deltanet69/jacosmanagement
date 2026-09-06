"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export interface EmployeeRecord {
  id: string;
  employee_code: string;
  nik: string;
  full_name: string;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  photo_url: string | null;
  employee_type: "GURU" | "STAF" | "KARYAWAN";
  contract_status: "PROBATION" | "TETAP" | "KONTRAK";
  position: string | null;
  join_date: string;
  contract_end_date: string | null;
  status: "ACTIVE" | "INACTIVE";
  last_education: string | null;
  major: string | null;
  academic_field: string | null;
  gpa: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeInput {
  employee_code?: string;
  nik: string;
  full_name: string;
  birth_place?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  religion?: string | null;
  address?: string | null;
  phone?: string | null;
  email: string;
  photo_url?: string | null;
  employee_type: "GURU" | "STAF" | "KARYAWAN";
  contract_status?: "PROBATION" | "TETAP" | "KONTRAK";
  position?: string | null;
  join_date?: string;
  contract_end_date?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  last_education?: string | null;
  major?: string | null;
  academic_field?: string | null;
  gpa?: string | null;
}

/**
 * Generate Next Employee Code (e.g. JCS2026001)
 */
export async function getNextEmployeeCode(): Promise<string> {
  const supabase = createAdminClient();
  const currentYr = new Date().getFullYear().toString();
  const prefix = `JCS${currentYr}`;

  try {
    const { data, error } = await supabase
      .from("employees")
      .select("employee_code")
      .ilike("employee_code", `${prefix}%`);

    if (error || !data || data.length === 0) {
      return `${prefix}001`;
    }

    let maxNum = 0;
    for (const item of data) {
      if (item.employee_code) {
        const numPart = parseInt(item.employee_code.replace(prefix, ""), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextNum = (maxNum + 1).toString().padStart(3, "0");
    return `${prefix}${nextNum}`;
  } catch {
    return `${prefix}001`;
  }
}

/**
 * Get all employees
 */
export async function getEmployees(): Promise<EmployeeRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return (data || []).map((e: any) => ({
    ...e,
    employee_code: e.employee_code || e.nik || "JCS-EMP",
  }));
}

/**
 * Create Employee
 */
export async function createEmployee(payload: EmployeeInput): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createAdminClient();

  try {
    // 1. Validasi Nama Lengkap
    if (!payload.full_name || payload.full_name.trim().length < 3) {
      return { success: false, error: "Nama lengkap wajib diisi minimal 3 karakter." };
    }

    // 2. Validasi NIK (16 Digit)
    const cleanNik = (payload.nik || "").replace(/\D/g, "");
    if (!cleanNik || cleanNik.length !== 16) {
      return { success: false, error: "NIK KTP harus tepat 16 digit angka." };
    }

    // 3. Validasi Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!payload.email || !emailRegex.test(payload.email.trim())) {
      return { success: false, error: "Format email tidak valid." };
    }

    // 4. Validasi WhatsApp
    const cleanPhone = (payload.phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: "Nomor WhatsApp / HP wajib diisi minimal 8 digit." };
    }

    // 5. Validasi Posisi / Jabatan
    if (!payload.position || payload.position.trim().length < 2) {
      return { success: false, error: "Jabatan atau posisi spesifik wajib diisi." };
    }

    // 6. Validasi Pendidikan Terakhir & Jurusan (Wajib)
    if (!payload.last_education || !payload.last_education.trim()) {
      return { success: false, error: "Pendidikan terakhir wajib diisi/dipilih." };
    }
    if (!payload.major || payload.major.trim().length < 2) {
      return { success: false, error: "Jurusan / program studi wajib diisi minimal 2 karakter." };
    }

    // 7. Validasi Status Kontrak & Tanggal Bergabung (Wajib)
    if (!payload.contract_status) {
      return { success: false, error: "Status kontrak kerja wajib dipilih." };
    }
    if (!payload.join_date || !payload.join_date.trim()) {
      return { success: false, error: "Tanggal bergabung wajib diisi." };
    }

    let finalCode = payload.employee_code?.trim();
    if (!finalCode) {
      finalCode = await getNextEmployeeCode();
    }

    const newRecord = {
      employee_code: finalCode,
      nik: cleanNik,
      full_name: payload.full_name.trim(),
      birth_place: payload.birth_place?.trim() || null,
      birth_date: payload.birth_date || null,
      gender: payload.gender || "LAKI_LAKI",
      religion: payload.religion || "ISLAM",
      address: payload.address?.trim() || null,
      phone: payload.phone?.trim() || null,
      email: payload.email.trim().toLowerCase(),
      photo_url: payload.photo_url || null,
      employee_type: payload.employee_type || "STAF",
      contract_status: payload.contract_status || "TETAP",
      position: payload.position?.trim() || null,
      join_date: payload.join_date || new Date().toISOString().split("T")[0],
      contract_end_date: payload.contract_end_date || null,
      status: payload.status || "ACTIVE",
      last_education: payload.last_education || "S1",
      major: payload.major?.trim() || null,
      academic_field: payload.academic_field?.trim() || null,
      gpa: payload.gpa?.trim() || null,
      is_deleted: false,
    };

    const { data, error } = await supabase
      .from("employees")
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error("Error creating employee in Supabase:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/management/hr");
    revalidatePath("/management/hr/guru");
    revalidatePath("/management/hr/datastaff");
    return { success: true, data };
  } catch (err: any) {
    console.error("Error in createEmployee action:", err);
    return { success: false, error: err.message || "Gagal menyimpan data pegawai." };
  }
}

/**
 * Update Employee
 */
export async function updateEmployee(id: string, payload: Partial<EmployeeInput>): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createAdminClient();

  try {
    const updateRecord: any = {
      updated_at: new Date().toISOString(),
    };

    if (payload.full_name !== undefined) {
      if (!payload.full_name || payload.full_name.trim().length < 3) {
        return { success: false, error: "Nama lengkap wajib diisi minimal 3 karakter." };
      }
      updateRecord.full_name = payload.full_name.trim();
    }

    if (payload.nik !== undefined) {
      const cleanNik = (payload.nik || "").replace(/\D/g, "");
      if (cleanNik.length !== 16) {
        return { success: false, error: "NIK KTP harus tepat 16 digit angka." };
      }
      updateRecord.nik = cleanNik;
    }

    if (payload.employee_code !== undefined) updateRecord.employee_code = payload.employee_code?.trim() || null;
    if (payload.birth_place !== undefined) updateRecord.birth_place = payload.birth_place?.trim() || null;
    if (payload.birth_date !== undefined) updateRecord.birth_date = payload.birth_date || null;
    if (payload.gender !== undefined) updateRecord.gender = payload.gender;
    if (payload.religion !== undefined) updateRecord.religion = payload.religion;
    if (payload.address !== undefined) updateRecord.address = payload.address?.trim() || null;
    
    if (payload.phone !== undefined) {
      const cleanPhone = (payload.phone || "").replace(/\D/g, "");
      if (cleanPhone.length < 8) {
        return { success: false, error: "Nomor WhatsApp minimal 8 digit angka." };
      }
      updateRecord.phone = payload.phone?.trim() || null;
    }

    if (payload.email !== undefined) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!payload.email || !emailRegex.test(payload.email.trim())) {
        return { success: false, error: "Format email tidak valid." };
      }
      updateRecord.email = payload.email.trim().toLowerCase();
    }

    if (payload.photo_url !== undefined) updateRecord.photo_url = payload.photo_url;
    if (payload.employee_type !== undefined) updateRecord.employee_type = payload.employee_type;
    
    if (payload.position !== undefined) {
      if (!payload.position || payload.position.trim().length < 2) {
        return { success: false, error: "Jabatan atau posisi spesifik wajib diisi." };
      }
      updateRecord.position = payload.position.trim();
    }

    if (payload.last_education !== undefined) {
      if (!payload.last_education || !payload.last_education.trim()) {
        return { success: false, error: "Pendidikan terakhir wajib diisi/dipilih." };
      }
      updateRecord.last_education = payload.last_education;
    }

    if (payload.major !== undefined) {
      if (!payload.major || payload.major.trim().length < 2) {
        return { success: false, error: "Jurusan / program studi wajib diisi minimal 2 karakter." };
      }
      updateRecord.major = payload.major.trim();
    }

    if (payload.contract_status !== undefined) {
      if (!payload.contract_status) {
        return { success: false, error: "Status kontrak kerja wajib dipilih." };
      }
      updateRecord.contract_status = payload.contract_status;
    }

    if (payload.join_date !== undefined) {
      if (!payload.join_date || !payload.join_date.trim()) {
        return { success: false, error: "Tanggal bergabung wajib diisi." };
      }
      updateRecord.join_date = payload.join_date;
    }

    if (payload.contract_end_date !== undefined) updateRecord.contract_end_date = payload.contract_end_date || null;
    if (payload.status !== undefined) updateRecord.status = payload.status;
    if (payload.academic_field !== undefined) updateRecord.academic_field = payload.academic_field?.trim() || null;
    if (payload.gpa !== undefined) updateRecord.gpa = payload.gpa?.trim() || null;

    const { data, error } = await supabase
      .from("employees")
      .update(updateRecord)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/management/hr");
    revalidatePath("/management/hr/guru");
    revalidatePath("/management/hr/datastaff");
    return { success: true, data };
  } catch (err: any) {
    console.error("Error in updateEmployee action:", err);
    return { success: false, error: err.message || "Gagal memperbarui data pegawai." };
  }
}

/**
 * Delete Employee (Soft Delete)
 */
export async function deleteEmployee(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("employees")
      .update({ is_deleted: true, status: "INACTIVE", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting employee:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/management/hr");
    revalidatePath("/management/hr/guru");
    revalidatePath("/management/hr/datastaff");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteEmployee action:", err);
    return { success: false, error: err.message || "Gagal menghapus data pegawai." };
  }
}

/**
 * Batch Import Employees
 */
export async function importEmployeesBatch(records: EmployeeInput[]): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = createAdminClient();

  if (!records || records.length === 0) {
    return { success: false, error: "Tidak ada data untuk diimpor." };
  }

  try {
    const currentYr = new Date().getFullYear().toString();
    const prefix = `JCS${currentYr}`;

    // Get current max code number
    const { data: existingCodes } = await supabase
      .from("employees")
      .select("employee_code")
      .ilike("employee_code", `${prefix}%`);

    let maxNum = 0;
    if (existingCodes) {
      for (const item of existingCodes) {
        if (item.employee_code) {
          const numPart = parseInt(item.employee_code.replace(prefix, ""), 10);
          if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
          }
        }
      }
    }

    const preparedRecords = records.map((rec) => {
      let code = rec.employee_code?.trim();
      if (!code) {
        maxNum++;
        code = `${prefix}${maxNum.toString().padStart(3, "0")}`;
      }

      return {
        employee_code: code,
        nik: rec.nik?.trim() || `NIK-${Math.floor(100000 + Math.random() * 900000)}`,
        full_name: rec.full_name.trim(),
        birth_place: rec.birth_place?.trim() || null,
        birth_date: rec.birth_date || null,
        gender: rec.gender || "LAKI_LAKI",
        religion: rec.religion || "ISLAM",
        address: rec.address?.trim() || null,
        phone: rec.phone?.trim() || null,
        email: rec.email.trim().toLowerCase(),
        photo_url: rec.photo_url || null,
        employee_type: rec.employee_type || "STAF",
        contract_status: rec.contract_status || "PROBATION",
        position: rec.position?.trim() || null,
        join_date: rec.join_date || new Date().toISOString().split("T")[0],
        contract_end_date: rec.contract_end_date || null,
        status: rec.status || "ACTIVE",
        last_education: rec.last_education || "S1",
        major: rec.major?.trim() || "Pendidikan Umum",
        academic_field: rec.academic_field?.trim() || null,
        gpa: rec.gpa?.trim() || null,
        is_deleted: false,
      };
    });

    const { data, error } = await supabase
      .from("employees")
      .upsert(preparedRecords, { onConflict: "email" })
      .select();

    if (error) {
      console.error("Error batch inserting employees:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/management/hr");
    revalidatePath("/management/hr/guru");
    revalidatePath("/management/hr/datastaff");
    return { success: true, count: data?.length || preparedRecords.length };
  } catch (err: any) {
    console.error("Error in importEmployeesBatch:", err);
    return { success: false, error: err.message || "Gagal mengimpor batch data pegawai." };
  }
}
