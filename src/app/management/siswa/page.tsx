import { getStudents } from "./actions";
import SiswaClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default async function SiswaPage() {
  const students = await getStudents();

  return <SiswaClientPage students={students} />;
}
