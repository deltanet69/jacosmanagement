"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type AnnouncementCategory =
  | "KEBIJAKAN_BARU"
  | "INFO_CUTI"
  | "EVENT"
  | "PENTING"
  | "LAINNYA";

export type AnnouncementTarget = "SEMUA" | "GURU" | "STAF" | "HR_ADMIN";

export interface HrAnnouncementRecord {
  id: string;
  title: string;
  category: AnnouncementCategory;
  content: string;
  is_important: boolean;
  target: string[];
  attachment_url: string | null;
  is_archived: boolean;
  is_deleted: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  read_count?: number;
  total_employees?: number;
  author_name?: string;
}

export interface HrAnnouncementInput {
  title: string;
  category: AnnouncementCategory;
  content: string;
  is_important: boolean;
  target: string[];
  attachment_url?: string | null;
  is_archived?: boolean;
}

export interface ReaderEmployee {
  employee_id: string;
  full_name: string;
  employee_code: string;
  position: string | null;
  employee_type: string;
  photo_url: string | null;
  read_at: string | null;
  has_read: boolean;
}

/**
 * Fetch all announcements with read metrics & employee count
 */
export async function getHrAnnouncements(params?: {
  includeArchived?: boolean;
  category?: string;
  target?: string;
  search?: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Get total active employees for read percentage calculation
    const { count: totalEmployeesCount, error: empCountErr } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("status", "ACTIVE");

    const totalEmployees = totalEmployeesCount || 0;

    // 2. Query announcements
    let query = supabase
      .from("hr_announcements")
      .select(`
        id,
        title,
        category,
        content,
        is_important,
        target,
        attachment_url,
        is_archived,
        is_deleted,
        created_by,
        created_at,
        updated_at
      `)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (!params?.includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data: rawAnnouncements, error: annErr } = await query;

    if (annErr) {
      console.error("Error fetching hr_announcements:", annErr);
      return { success: false, data: [], totalEmployees: 0, error: annErr.message };
    }

    // 3. Get all reads grouped by announcement_id
    const { data: allReads } = await supabase
      .from("hr_announcement_reads")
      .select("announcement_id, employee_id, read_at");

    const readCountMap = new Map<string, number>();
    if (allReads && allReads.length > 0) {
      for (const r of allReads) {
        const count = readCountMap.get(r.announcement_id) || 0;
        readCountMap.set(r.announcement_id, count + 1);
      }
    }

    // 4. Format announcements
    const formatted: HrAnnouncementRecord[] = (rawAnnouncements || []).map((a: any) => {
      let targets: string[] = ["SEMUA"];
      if (Array.isArray(a.target)) {
        targets = a.target;
      } else if (typeof a.target === "string") {
        try {
          targets = JSON.parse(a.target);
        } catch {
          targets = [a.target];
        }
      }

      return {
        id: a.id,
        title: a.title,
        category: (a.category as AnnouncementCategory) || "LAINNYA",
        content: a.content || "",
        is_important: Boolean(a.is_important),
        target: targets.length > 0 ? targets : ["SEMUA"],
        attachment_url: a.attachment_url || null,
        is_archived: Boolean(a.is_archived),
        is_deleted: Boolean(a.is_deleted),
        created_by: a.created_by || null,
        created_at: a.created_at,
        updated_at: a.updated_at,
        read_count: readCountMap.get(a.id) || 0,
        total_employees: totalEmployees,
        author_name: "HR Management",
      };
    });

    return {
      success: true,
      data: formatted,
      totalEmployees,
    };
  } catch (err: any) {
    console.error("Unexpected error getHrAnnouncements:", err);
    return {
      success: false,
      data: [],
      totalEmployees: 0,
      error: err?.message || "Gagal mengambil data pengumuman",
    };
  }
}

/**
 * Get detailed reader statistics for a specific announcement
 */
