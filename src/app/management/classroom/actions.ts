"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get all classes (for sidebar list)
export async function getAllClasses() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("school_classes")
    .select("id, name, grade")
    .order("name", { ascending: true });
  return data || [];
}

// Get class detail + student count
export async function getClassDetail(classId: string) {
  const supabase = createAdminClient();
  const { data: cls } = await supabase
    .from("school_classes")
    .select("*")
    .eq("id", classId)
    .single();

  const { count: studentCount } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("is_active", true);

  return { cls, studentCount: studentCount || 0 };
}

// Get students in a class with attendance stats
export async function getClassStudents(classId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  
  // Get current month range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  
  // Get week start (Monday)
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff)).toISOString().split("T")[0];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, nis, profile_picture")
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (!students) return [];

  const studentIds = students.map((s) => s.id);

  // Today attendance
  const { data: todayAtt } = await supabase
    .from("student_attendance")
    .select("student_id, status, check_in_time")
    .in("student_id", studentIds)
    .eq("date", today);

  // Weekly attendance count
  const { data: weekAtt } = await supabase
    .from("student_attendance")
    .select("student_id, status, date")
    .in("student_id", studentIds)
    .gte("date", weekStart)
    .lte("date", today);

  // Monthly attendance count
  const { data: monthAtt } = await supabase
    .from("student_attendance")
    .select("student_id, status, date")
    .in("student_id", studentIds)
    .gte("date", monthStart)
    .lte("date", today);

  const todayMap = new Map((todayAtt || []).map((a) => [a.student_id, a]));
  
  // Helper: count school days in a range (Mon–Fri)
  const countSchoolDays = (from: string, to: string) => {
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  };

  const weekDays = countSchoolDays(weekStart, today);
  const monthDays = countSchoolDays(monthStart, today);

  return students.map((student) => {
    const todayRecord = todayMap.get(student.id);
    
    const weekPresent = (weekAtt || []).filter(
      (a) => a.student_id === student.id && a.status === "HADIR"
    ).length;
    const monthPresent = (monthAtt || []).filter(
      (a) => a.student_id === student.id && a.status === "HADIR"
    ).length;

    return {
      ...student,
      todayStatus: todayRecord?.status || null,
      todayCheckIn: todayRecord?.check_in_time || null,
      weeklyPct: weekDays > 0 ? Math.round((weekPresent / weekDays) * 100) : null,
      monthlyPct: monthDays > 0 ? Math.round((monthPresent / monthDays) * 100) : null,
    };
  });
}

// Get class schedule
export async function getClassSchedule(classId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("class_schedules")
    .select("*")
    .eq("class_id", classId)
    .order("time_start", { ascending: true });
  return data || [];
}

// Get class posts/announcements
export async function getClassPosts(classId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("class_posts")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Create a new class post
export async function createClassPost(formData: {
  classId: string;
  title: string;
  body: string;
  category: string;
  audience: string;
  authorName: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("class_posts").insert({
    class_id: formData.classId,
    title: formData.title,
    body: formData.body,
    category: formData.category,
    audience: formData.audience,
    author_name: formData.authorName,
  });

  if (error) return { success: false, message: error.message };
  revalidatePath(`/management/classroom/${formData.classId}`);
  return { success: true };
}

// Get class absences/permissions
export async function getClassAbsences(classId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("student_absences")
    .select(`
      *,
      students ( full_name, profile_picture )
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Approve absence
export async function approveAbsence(absenceId: string, classId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("student_absences")
    .update({ status: "APPROVED" })
    .eq("id", absenceId);
  revalidatePath(`/management/classroom/${classId}`);
  return { success: true };
}

// Reject absence
export async function rejectAbsence(absenceId: string, classId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("student_absences")
    .update({ status: "REJECTED" })
    .eq("id", absenceId);
  revalidatePath(`/management/classroom/${classId}`);
  return { success: true };
}

// Get today's schedule for a class
export async function getTodaySchedule(classId: string) {
  const supabase = createAdminClient();
  const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  const todayDay = days[new Date().getDay()];
  
  const { data } = await supabase
    .from("class_schedules")
    .select("*")
    .eq("class_id", classId)
    .eq("day_of_week", todayDay)
    .order("time_start", { ascending: true });
  return data || [];
}

// Get attendance summary for today's class
export async function getTodayAttendanceSummary(classId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { count: totalStudents } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("is_active", true);

  const { count: presentToday } = await supabase
    .from("student_attendance")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("date", today)
    .eq("status", "HADIR");

  const { count: pendingAbsences } = await supabase
    .from("student_absences")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("status", "PENDING");

  const total = totalStudents || 0;
  const present = presentToday || 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    totalStudents: total,
    presentToday: present,
    todayPct: pct,
    pendingAbsences: pendingAbsences || 0,
  };
}

export async function createClass(data: { name: string; grade: string; capacity: number }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('school_classes').insert(data);
  if (error) return { success: false, message: error.message };
  revalidatePath('/management/classroom');
  return { success: true };
}

export async function updateClass(id: string, data: { name: string; grade: string; capacity: number }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('school_classes').update(data).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/management/classroom');
  return { success: true };
}

export async function deleteClass(id: string) {
  const supabase = createAdminClient();
  // Karena relasi on delete set null pada students dan guru, kita bisa langsung hapus
  const { error } = await supabase.from('school_classes').delete().eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/management/classroom');
  return { success: true };
}
