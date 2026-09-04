"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ===============================
// ABSENSI MASUK (RFID)
// ===============================
export async function processRfidScan(rfid: string, expectedClassId?: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, full_name, class_id, profile_picture")
    .eq("rf_id", rfid)
    .single();

  if (studentError || !student) {
    return { success: false, message: "RFID tidak terdaftar" };
  }

  if (expectedClassId && student.class_id !== expectedClassId) {
    return { success: false, message: "Siswa ini tidak terdaftar di kelas ini" };
  }

  const { data: existingAttendance } = await supabase
    .from("student_attendance")
    .select("id, check_in_time, check_out_time")
    .eq("student_id", student.id)
    .eq("date", today)
    .single();

  if (existingAttendance) {
    const checkInDate = new Date(`${today}T${existingAttendance.check_in_time}`);
    const now = new Date();
    const diffMinutes = (now.getTime() - checkInDate.getTime()) / (1000 * 60);

    if (diffMinutes > 5 && !existingAttendance.check_out_time) {
      await supabase
        .from("student_attendance")
        .update({ check_out_time: currentTime })
        .eq("id", existingAttendance.id);

      revalidatePath(`/absen/${expectedClassId}`);
      return {
        success: true,
        student,
        message: "Absensi Kepulangan Berhasil!",
        alreadyScanned: true,
        isCheckOut: true,
      };
    }

    return {
      success: true,
      student,
      message: "Siswa sudah tercatat hadir hari ini",
      alreadyScanned: true,
    };
  }

  const { error: insertError } = await supabase.from("student_attendance").insert({
    student_id: student.id,
    class_id: student.class_id,
    date: today,
    status: "HADIR",
    check_in_time: currentTime,
  });

  if (insertError) {
    console.error(insertError);
    return {
      success: false,
      message: `Gagal mencatat absensi sistem: ${insertError.message}`,
    };
  }

  revalidatePath(`/absen/${expectedClassId}`);
  return {
    success: true,
    student,
    message: "Absensi Kedatangan Berhasil!",
    alreadyScanned: false,
  };
}

export async function getTodayAttendanceByClass(classId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("student_attendance")
    .select(`
      id,
      check_in_time,
      check_out_time,
      students (
        id,
        full_name,
        nis,
        nisn,
        profile_picture,
        gender
      )
    `)
    .eq("class_id", classId)
    .eq("date", today)
    .order("check_in_time", { ascending: false });

  return data || [];
}

// ===============================
// PENJEMPUTAN (QR ORTU -> ANTRIAN TV -> SECURITY)
// ===============================

