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

    // Simpan URL & reset status ke kolom di applicants
    const { error: updateErr } = await supabase
      .from("applicants")
      .update({
        doc_jacos_agreement: filePath,
        doc_jacos_agreement_status: 'PENDING',
        doc_jacos_agreement_note: null,
      })
      .eq("id", applicantId);

    if (updateErr) throw updateErr;

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

  const selectCols = 'id, status, student_record_id, doc_jacos_agreement, doc_jacos_agreement_status, doc_jacos_agreement_note, doc_photo_4x3, doc_birth_certificate, doc_immunization_card, doc_previous_report, doc_family_card, doc_parent_id';

  if (resolvedApplicantId) {
    const { data } = await supabase
      .from('applicants')
      .select(selectCols)
      .eq('id', resolvedApplicantId)
      .maybeSingle();
    if (data) applicantData = data;
  }

  if (!applicantData && userEmail) {
    const { data: guardians } = await supabase
      .from('guardians')
      .select(`applicant_id, applicants(${selectCols})`)
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

  if (!applicantData && resolvedStudentId) {
    const { data: applicantFallback } = await supabase
      .from('applicants')
      .select(selectCols)
      .eq('student_record_id', resolvedStudentId)
      .maybeSingle();

    if (applicantFallback) {
      applicantData = applicantFallback;
      resolvedApplicantId = applicantFallback.id;
    }
  }

  return { applicantData, applicantId: resolvedApplicantId, studentId: resolvedStudentId };
}

export async function getParentAnnouncements(studentClassId?: string | null) {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allAnnouncements = data || [];
    const filtered = allAnnouncements.filter((item: any) => {
      if (item.target_type === 'GENERAL') return true;
      if (item.target_type === 'SPECIFIC_CLASSES') {
        if (!studentClassId) return true;
        return Array.isArray(item.target_classes) && item.target_classes.includes(studentClassId);
      }
      return true;
    });

    return { success: true, data: filtered };
  } catch (err: any) {
    console.error("Error getParentAnnouncements:", err);
    return { success: false, data: [] };
  }
}