export async function getAnnouncementReaderDetails(announcementId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Get all active employees
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, full_name, position, employee_type, photo_url")
      .eq("is_deleted", false)
      .eq("status", "ACTIVE")
      .order("full_name", { ascending: true });

    if (empErr) throw empErr;

    // 2. Get reads for this announcement
    const { data: reads, error: readsErr } = await supabase
      .from("hr_announcement_reads")
      .select("employee_id, read_at")
      .eq("announcement_id", announcementId);

    if (readsErr) throw readsErr;

    const readMap = new Map<string, string>();
    if (reads) {
      for (const r of reads) {
        readMap.set(r.employee_id, r.read_at);
      }
    }

    const readers: ReaderEmployee[] = (employees || []).map((emp) => {
      const readAt = readMap.get(emp.id) || null;
      return {
        employee_id: emp.id,
        full_name: emp.full_name,
        employee_code: emp.employee_code || "-",
        position: emp.position || emp.employee_type || "-",
        employee_type: emp.employee_type || "STAF",
        photo_url: emp.photo_url || null,
        read_at: readAt,
        has_read: Boolean(readAt),
      };
    });

    const readCount = readers.filter((r) => r.has_read).length;
    const unreadCount = readers.filter((r) => !r.has_read).length;
    const readPercentage =
      readers.length > 0 ? Math.round((readCount / readers.length) * 100) : 0;

    return {
      success: true,
      data: {
        readers,
        total: readers.length,
        readCount,
        unreadCount,
        readPercentage,
      },
    };
  } catch (err: any) {
    console.error("Error getAnnouncementReaderDetails:", err);
    return {
      success: false,
      message: err.message || "Gagal mengambil daftar pembaca",
      data: {
        readers: [],
        total: 0,
        readCount: 0,
        unreadCount: 0,
        readPercentage: 0,
      },
    };
  }
}

/**
 * Create HR Announcement
 */
export async function createHrAnnouncement(input: HrAnnouncementInput) {
  const supabase = createAdminClient();

  try {
    // Validations
    if (!input.title || input.title.trim().length < 3) {
      return { success: false, message: "Judul pengumuman minimal 3 karakter" };
    }
    if (!input.content || input.content.trim().length < 10) {
      return { success: false, message: "Isi pengumuman minimal 10 karakter" };
    }
    if (!input.category) {
      return { success: false, message: "Kategori pengumuman wajib dipilih" };
    }

    const validCategories: AnnouncementCategory[] = [
      "KEBIJAKAN_BARU",
      "INFO_CUTI",
      "EVENT",
      "PENTING",
      "LAINNYA",
    ];

    const category = validCategories.includes(input.category)
      ? input.category
      : "LAINNYA";

    const target =
      Array.isArray(input.target) && input.target.length > 0
        ? input.target
        : ["SEMUA"];

    const insertPayload = {
      title: input.title.trim(),
      category: category,
      content: input.content.trim(),
      is_important: Boolean(input.is_important),
      target: target,
      attachment_url: input.attachment_url || null,
      is_archived: Boolean(input.is_archived),
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hr_announcements")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert hr_announcements error:", error);
      throw error;
    }

    revalidatePath("/management/hr/pengumuman");
    revalidatePath("/management/hr");

    return {
      success: true,
      data,
      message: "Pengumuman berhasil diterbitkan",
    };
  } catch (err: any) {
    console.error("Error in createHrAnnouncement:", err);
    return {
      success: false,
      message: err.message || "Gagal membuat pengumuman",
    };
  }
}

/**
 * Update HR Announcement
 */
