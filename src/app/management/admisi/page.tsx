import { getApplicants, getBatchApprovedStudents, getClasses } from "./actions";
import AdmisiClient from "./client-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Online Admission - JACOS Management",
  description: "Manajemen pendaftaran siswa baru online admission JACOS",
};

export default async function AdmisiPage() {
  const [applicants, batchStudents, classes] = await Promise.all([
    getApplicants(),
    getBatchApprovedStudents(),
    getClasses(),
  ]);

  return (
    <AdmisiClient
      initialApplicants={applicants}
      initialBatchStudents={batchStudents}
      initialClasses={classes}
    />
  );
}
