import { createClient } from "@/lib/supabase/server";
import { PengumumanListClient } from "@/components/hr/PengumumanListClient";

export const metadata = {
  title: "Pengumuman HR - JACOS HR Management",
};

export default async function PengumumanPage() {
  const supabase = await createClient();

  // Fetch announcements data
  const { data: announcements, error } = await supabase
    .from("hr_announcements")
    .select(`
      id, 
      title, 
      category, 
      content, 
      is_priority, 
      published_at,
      author:created_by ( full_name )
    `)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error);
  }

  // Transform data if author mapping is nested depending on the exact foreign key
  // Usually author:created_by (full_name) returns an object, or array depending on relation
  const formattedData = (announcements || []).map(a => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author
  }));

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <PengumumanListClient initialData={formattedData as any} />
    </div>
  );
}
