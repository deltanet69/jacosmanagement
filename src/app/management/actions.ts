"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentActiveBatch, getBatchInfo } from "@/lib/admission-config";

export interface DashboardData {
  students: {
    total: number;
    preschool: number;
    kindergarten: number;
    primary: number;
  };
  admissions: {
    total: number;
    pending: number;
    enrolled: number;
    rejected: number;
    activeBatch: string;
    activeBatchLabel: string;
    recentApplicants: Array<{
      id: string;
      registration_no: string;
      student_name: string;
      program: string;
      status: string;
      created_at: string;
      batch?: string | null;
    }>;
  };
  teachers: {
    total: number;
    presentToday: number;
    attendanceRate: number;
    todayLogs: Array<{
      id: string;
      teacher_name: string;
      check_in_time: string | null;
      status: string;
    }>;
  };
  pickups: {
    totalToday: number;
    waitingCount: number;
    completedCount: number;
    activeQueue: Array<{
      id: string;
      student_name: string;
      class_name: string;
      picker_name: string;
      picker_relation: string;
      created_at: string;
      status: string;
    }>;
  };
  announcements: Array<{
    id: string;
    title: string;
    category: string;
    created_at: string;
  }>;
  classroomsCount: number;
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // Parallel fetch of all 7 independent dashboard data sources
    const [
      studentsRes,
      applicantsRes,
      teachersRes,
      staffAttendanceRes,
      pickupRes,
      classesRes,
      announcementsRes,
    ] = await Promise.all([
      // 1. Students Count & Distribution
      supabase.from("students").select("id, program, is_active"),
      // 2. Admissions / Applicants Data (excluding soft deleted)
      supabase
        .from("applicants")
        .select("id, registration_no, student_name, program, status, created_at, batch, payment_note")
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("created_at", { ascending: false }),
      // 3. Teachers
      supabase.from("teachers").select("id, full_name"),
      // 4. Staff Attendance for today
      supabase
        .from("staff_attendance")
        .select("id, check_in_time, status, teachers ( full_name )")
        .eq("date", todayStr)
        .order("check_in_time", { ascending: false }),
      // 5. Pickup Queue for today
      supabase
        .from("pickup_queue")
        .select("id, pickup_date, status, picked_by_name, picked_by_relation, created_at, students ( full_name, class_id )")
        .eq("pickup_date", todayStr)
        .order("created_at", { ascending: true }),
      // 6. School Classes
      supabase.from("school_classes").select("id, name, grade"),
      // 7. Announcements
      supabase
        .from("announcements")
        .select("id, title, category, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    // 1. Process Students
    const studentsList = studentsRes.data || [];
    const totalStudents = studentsList.length;
    const preschool = studentsList.filter((s) => s.program === "PRESCHOOL").length;
    const kindergarten = studentsList.filter((s) => s.program === "KINDERGARTEN").length;
    const primary = studentsList.filter((s) => s.program === "PRIMARY_SCHOOL" || !s.program).length;

    // 2. Process Admissions
    const applicantsList = applicantsRes.data || [];
    const totalApplicants = applicantsList.length;
    const pendingApplicants = applicantsList.filter(
      (a) => a.status === "PENDING" || a.status === "WAITING_REVIEW" || a.status === "SUBMITTED"
    ).length;
    const enrolledApplicants = applicantsList.filter(
      (a) => a.status === "ENROLLED" || a.status === "ACCEPTED"
    ).length;
    const rejectedApplicants = applicantsList.filter((a) => a.status === "REJECTED").length;

    const currentBatchKey = getCurrentActiveBatch();
    const currentBatchInfo = getBatchInfo(currentBatchKey);

    const recentApplicants = applicantsList.slice(0, 5).map((a) => ({
      id: a.id,
      registration_no: a.registration_no,
      student_name: a.student_name,
      program: a.program,
      status: a.status,
      created_at: a.created_at,
      batch: a.batch || null,
    }));

    // 3. Process Teachers
    const totalTeachers = teachersRes.data?.length || 0;
    const staffLogs = staffAttendanceRes.data || [];
    const presentStaff = staffLogs.filter((l) => l.status === "HADIR").length;
    const attendanceRate =
      totalTeachers > 0 ? Math.round((presentStaff / totalTeachers) * 100) : 0;

    const todayStaffLogs = staffLogs.slice(0, 4).map((l: any) => ({
      id: l.id,
      teacher_name: l.teachers?.full_name || "Guru",
      check_in_time: l.check_in_time ? l.check_in_time.substring(0, 5) : "-",
      status: l.status || "HADIR",
    }));

    // 4. Process Pickup Queue
    const pickupList = pickupRes.data || [];
    const totalPickupsToday = pickupList.length;
    const waitingPickups = pickupList.filter(
      (p) => p.status === "WAITING" || p.status === "CALLED"
    );
    const completedPickups = pickupList.filter((p) => p.status === "PICKED_UP").length;

    const classesData = classesRes.data || [];
    const classMap = new Map(classesData.map((c) => [c.id, c.name || `Kelas ${c.grade}`]));

    const activePickupQueue = waitingPickups.slice(0, 4).map((p: any) => ({
      id: p.id,
      student_name: p.students?.full_name || "Siswa",
      class_name: p.students?.class_id
        ? classMap.get(p.students.class_id) || p.students.class_id
        : "Kelas",
      picker_name: p.picked_by_name || "Orang Tua",
      picker_relation: p.picked_by_relation || "Wali",
      created_at: p.created_at,
      status: p.status,
    }));

    // 5. Process Announcements
    const announcements = (announcementsRes.data || []).map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category || "GENERAL",
      created_at: a.created_at,
    }));

    return {
      students: {
        total: totalStudents,
        preschool,
        kindergarten,
        primary,
      },
      admissions: {
        total: totalApplicants,
        pending: pendingApplicants,
        enrolled: enrolledApplicants,
        rejected: rejectedApplicants,
        activeBatch: currentBatchKey,
        activeBatchLabel: currentBatchInfo.label,
        recentApplicants,
      },
      teachers: {
        total: totalTeachers,
        presentToday: presentStaff,
        attendanceRate,
        todayLogs: todayStaffLogs,
      },
      pickups: {
        totalToday: totalPickupsToday,
        waitingCount: waitingPickups.length,
        completedCount: completedPickups,
        activeQueue: activePickupQueue,
      },
      announcements,
      classroomsCount: classesData?.length || 0,
    };
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    // Fallback safe default
    const currentBatchKey = getCurrentActiveBatch();
    return {
      students: { total: 0, preschool: 0, kindergarten: 0, primary: 0 },
      admissions: {
        total: 0,
        pending: 0,
        enrolled: 0,
        rejected: 0,
        activeBatch: currentBatchKey,
        activeBatchLabel: getBatchInfo(currentBatchKey).label,
        recentApplicants: [],
      },
      teachers: { total: 0, presentToday: 0, attendanceRate: 0, todayLogs: [] },
      pickups: { totalToday: 0, waitingCount: 0, completedCount: 0, activeQueue: [] },
      announcements: [],
      classroomsCount: 0,
    };
  }
}
