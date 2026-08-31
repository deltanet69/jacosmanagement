import { getStudentAttendanceRecap } from "./actions";
import { StudentAttendanceClient } from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rekap Absensi Siswa - JACOS Admin",
  description: "Dashboard rekapitulasi kehadiran siswa JACOS per kelas dan tanggal",
};

interface SearchParams {
  date?: string;
  classId?: string;
}

export default async function RekapAbsensiSiswaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const todayStr = new Date().toISOString().split("T")[0];
  const filterDate = params.date || todayStr;
  const filterClassId = params.classId || "ALL";

  const data = await getStudentAttendanceRecap(filterDate, filterClassId);

  return (
    <StudentAttendanceClient
      initialDate={filterDate}
      initialClassId={filterClassId}
      summary={data.summary}
      items={data.items}
      classes={data.classes}
      classBreakdown={data.classBreakdown}
    />
  );
}
