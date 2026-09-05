import { getApplicantDetail } from "../actions";
import ApplicantDetailClient from "./client-page";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail Pendaftar - JACOS Management",
  description: "Detail data pendaftar calon siswa JACOS",
};

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = await params;
  const applicant = await getApplicantDetail(applicantId);

  if (!applicant) {
    notFound();
  }

  return <ApplicantDetailClient initialApplicant={applicant} applicantId={applicantId} />;
}
