import { notFound } from "next/navigation";
import {
  getAllClasses,
  getClassDetail,
  getClassStudents,
  getClassSchedule,
  getClassPosts,
  getClassAbsences,
  getTodaySchedule,
  getTodayAttendanceSummary,
} from "../actions";
import ClassroomClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const [
    allClasses,
    { cls, studentCount },
    students,
    schedule,
    posts,
    absences,
    todaySchedule,
    summary,
  ] = await Promise.all([
    getAllClasses(),
    getClassDetail(classId),
    getClassStudents(classId),
    getClassSchedule(classId),
    getClassPosts(classId),
    getClassAbsences(classId),
    getTodaySchedule(classId),
    getTodayAttendanceSummary(classId),
  ]);

  if (!cls) notFound();

  return (
    <ClassroomClientPage
      classId={classId}
      cls={cls}
      allClasses={allClasses}
      studentCount={studentCount}
      students={students}
      schedule={schedule}
      posts={posts}
      absences={absences}
      todaySchedule={todaySchedule}
      summary={summary}
    />
  );
}
