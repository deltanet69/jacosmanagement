"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function getStudentDetail(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      school_classes (id, name),
      student_parents (*),
      student_guardians (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching student detail:", error);
    return null;
  }
  return data;
}

export async function updateStudent(id: string, formData: any) {
  const supabase = createAdminClient();
  
  // Update students table
  const { error: studentError } = await supabase
    .from("students")
    .update({
      full_name: formData.full_name,
      nis: formData.nis,
      nisn: formData.nisn,
      gender: formData.gender,
      program: formData.program,
      is_active: formData.is_active,
      rf_id: formData.rf_id,
      class_id: formData.class_id,
      birth_place: formData.birth_place,
      birth_date: formData.birth_date,
      address: formData.address
    })
    .eq("id", id);

  if (studentError) {
    return { success: false, message: studentError.message };
  }

  // Update parents if they exist in form (simplified for now)
  // In a full implementation, you'd update student_parents and student_guardians separately
  
  return { success: true };
}
