"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ===============================
// ABSENSI MASUK (RFID)
// ===============================
export async function processRfidScan(rfid: string, expectedClassId?: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
    // Check if enough time has passed to consider it a check-out
    const checkInDate = new Date(`${today}T${existingAttendance.check_in_time}`);
    const now = new Date();
    const diffMinutes = (now.getTime() - checkInDate.getTime()) / (1000 * 60);

    if (diffMinutes > 5 && !existingAttendance.check_out_time) {
      // Record check out
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
        isCheckOut: true
      };
    }

    return { 
      success: true, 
      student,
      message: "Siswa sudah tercatat hadir hari ini",
      alreadyScanned: true 
    };
  }

  const { error: insertError } = await supabase
    .from("student_attendance")
    .insert({
      student_id: student.id,
      class_id: student.class_id,
      date: today,
      status: 'HADIR',
      check_in_time: currentTime
    });

  if (insertError) {
    console.error(insertError);
    return { success: false, message: `Gagal mencatat absensi sistem: ${insertError.message}` };
  }

  revalidatePath(`/absen/${expectedClassId}`);
  return { 
    success: true, 
    student,
    message: "Absensi Kedatangan Berhasil!",
    alreadyScanned: false
  };
}

export async function getTodayAttendanceByClass(classId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

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
// PENJEMPUTAN (QR ORTU -> ANTRIAN TV)
// ===============================

export async function addPickupQueue(studentId: string, parentName: string = "Orang Tua/Wali", relation: string = "Orang Tua") {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existingQueue } = await supabase
    .from("pickup_queue")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("pickup_date", today)
    .single();

  if (existingQueue) {
    if (existingQueue.status === "PICKED_UP") {
      return { success: false, message: "Siswa sudah dijemput sebelumnya." };
    }
    return { success: true, message: "Siswa sudah ada dalam antrian penjemputan." };
  }

  const { error } = await supabase
    .from("pickup_queue")
    .insert({
      student_id: studentId,
      pickup_date: today,
      status: 'WAITING',
      picked_by_name: parentName,
      picked_by_relation: relation
    });

  if (error) {
    console.error(error);
    return { success: false, message: "Gagal menambahkan ke antrian." };
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi/penjemputan/scanner");
  return { success: true, message: "Siswa berhasil masuk antrian penjemputan!" };
}

export async function confirmPickup(queueId: string, studentId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  const { error: updateQueueError } = await supabase
    .from("pickup_queue")
    .update({ status: 'PICKED_UP', picked_up_at: new Date().toISOString() })
    .eq("id", queueId);

  if (updateQueueError) return { success: false, message: "Gagal update antrian." };

  const { data: attendance } = await supabase
    .from("student_attendance")
    .select("id")
    .eq("student_id", studentId)
    .eq("date", today)
    .single();

  if (attendance) {
    await supabase.from("student_attendance").update({ check_out_time: currentTime }).eq("id", attendance.id);
  } else {
    await supabase.from("student_attendance").insert({
      student_id: studentId,
      date: today,
      status: 'HADIR',
      check_out_time: currentTime
    });
  }

  revalidatePath("/penjemputan-app");
  revalidatePath("/management/absensi");
  return { success: true };
}

export async function getTodayAttendance() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

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

export async function getPickupQueue() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from("pickup_queue")
    .select(`
      *,
      students ( full_name, profile_picture, class_id )
    `)
    .eq("pickup_date", today)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getStaffAttendance() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

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
