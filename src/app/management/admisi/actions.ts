"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getApplicants() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applicants")
    .select(`
      *,
      guardians (*)
    `)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching applicants:", error);
    return [];
  }
  return data || [];
}

export async function getApplicantDetail(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applicants")
    .select(`
      *,
      guardians (*),
      documents (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching applicant detail:", error);
    return null;
  }
  
  // Generate signed URLs for private documents
  if (data?.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      const { data: urlData } = await supabase.storage
        .from("admission-documents")
        .createSignedUrl(doc.file_url, 3600);
      if (urlData) {
        doc.signed_url = urlData.signedUrl;
      }
    }
  }
  
  return data;
}

export async function updatePaymentStatus(applicantId: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("applicants")
    .update({ payment_status: status })
    .eq("id", applicantId);

  if (error) {
    console.error("Error updating payment status:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  return { success: true };
}

export async function getClasses() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("school_classes").select("*").order("grade", { ascending: true });
  return data || [];
}

export async function approveAndAssignClass(applicantId: string, classId: string) {
  const supabase = createAdminClient();

  // 1. Fetch applicant data
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("id", applicantId)
    .single();

  if (applicantError || !applicant) return { success: false, message: "Pendaftar tidak ditemukan." };

  // 2. Insert into students table
  const studentData = {
    applicant_id: applicant.id,
    full_name: applicant.student_name,
    nisn: applicant.nisn,
    gender: applicant.gender,
    program: applicant.program,
    birth_place: applicant.birth_place,
    birth_date: applicant.birth_date,
    address: applicant.address,
    class_id: classId,
    is_active: true
  };

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert(studentData)
    .select()
    .single();

  if (studentError) {
    console.error("Error inserting student:", studentError);
    return { success: false, message: "Gagal memindahkan data ke tabel Siswa." };
  }

  // 3. Insert guardian into student_parents
  const guardian = applicant.guardians ? (Array.isArray(applicant.guardians) ? applicant.guardians[0] : applicant.guardians) : null;
  if (guardian) {
    const parentData = {
      student_id: student.id,
      father_name: guardian.relation === "FATHER" ? guardian.full_name : null,
      mother_name: guardian.relation === "MOTHER" ? guardian.full_name : null,
      father_occupation: guardian.relation === "FATHER" ? guardian.occupation : null,
      mother_occupation: guardian.relation === "MOTHER" ? guardian.occupation : null,
      father_education: guardian.relation === "FATHER" ? guardian.education_level : null,
      mother_education: guardian.relation === "MOTHER" ? guardian.education_level : null,
      phone_number: guardian.phone,
    };
    
    await supabase.from("student_parents").insert(parentData);
  }

  // 4. Update applicant status and student_record_id
  await supabase
    .from("applicants")
    .update({ 
      status: "ENROLLED",
      student_record_id: student.id 
    })
    .eq("id", applicantId);

  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  revalidatePath("/management/siswa");

  return { success: true };
}

export async function rejectApplicant(applicantId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("applicants")
    .update({ status: "REJECTED" })
    .eq("id", applicantId);
    
  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  return { success: true };
}