export async function addPickupQueue(
  studentIdOrNis: string,
  parentName: string = "Orang Tua/Wali",
  relation: string = "Orang Tua"
) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    studentIdOrNis.trim()
  );

  let targetStudent: any = null;

  if (isUuid) {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, class_id, is_active, authorized_pickup_name, school_classes(name, grade)")
      .eq("id", studentIdOrNis.trim())
      .maybeSingle();
    targetStudent = data;
  }

  if (!targetStudent) {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, class_id, is_active, authorized_pickup_name, school_classes(name, grade)")
      .or(`nis.eq.${studentIdOrNis.trim()},nisn.eq.${studentIdOrNis.trim()},rf_id.eq.${studentIdOrNis.trim()}`)
      .maybeSingle();
    targetStudent = data;
  }

  if (!targetStudent && studentIdOrNis.trim().length >= 2) {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, class_id, is_active, authorized_pickup_name, school_classes(name, grade)")
      .ilike("full_name", `%${studentIdOrNis.trim()}%`)
      .limit(1)
      .maybeSingle();
    targetStudent = data;
  }

  if (!targetStudent) {
    return {
      success: false,
      message: `Data siswa "${studentIdOrNis}" tidak ditemukan di database sekolah.`,
    };
  }

  const finalStudentId = targetStudent.id;
  const studentName = targetStudent.full_name || "Siswa JACOS";
  const className =
    (targetStudent as any)?.school_classes?.name ||
    `Kelas ${(targetStudent as any)?.school_classes?.grade || ""}`.trim() ||
    "";
  const finalPicker =
    parentName.trim() || targetStudent.authorized_pickup_name || "Orang Tua/Wali";

  const { data: existingQueue } = await supabase
    .from("pickup_queue")
    .select("id, status")
    .eq("student_id", finalStudentId)
    .eq("pickup_date", today)
    .maybeSingle();

  if (existingQueue) {
    if (existingQueue.status === "PICKED_UP") {
      return { 
        success: false, 
        message: `Ananda ${studentName} sudah dijemput sebelumnya hari ini.`,
        studentName,
        className,
      };
    }
    if (existingQueue.status === "WAITING" || existingQueue.status === "CALLED") {
      return {
        success: true,
        message: `Ananda ${studentName} sudah berada dalam antrian penjemputan.`,
        studentName,
        className,
        alreadyQueued: true,
        queueId: existingQueue.id,
      };
    }
    // If was cancelled, re-activate
    await supabase
      .from("pickup_queue")
      .update({
        status: "WAITING",
        picked_by_name: finalPicker,
        picked_by_relation: relation,
        created_at: new Date().toISOString(),
      })
      .eq("id", existingQueue.id);

    revalidatePath("/penjemputan-app");
    revalidatePath("/management/absensi/penjemputan");
    revalidatePath("/management/absensi/penjemputan/scanner");
    return { 
      success: true, 
      message: `Antrian Ananda ${studentName} berhasil diaktifkan kembali.`,
      studentName,
      className,
      queueId: existingQueue.id,
    };
  }

  const { data: inserted, error } = await supabase
    .from("pickup_queue")
    .insert({
      student_id: finalStudentId,
      pickup_date: today,
      status: "WAITING",
      picked_by_name: finalPicker,
      picked_by_relation: relation,
    })
    .select("id")
    .single();

  if (error) {
    console.error("addPickupQueue error:", error);
    return { success: false, message: `Gagal menambahkan ke antrian: ${error.message}` };
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan");
  revalidatePath("/management/absensi/penjemputan/scanner");
  return { 
    success: true, 
    message: `Ananda ${studentName} berhasil masuk antrian penjemputan!`, 
    queueId: inserted?.id,
    studentName,
    className,
  };
}

