"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get all classes (for sidebar list)
export async function getAllClasses() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("school_classes")
    .select("id, name, grade, capacity, level, homeroom_teacher")
    .order("name", { ascending: true });
  return data || [];
}

export type ClassroomWithStats = {
  id: string;
  name: string;
  grade: string;
  level?: string | null;
  capacity: number;
  homeroom_teacher?: string | null;
  created_at?: string;
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  capacityPct: number;
  todayPresentCount: number;
  todayAttendancePct: number;
  pendingAbsencesCount: number;
  todayScheduleCount: number;
};

export type ClassroomGlobalStats = {
  totalClasses: number;
  totalStudents: number;
  totalCapacity: number;
  avgOccupancyPct: number;
  overallTodayAttendancePct: number;
  pendingAbsencesTotal: number;
  gradeList: string[];
};

// Get enriched classroom listing with full statistics
export async function getAllClassesWithStats(): Promise<{
  classes: ClassroomWithStats[];
  stats: ClassroomGlobalStats;
}> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  const todayDay = days[new Date().getDay()];

  const [classesRes, studentsRes, todayAttRes, absencesRes, schedulesRes] = await Promise.all([
    supabase
      .from("school_classes")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("students")
      .select("id, class_id, gender, is_active")
      .eq("is_active", true),
    supabase
      .from("student_attendance")
      .select("id, student_id, status")
      .eq("date", today),
    supabase
      .from("student_absences")
      .select("id, class_id, status")
      .eq("status", "PENDING"),
    supabase
      .from("class_schedules")
      .select("id, class_id")
      .eq("day_of_week", todayDay),
  ]);

  const rawClasses = classesRes.data || [];
  const rawStudents = studentsRes.data || [];
  const rawTodayAtt = todayAttRes.data || [];
  const rawAbsences = absencesRes.data || [];
  const rawSchedules = schedulesRes.data || [];

  // Group students by class
  const classStudentsMap = new Map<string, typeof rawStudents>();
  for (const student of rawStudents) {
    if (!student.class_id) continue;
    const existing = classStudentsMap.get(student.class_id) || [];
    existing.push(student);
    classStudentsMap.set(student.class_id, existing);
  }

  // Attendance by student_id
  const presentStudentIds = new Set(
    rawTodayAtt.filter((a) => a.status === "HADIR").map((a) => a.student_id)
  );

  // Group pending absences by class
  const classAbsencesMap = new Map<string, number>();
  for (const abs of rawAbsences) {
    if (!abs.class_id) continue;
    classAbsencesMap.set(abs.class_id, (classAbsencesMap.get(abs.class_id) || 0) + 1);
  }

  // Group schedules by class
  const classSchedulesMap = new Map<string, number>();
  for (const sc of rawSchedules) {
    if (!sc.class_id) continue;
    classSchedulesMap.set(sc.class_id, (classSchedulesMap.get(sc.class_id) || 0) + 1);
  }

  const classesWithStats: ClassroomWithStats[] = rawClasses.map((cls) => {
    const classStudents = classStudentsMap.get(cls.id) || [];
    const studentCount = classStudents.length;

    let maleCount = 0;
    let femaleCount = 0;
    for (const s of classStudents) {
      const g = (s.gender || "").trim().toUpperCase();
      if (g === "MALE" || g === "L" || g === "LAKI-LAKI") {
        maleCount++;
      } else if (g === "FEMALE" || g === "P" || g === "PEREMPUAN") {
        femaleCount++;
      }
    }

    const capacity = Number(cls.capacity) > 0 ? Number(cls.capacity) : 25;
    const capacityPct = Math.min(100, Math.round((studentCount / capacity) * 100));

    let todayPresent = 0;
    for (const s of classStudents) {
      if (presentStudentIds.has(s.id)) {
        todayPresent++;
      }
    }

    const todayAttendancePct = studentCount > 0 ? Math.round((todayPresent / studentCount) * 100) : 0;
    const pendingAbsencesCount = classAbsencesMap.get(cls.id) || 0;
    const todayScheduleCount = classSchedulesMap.get(cls.id) || 0;

    return {
      id: cls.id,
      name: cls.name,
      grade: cls.grade || "",
      level: cls.level || null,
      capacity,
      homeroom_teacher: cls.homeroom_teacher || null,
      created_at: cls.created_at,
      studentCount,
      maleCount,
      femaleCount,
      capacityPct,
      todayPresentCount: todayPresent,
      todayAttendancePct,
      pendingAbsencesCount,
      todayScheduleCount,
    };
  });

  // Sort logically: Grade first (numerically if possible), then Class Name
  classesWithStats.sort((a, b) => {
    const gradeA = parseInt(a.grade) || 999;
    const gradeB = parseInt(b.grade) || 999;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });

  // Global calculations
  const totalClasses = classesWithStats.length;
  const totalStudents = rawStudents.length;
  const totalCapacity = classesWithStats.reduce((acc, c) => acc + c.capacity, 0);
  const avgOccupancyPct = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
  
  const enrolledStudentsInClasses = classesWithStats.reduce((acc, c) => acc + c.studentCount, 0);
  const totalPresentToday = classesWithStats.reduce((acc, c) => acc + c.todayPresentCount, 0);
  const overallTodayAttendancePct = enrolledStudentsInClasses > 0
    ? Math.round((totalPresentToday / enrolledStudentsInClasses) * 100)
    : 0;

  const rawGradeList = Array.from(new Set(classesWithStats.map((c) => c.grade).filter(Boolean)));
  rawGradeList.sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));

  return {
    classes: classesWithStats,
    stats: {
      totalClasses,
      totalStudents,
      totalCapacity,
      avgOccupancyPct,
      overallTodayAttendancePct,
      pendingAbsencesTotal: rawAbsences.length,
      gradeList: rawGradeList,
    },
  };
}

