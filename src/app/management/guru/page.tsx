import { createClient } from "@/lib/supabase/server";
import { GuruListClient } from "@/components/hr/GuruListClient";

export const metadata = {
  title: "Data Guru & Staf - JACOS HR Management",
};

export default async function GuruPage() {
  const supabase = await createClient();

  // Fetch employees data
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, full_name, nik, employee_type, position, status, phone")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error);
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <GuruListClient initialData={employees || []} />
    </div>
  );
}