export async function callPickupStudent(queueId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pickup_queue")
    .update({ status: "CALLED" })
    .eq("id", queueId);

  if (error) {
    return { success: false, message: "Gagal memanggil antrian siswa." };
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan");
  return { success: true };
}

export async function confirmPickup(queueId: string, studentId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toTimeString().split(" ")[0];

  const { error: updateQueueError } = await supabase
    .from("pickup_queue")
    .update({
      status: "PICKED_UP",
      picked_up_at: new Date().toISOString(),
    })
    .eq("id", queueId);

  if (updateQueueError) {
    return { success: false, message: "Gagal update antrian." };
  }

  // Update check_out_time in student_attendance
  const { data: attendance } = await supabase
    .from("student_attendance")
    .select("id")
    .eq("student_id", studentId)
    .eq("date", today)
    .maybeSingle();

  if (attendance) {
    await supabase
      .from("student_attendance")
      .update({ check_out_time: currentTime })
      .eq("id", attendance.id);
  } else {
    await supabase.from("student_attendance").insert({
      student_id: studentId,
      date: today,
      status: "HADIR",
      check_out_time: currentTime,
    });
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan");
  revalidatePath("/management/absensi/penjemputan/scanner");
  revalidatePath("/management/absensi");
  return { success: true };
}

export async function cancelPickup(queueId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pickup_queue")
    .update({ status: "CANCELLED" })
    .eq("id", queueId);

  if (error) {
    return { success: false, message: "Gagal membatalkan antrian." };
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan");
  revalidatePath("/management/absensi/penjemputan/scanner");
  return { success: true };
}

export async function getPickupQueue() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [queueRes, classesRes] = await Promise.all([
    supabase
      .from("pickup_queue")
      .select(`
        id,
        student_id,
        pickup_date,
        status,
        picked_by_name,
        picked_by_relation,
        created_at,
        picked_up_at,
        students (
          id,
          full_name,
          nis,
          nisn,
          profile_picture,
          class_id,
          gender,
          authorized_pickup_name,
          emergency_contact_phone
        )
      `)
      .eq("pickup_date", today)
      .order("created_at", { ascending: true }),
    supabase.from("school_classes").select("id, name, grade, level"),
  ]);

  const queueData = queueRes.data || [];
  const classes = classesRes.data || [];
  const classMap = new Map(classes.map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

  return queueData.map((item: any) => ({
    ...item,
    className: item.students?.class_id
      ? classMap.get(item.students.class_id) || item.students.class_id
      : "Belum Ada Kelas",
  }));
}

export async function getPickupStats(dateStr?: string) {
  const supabase = createAdminClient();
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  const { data: todayList } = await supabase
    .from("pickup_queue")
    .select("id, status, created_at, picked_up_at")
    .eq("pickup_date", targetDate);

  const list = todayList || [];
  const total = list.length;
  const waiting = list.filter((i) => i.status === "WAITING" || i.status === "CALLED").length;
  const pickedUp = list.filter((i) => i.status === "PICKED_UP").length;
  const cancelled = list.filter((i) => i.status === "CANCELLED").length;

  // Calculate average wait time in minutes for completed pickups
  const completedDurations: number[] = [];
  list.forEach((item) => {
    if (item.status === "PICKED_UP" && item.created_at && item.picked_up_at) {
      const start = new Date(item.created_at).getTime();
      const end = new Date(item.picked_up_at).getTime();
      const diffMin = (end - start) / (1000 * 60);
      if (diffMin >= 0 && diffMin <= 120) {
        completedDurations.push(diffMin);
      }
    }
  });

  const avgWaitTime =
    completedDurations.length > 0
      ? (
          completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
        ).toFixed(1)
      : "2.5";

  return {
    total,
    waiting,
    pickedUp,
    cancelled,
    avgWaitTime,
    completionRate: total > 0 ? Math.round((pickedUp / total) * 100) : 0,
    peakHours: "14:00 - 15:30",
  };
}

export interface PickupHistoryFilter {
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  classId?: string;
  status?: string;
  search?: string;
}

export async function getPickupHistory(filter: PickupHistoryFilter) {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let startStr = todayStr;
  let endStr = todayStr;

  if (filter.period === "WEEKLY") {
    const past7 = new Date();
    past7.setDate(past7.getDate() - 7);
    startStr = past7.toISOString().split("T")[0];
    endStr = todayStr;
  } else if (filter.period === "MONTHLY") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startStr = firstDay.toISOString().split("T")[0];
    endStr = todayStr;
  } else if (filter.period === "CUSTOM") {
    startStr = filter.startDate || todayStr;
    endStr = filter.endDate || todayStr;
  }

  let query = supabase
    .from("pickup_queue")
    .select(`
      id,
      student_id,
      pickup_date,
      status,
      picked_by_name,
      picked_by_relation,
      created_at,
      picked_up_at,
      students (
        id,
        full_name,
        nis,
        nisn,
        profile_picture,
        class_id,
        gender
      )
    `)
    .gte("pickup_date", startStr)
    .lte("pickup_date", endStr)
    .order("created_at", { ascending: false });

  if (filter.status && filter.status !== "ALL") {
    query = query.eq("status", filter.status);
  }

  const [listRes, classesRes] = await Promise.all([
    query,
    supabase.from("school_classes").select("id, name, grade, level"),
  ]);

  const list = listRes.data || [];
  const classes = classesRes.data || [];
  const classMap = new Map(classes.map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

  let results = list.map((item: any) => {
    let waitMinutes: number | null = null;
    if (item.created_at && item.picked_up_at) {
      const diff =
        (new Date(item.picked_up_at).getTime() - new Date(item.created_at).getTime()) /
        (1000 * 60);
      if (diff >= 0) waitMinutes = Math.round(diff);
    }

    return {
      ...item,
      className: item.students?.class_id
        ? classMap.get(item.students.class_id) || item.students.class_id
        : "Belum Ada Kelas",
      waitMinutes,
    };
  });

  // Client search filter
  if (filter.search?.trim()) {
    const s = filter.search.toLowerCase().trim();
    results = results.filter(
      (r) =>
        r.students?.full_name?.toLowerCase().includes(s) ||
        r.students?.nis?.toLowerCase().includes(s) ||
        r.picked_by_name?.toLowerCase().includes(s) ||
        r.className?.toLowerCase().includes(s)
    );
  }

  if (filter.classId && filter.classId !== "ALL") {
    results = results.filter((r) => r.students?.class_id === filter.classId);
  }

  return results;
}

export async function searchStudentsForPickup(query?: string) {
  const supabase = createAdminClient();
  const q = (query || "").trim().toLowerCase();

  let studentQuery = supabase
    .from("students")
    .select(`
      id,
      full_name,
      nis,
      nisn,
      class_id,
      profile_picture,
      gender,
      authorized_pickup_name,
      emergency_contact_phone,
      emergency_contact_name
    `)
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .limit(15);

  if (q.length > 0) {
    studentQuery = studentQuery.or(`full_name.ilike.%${q}%,nis.ilike.%${q}%,nisn.ilike.%${q}%`);
  }

  const { data: students, error } = await studentQuery;

  if (error || !students) return [];

  const { data: classes } = await supabase
    .from("school_classes")
    .select("id, name, grade");

  const classMap = new Map((classes || []).map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

  return students.map((s) => ({
    ...s,
    className: s.class_id ? classMap.get(s.class_id) || s.class_id : "Belum Ada Kelas",
  }));
}

export async function getAllClassesList() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("school_classes")
    .select("id, name, grade, level")
    .order("grade", { ascending: true });

  return data || [];
}

export async function getTodayAttendance() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("student_attendance")
    .select(`
      *,
      students ( full_name, nis, profile_picture )
    `)
    .eq("date", today)
    .order("check_in_time", { ascending: false });

  return data || [];
}

export async function getStaffAttendance() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("staff_attendance")
    .select(`
      *,
      teachers ( full_name, profile_id )
    `)
    .eq("date", today)
    .order("check_in_time", { ascending: false });

  return data || [];
}

// ===============================
// REKAP ABSENSI SISWA UNTUK MANAGEMENT
// ===============================
export async function getStudentAttendanceRecap(filterDate?: string, classId?: string) {
  const supabase = createAdminClient();
  const date = filterDate || new Date().toISOString().split("T")[0];

  let studentQuery = supabase
    .from("students")
    .select("id, full_name, nis, nisn, profile_picture, class_id")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (classId && classId !== "ALL") {
    studentQuery = studentQuery.eq("class_id", classId);
  }

  let attendanceQuery = supabase
    .from("student_attendance")
    .select("*")
    .eq("date", date);

  let absenceQuery = supabase
    .from("student_absences")
    .select("*")
    .eq("date", date);

  // Parallel fetch: students, classes, attendance records, and absence records
  const [studentsRes, classesRes, attendanceRes, absencesRes] = await Promise.all([
    studentQuery,
    supabase.from("school_classes").select("id, name, grade, level").order("grade", { ascending: true }),
    attendanceQuery,
    absenceQuery,
  ]);

  const studentList = studentsRes.data || [];
  const classes = classesRes.data || [];
  const classMap = new Map(classes.map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

  const attendanceRecords = attendanceRes.data || [];
  const attendanceMap = new Map(attendanceRecords.map((a) => [a.student_id, a]));

  const absenceRecords = absencesRes.data || [];
  const absenceMap = new Map(absenceRecords.map((a) => [a.student_id, a]));

  // Combine results
  const items = studentList.map((student) => {
    const att = attendanceMap.get(student.id);
    const abs = absenceMap.get(student.id);

    let status = "ALPHA";
    let checkIn = null;
    let checkOut = null;
    let notes = null;
    let method = "Belum Presensi";

    if (att) {
      status = att.status || "HADIR";
      checkIn = att.check_in_time || null;
      checkOut = att.check_out_time || null;
      method = att.check_in_time ? "RFID / Scanner" : "Manual System";
    } else if (abs) {
      status = abs.type || "IZIN";
      notes = abs.reason || null;
      method = "Permohonan Izin";
    }

    return {
      studentId: student.id,
      studentName: student.full_name,
      nis: student.nis || "-",
      profilePicture: student.profile_picture,
      classId: student.class_id,
      className: student.class_id ? classMap.get(student.class_id) || "Tanpa Kelas" : "Tanpa Kelas",
      date,
      status,
      checkIn,
      checkOut,
      notes,
      method,
      attendanceId: att?.id || null,
      absenceId: abs?.id || null,
    };
  });

  // Calculate overall stats
  const totalStudents = items.length;
  const totalHadir = items.filter((i) => i.status === "HADIR").length;
  const totalIzin = items.filter((i) => i.status === "IZIN").length;
  const totalSakit = items.filter((i) => i.status === "SAKIT").length;
  const totalAlpha = items.filter((i) => i.status === "ALPHA").length;
  const percentage = totalStudents > 0 ? Math.round((totalHadir / totalStudents) * 100) : 0;

  // Calculate per-class breakdown
  const classStatsMap = new Map<string, { classId: string; className: string; total: number; hadir: number; izin: number; sakit: number; alpha: number }>();

  (classes || []).forEach((cls) => {
    classStatsMap.set(cls.id, {
      classId: cls.id,
      className: cls.name || `Kelas ${cls.grade}`,
      total: 0,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
    });
  });

  items.forEach((item) => {
    if (item.classId && classStatsMap.has(item.classId)) {
      const stats = classStatsMap.get(item.classId)!;
      stats.total += 1;
      if (item.status === "HADIR") stats.hadir += 1;
      else if (item.status === "IZIN") stats.izin += 1;
      else if (item.status === "SAKIT") stats.sakit += 1;
      else if (item.status === "ALPHA") stats.alpha += 1;
    }
  });

  const classBreakdown = Array.from(classStatsMap.values()).filter((c) => c.total > 0);

  return {
    items,
    classes: classes || [],
    summary: {
      totalStudents,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpha,
      percentage,
    },
    classBreakdown,
  };
}

export async function updateStudentAttendanceRecord(data: {
  studentId: string;
  classId?: string;
  date: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALPHA";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}) {
  const supabase = createAdminClient();
  const todayTime = new Date().toLocaleTimeString("en-US", { hour12: false });

  // 1. Check existing student_attendance record
  const { data: existing } = await supabase
    .from("student_attendance")
    .select("id")
    .eq("student_id", data.studentId)
    .eq("date", data.date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("student_attendance")
      .update({
        status: data.status,
        check_in_time: data.checkInTime || (data.status === "HADIR" ? todayTime : null),
        check_out_time: data.checkOutTime || null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("student_attendance").insert({
      student_id: data.studentId,
      class_id: data.classId,
      date: data.date,
      status: data.status,
      check_in_time: data.checkInTime || (data.status === "HADIR" ? todayTime : null),
      check_out_time: data.checkOutTime || null,
    });
  }

  // 2. If status is IZIN or SAKIT, also upsert into student_absences
  if (data.status === "IZIN" || data.status === "SAKIT") {
    const { data: existingAbsence } = await supabase
      .from("student_absences")
      .select("id")
      .eq("student_id", data.studentId)
      .eq("date", data.date)
      .maybeSingle();

    if (existingAbsence) {
      await supabase
        .from("student_absences")
        .update({
          type: data.status,
          reason: data.notes || `Disetujui Admin/Management (${data.status})`,
          status: "APPROVED",
        })
        .eq("id", existingAbsence.id);
    } else {
      await supabase.from("student_absences").insert({
        student_id: data.studentId,
        class_id: data.classId,
        date: data.date,
        type: data.status,
        reason: data.notes || `Input Manual Management (${data.status})`,
        status: "APPROVED",
      });
    }
  }

  revalidatePath("/management/absensi");
  return { success: true, message: `Status absensi siswa berhasil diperbarui menjadi ${data.status}` };
}

