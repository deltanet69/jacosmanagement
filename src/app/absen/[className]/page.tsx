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

  const attendance = await getTodayAttendanceByClass(cls.id);

  return <AbsenClientPage classData={cls} initialAttendance={attendance} />;
}
