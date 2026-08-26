"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  target_type: "GENERAL" | "SPECIFIC_CLASSES";
  target_classes: string[];
  thumbnail_url: string | null;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAnnouncements(params?: {
  search?: string;
  category?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = createAdminClient();
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("announcements")
      .select("*", { count: "exact" });

    if (params?.search && params.search.trim() !== "") {
      query = query.ilike("title", `%${params.search.trim()}%`);
    }

    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }

    if (params?.targetType && params.targetType !== "all") {
      query = query.eq("target_type", params.targetType);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching announcements:", error);
      return { data: [], total: 0, totalPages: 0, currentPage: page };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []) as AnnouncementItem[],
      total,
      totalPages,
      currentPage: page
    };
  } catch (err) {
    console.error("Unexpected error getAnnouncements:", err);
    return { data: [], total: 0, totalPages: 0, currentPage: page };
  }
}

export async function getAnnouncementById(id: string) {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data: data as AnnouncementItem };
  } catch (err: any) {
    console.error("Error getAnnouncementById:", err);
    return { success: false, message: err.message || "Gagal mengambil data" };
  }
}

export async function getSchoolClasses() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("school_classes")
      .select("id, name, grade")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as { id: string; name: string; grade?: string }[];
  } catch (err) {
    console.error("Error getSchoolClasses:", err);
    return [];
  }
}

export async function uploadAnnouncementThumbnail(formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, message: "File tidak ditemukan" };
  }

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `thumbnail_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("announcement-thumbnails")
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("announcement-thumbnails")
      .getPublicUrl(filename);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("Error upload thumbnail:", err);
    return { success: false, message: err.message || "Gagal mengunggah thumbnail" };
  }
}

export async function createAnnouncement(payload: {
  title: string;
  category: string;
  target_type: "GENERAL" | "SPECIFIC_CLASSES";
  target_classes?: string[];
  thumbnail_url?: string | null;
  content: string;
  is_published?: boolean;
}) {
  const supabase = createAdminClient();

  try {
    if (!payload.title || !payload.category || !payload.content) {
      return { success: false, message: "Judul, kategori, dan konten wajib diisi" };
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: payload.title,
        category: payload.category,
        target_type: payload.target_type,
        target_classes: payload.target_type === "SPECIFIC_CLASSES" ? payload.target_classes || [] : [],
        thumbnail_url: payload.thumbnail_url || null,
        content: payload.content,
        is_published: payload.is_published ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/management/informasi");
    revalidatePath("/parent-portal/informasi");

    return { success: true, data };
  } catch (err: any) {
    console.error("Error createAnnouncement:", err);
    return { success: false, message: err.message || "Gagal membuat informasi" };
  }
}

export async function updateAnnouncement(
  id: string,
  payload: {
    title: string;
    category: string;
    target_type: "GENERAL" | "SPECIFIC_CLASSES";
    target_classes?: string[];
    thumbnail_url?: string | null;
    content: string;
    is_published?: boolean;
  }
) {
  const supabase = createAdminClient();

  try {
    if (!payload.title || !payload.category || !payload.content) {
      return { success: false, message: "Judul, kategori, dan konten wajib diisi" };
    }

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: payload.title,
        category: payload.category,
        target_type: payload.target_type,
        target_classes: payload.target_type === "SPECIFIC_CLASSES" ? payload.target_classes || [] : [],
        thumbnail_url: payload.thumbnail_url || null,
        content: payload.content,
        is_published: payload.is_published ?? true,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/management/informasi");
    revalidatePath("/parent-portal/informasi");

    return { success: true, data };
  } catch (err: any) {
    console.error("Error updateAnnouncement:", err);
    return { success: false, message: err.message || "Gagal memperbarui informasi" };
  }
}

export async function deleteAnnouncement(id: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/management/informasi");
    revalidatePath("/parent-portal/informasi");

    return { success: true };
  } catch (err: any) {
    console.error("Error deleteAnnouncement:", err);
    return { success: false, message: err.message || "Gagal menghapus informasi" };
  }
}