// Get class detail + student count
export async function getClassDetail(classId: string) {
  const supabase = createAdminClient();
  const [clsRes, countRes] = await Promise.all([
    supabase.from("school_classes").select("*").eq("id", classId).single(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("class_id", classId).eq("is_active", true),
  ]);

  return { cls: clsRes.data, studentCount: countRes.count || 0 };
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

  const [totalRes, presentRes, pendingRes] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("is_active", true),
    supabase
      .from("student_attendance")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("date", today)
      .eq("status", "HADIR"),
    supabase
      .from("student_absences")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "PENDING"),
  ]);

  const total = totalRes.count || 0;
  const present = presentRes.count || 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    totalStudents: total,
    presentToday: present,
    todayPct: pct,
    pendingAbsences: pendingRes.count || 0,
  };
}

export async function createClass(data: {
  name: string;
  grade: string;
  capacity: number;
  level?: string | null;
  homeroom_teacher?: string | null;
}) {
  const supabase = createAdminClient();
  const insertPayload: Record<string, any> = {
    name: data.name.trim(),
    grade: data.grade.trim(),
    capacity: data.capacity || 25,
  };
  if (data.level !== undefined) insertPayload.level = data.level?.trim() || null;
  if (data.homeroom_teacher !== undefined) insertPayload.homeroom_teacher = data.homeroom_teacher?.trim() || null;

  const { error } = await supabase.from('school_classes').insert(insertPayload);
  if (error) return { success: false, message: error.message };
  revalidatePath('/management/classroom');
  return { success: true };
}

export async function updateClass(
  id: string,
  data: {
    name: string;
    grade: string;
    capacity: number;
    level?: string | null;
    homeroom_teacher?: string | null;
  }
) {
  const supabase = createAdminClient();
  const updatePayload: Record<string, any> = {
    name: data.name.trim(),
    grade: data.grade.trim(),
    capacity: data.capacity || 25,
  };
  if (data.level !== undefined) updatePayload.level = data.level?.trim() || null;
  if (data.homeroom_teacher !== undefined) updatePayload.homeroom_teacher = data.homeroom_teacher?.trim() || null;

  const { error } = await supabase.from('school_classes').update(updatePayload).eq('id', id);
  if (error) return { success: false, message: error.message };
  revalidatePath('/management/classroom');
  revalidatePath(`/management/classroom/${id}`);
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