export async function updateHrAnnouncement(
  id: string,
  input: Partial<HrAnnouncementInput>
) {
  const supabase = createAdminClient();

  try {
    if (!id) {
      return { success: false, message: "ID pengumuman tidak valid" };
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      if (input.title.trim().length < 3) {
        return { success: false, message: "Judul pengumuman minimal 3 karakter" };
      }
      updatePayload.title = input.title.trim();
    }

    if (input.content !== undefined) {
      if (input.content.trim().length < 10) {
        return { success: false, message: "Isi pengumuman minimal 10 karakter" };
      }
      updatePayload.content = input.content.trim();
    }

    if (input.category !== undefined) {
      updatePayload.category = input.category;
    }

    if (input.is_important !== undefined) {
      updatePayload.is_important = Boolean(input.is_important);
    }

    if (input.target !== undefined) {
      updatePayload.target =
        Array.isArray(input.target) && input.target.length > 0
          ? input.target
          : ["SEMUA"];
    }

    if (input.attachment_url !== undefined) {
      updatePayload.attachment_url = input.attachment_url || null;
    }

    if (input.is_archived !== undefined) {
      updatePayload.is_archived = Boolean(input.is_archived);
    }

    const { data, error } = await supabase
      .from("hr_announcements")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/management/hr/pengumuman");
    revalidatePath("/management/hr");

    return {
      success: true,
      data,
      message: "Pengumuman berhasil diperbarui",
    };
  } catch (err: any) {
    console.error("Error in updateHrAnnouncement:", err);
    return {
      success: false,
      message: err.message || "Gagal memperbarui pengumuman",
    };
  }
}

/**
 * Toggle Important / Priority Pin
 */
export async function toggleImportantHrAnnouncement(
  id: string,
  is_important: boolean
) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("hr_announcements")
      .update({
        is_important: Boolean(is_important),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/management/hr/pengumuman");
    return {
      success: true,
      message: is_important
        ? "Pengumuman ditandai sebagai Penting"
        : "Tanda Penting telah dicabut",
    };
  } catch (err: any) {
    console.error("Error toggleImportantHrAnnouncement:", err);
    return { success: false, message: err.message || "Gagal mengubah status prioritas" };
  }
}

/**
 * Toggle Archive status
 */
export async function archiveHrAnnouncement(id: string, is_archived: boolean) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("hr_announcements")
      .update({
        is_archived: Boolean(is_archived),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/management/hr/pengumuman");
    return {
      success: true,
      message: is_archived
        ? "Pengumuman berhasil diarsipkan"
        : "Pengumuman berhasil dipulihkan dari arsip",
    };
  } catch (err: any) {
    console.error("Error archiveHrAnnouncement:", err);
    return { success: false, message: err.message || "Gagal mengubah status arsip" };
  }
}

/**
 * Soft delete announcement
 */
export async function deleteHrAnnouncement(id: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("hr_announcements")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/management/hr/pengumuman");
    revalidatePath("/management/hr");

    return {
      success: true,
      message: "Pengumuman berhasil dihapus",
    };
  } catch (err: any) {
    console.error("Error deleteHrAnnouncement:", err);
    return { success: false, message: err.message || "Gagal menghapus pengumuman" };
  }
}

/**
 * Upload announcement attachment (PDF, Images, etc.)
 */
export async function uploadHrAnnouncementAttachment(formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, message: "File tidak ditemukan" };
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, message: "Ukuran file melebihi batas 10MB" };
  }

  try {
    const ext = file.name.split(".").pop() || "pdf";
    const cleanName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 40);
    const filename = `ann_${Date.now()}_${cleanName}.${ext}`;
    const buffer = await file.arrayBuffer();

    // Try hr-announcements bucket
    const bucketName = "hr-announcements";

    // Attempt upload
    let { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    // If bucket doesn't exist, fallback to general buckets or create
    if (uploadError && uploadError.message?.includes("Bucket not found")) {
      try {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760,
        });
        const retry = await supabase.storage
          .from(bucketName)
          .upload(filename, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });
        uploadError = retry.error;
      } catch {
        // Try fallback bucket 'announcement-thumbnails' or 'public'
        const fallback = await supabase.storage
          .from("announcement-thumbnails")
          .upload(filename, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });
        if (!fallback.error) {
          const { data: pubData } = supabase.storage
            .from("announcement-thumbnails")
            .getPublicUrl(filename);
          return {
            success: true,
            url: pubData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
          };
        }
      }
    }

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err: any) {
    console.error("Error upload attachment:", err);
    return {
      success: false,
      message: err.message || "Gagal mengunggah lampiran",
    };
  }
}
