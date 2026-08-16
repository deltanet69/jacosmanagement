import { notFound } from "next/navigation";
import { getStudentDetail } from "../actions-detail";
import { getAllClasses } from "../../classroom/actions";
import SiswaDetailClient from "./client-page";

export const dynamic = "force-dynamic";

export default async function SiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [student, classes] = await Promise.all([
    getStudentDetail(id),
    getAllClasses()
  ]);

  if (!student) {
    notFound();
  }

  return <SiswaDetailClient student={student} classes={classes} />;
}
