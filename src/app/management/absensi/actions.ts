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
        profile_picture
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

  // Resolve student by id or NIS if string given
  let targetStudentId = studentIdOrNis;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    studentIdOrNis
  );

  if (!isUuid) {
    const { data: foundStudent } = await supabase
      .from("students")
      .select("id, full_name, class_id")
      .or(`nis.eq.${studentIdOrNis},nisn.eq.${studentIdOrNis},id.eq.${studentIdOrNis}`)
      .maybeSingle();

    if (foundStudent) {
      targetStudentId = foundStudent.id;
    }
  }

  const { data: existingQueue } = await supabase
    .from("pickup_queue")
    .select("id, status")
    .eq("student_id", targetStudentId)
    .eq("pickup_date", today)
    .maybeSingle();

  if (existingQueue) {
    if (existingQueue.status === "PICKED_UP") {
      return { success: false, message: "Siswa sudah dijemput sebelumnya hari ini." };
    }
    if (existingQueue.status === "WAITING" || existingQueue.status === "CALLED") {
      return {
        success: true,
        message: "Siswa sudah berada dalam antrian penjemputan.",
        alreadyQueued: true,
      };
    }
    // If was cancelled, re-activate
    await supabase
      .from("pickup_queue")
      .update({
        status: "WAITING",
        picked_by_name: parentName,
        picked_by_relation: relation,
        created_at: new Date().toISOString(),
      })
      .eq("id", existingQueue.id);

    revalidatePath("/penjemputan-app");
    revalidatePath("/management/absensi/penjemputan");
    revalidatePath("/management/absensi/penjemputan/scanner");
    return { success: true, message: "Antrian siswa berhasil diaktifkan kembali." };
  }

  const { data: inserted, error } = await supabase
    .from("pickup_queue")
    .insert({
      student_id: targetStudentId,
      pickup_date: today,
      status: "WAITING",
      picked_by_name: parentName,
      picked_by_relation: relation,
    })
    .select("id")
    .single();

  if (error) {
    console.error("addPickupQueue error:", error);
    return { success: false, message: "Gagal menambahkan ke antrian." };
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan");
  revalidatePath("/management/absensi/penjemputan/scanner");
  return { success: true, message: "Siswa berhasil masuk antrian penjemputan!", queueId: inserted?.id };
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

  const { data: queueData, error } = await supabase
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
    .order("created_at", { ascending: true });

  if (error || !queueData) return [];

  // Fetch school classes to attach friendly names
  const { data: classes } = await supabase
    .from("school_classes")
    .select("id, name, grade, level");

  const classMap = new Map((classes || []).map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

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

  const { data: list, error } = await query;
  if (error || !list) return [];

  // Fetch school classes
  const { data: classes } = await supabase
    .from("school_classes")
    .select("id, name, grade, level");

  const classMap = new Map((classes || []).map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

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

export async function searchStudentsForPickup(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = createAdminClient();
  const q = query.trim().toLowerCase();

  const { data: students, error } = await supabase
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
    .or(`full_name.ilike.%${q}%,nis.ilike.%${q}%,nisn.ilike.%${q}%`)
    .limit(10);

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
