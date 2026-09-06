import { getEmployees } from "./actions";
import { GuruListClient } from "@/components/hr/GuruListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data Guru & Staf - JACOS HR Management",
  description: "Manajemen data profil dan penugasan guru, staf, dan karyawan JACOS",
};

export default async function HrGuruPage() {
  const employees = await getEmployees();

  return (
    <div className="max-w-full mx-auto pb-12 w-full">
      <GuruListClient initialData={employees} />
    </div>
  );
}
