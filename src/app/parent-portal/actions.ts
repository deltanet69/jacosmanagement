"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function uploadJacosAgreement(applicantId: string, formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File;
  
  if (!file || !applicantId) {
    return { success: false, message: "Data tidak lengkap" };
  }

  try {
    const ext = file.name.split(".").pop();
    const filePath = `${applicantId}/JACOS_AGREEMENT_${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("admission-documents")
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    // Check if agreement document already exists
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("applicant_id", applicantId)
      .in("type", ["JACOS_AGREEMENT"]) // wait, the column could be type or document_type
      .single();

    if (existingDoc) {
      const { error: updateErr } = await supabase
        .from("documents")
        .update({
          file_url: filePath,
          verification: 'PENDING',
          review_note: null,
          uploaded_at: new Date().toISOString()
        })
        .eq("id", existingDoc.id);
        
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from("documents")
        .insert({
          applicant_id: applicantId,
          type: 'JACOS_AGREEMENT',
          file_url: filePath,
          verification: 'PENDING'
        });
        
      if (insertErr) throw insertErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error upload agreement:", err);
    return { success: false, message: err.message || "Gagal upload" };
  }
}

export async function getParentDashboardData(applicantId: string | null, userEmail: string | null, studentIdFromMeta: string | null) {
  const supabase = createAdminClient();
  let applicantData = null;
  let resolvedApplicantId = applicantId;
  let resolvedStudentId = studentIdFromMeta;

  // 1. Coba ambil dari DB applicants langsung
  if (resolvedApplicantId) {
    const { data } = await supabase
      .from('applicants')
      .select('id, status, student_record_id, documents(id, type, verification, review_note)')
      .eq('id', resolvedApplicantId)
      .maybeSingle();
    if (data) applicantData = data;
  }

  // 2. Fallback: Cari dari email guardian
  if (!applicantData && userEmail) {
    const { data: guardians } = await supabase
      .from('guardians')
      .select('applicant_id, applicants(id, status, student_record_id, documents(id, type, verification, review_note))')
      .ilike('email', userEmail)
      .limit(1);

    if (guardians && guardians.length > 0) {
      const app = (guardians[0] as any).applicants;
      if (app) {
        applicantData = app;
        resolvedApplicantId = app.id;
      }
    }
  }

  // 3. Fallback: Cari dari student_record_id
  if (!applicantData && resolvedStudentId) {
    const { data: applicantFallback } = await supabase
      .from('applicants')
      .select('id, status, student_record_id, documents(id, type, verification, review_note)')
      .eq('student_record_id', resolvedStudentId)
      .maybeSingle();

    if (applicantFallback) {
      applicantData = applicantFallback;
      resolvedApplicantId = applicantFallback.id;
    }
  }

  return { applicantData, applicantId: resolvedApplicantId, studentId: resolvedStudentId };
}
