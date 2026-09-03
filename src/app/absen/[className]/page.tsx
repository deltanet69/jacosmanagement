import { createAdminClient } from "@/lib/supabase/server";
import { getTodayAttendanceByClass } from "@/app/management/absensi/actions";
import AbsenClientPage from "./client-page";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AbsenPage(props: { params: Promise<{ className: string }> }) {
  const params = await props.params;
  const decodedClassName = decodeURIComponent(params.className);

  const supabase = createAdminClient();
  const { data: cls } = await supabase
    .from("school_classes")
    .select("id, name, grade")
    .ilike("name", decodedClassName)
    .single();

  if (!cls) {
    notFound();
  }

  const { count: totalStudents } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("class_id", cls.id)
    .eq("is_active", true);

  const attendance = await getTodayAttendanceByClass(cls.id);

  return (
    <AbsenClientPage
      classData={cls}
      initialAttendance={attendance}
      totalStudents={totalStudents || 0}
    />
  );
}
