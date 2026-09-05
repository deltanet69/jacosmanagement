"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function getCompleteStudentProfile(userEmail: string | undefined, metaStudentId: string | undefined) {
  const supabase = createAdminClient();
  let student = null;
  let applicant = null;

  try {
    // 1. Try from metadata
    if (metaStudentId) {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, nis, nisn, gender, birth_date, birth_place, program, address, religion, profile_picture, applicant_id, school_classes(name, grade)")
        .eq("id", metaStudentId)
        .maybeSingle();
      if (data) student = data;
    }

    // 2. Try from email
    if (!student && userEmail) {
      const { data: gRows } = await supabase
        .from("guardians")
        .select("applicant_id, applicants(student_record_id, student_name, birth_date, birth_place, gender, program, address, status, nisn, religion, nationality, primary_language, blood_type, allergies_special_needs, medical_history, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, height, weight, child_order, previous_school)")
        .ilike("email", userEmail)
        .limit(1);
      
      if (gRows && gRows.length > 0) {
        const g = gRows[0] as any;
        if (g.applicants) {
          applicant = g.applicants;
          if (applicant.student_record_id) {
            const { data } = await supabase
              .from("students")
              .select("id, full_name, nis, nisn, gender, birth_date, birth_place, program, address, religion, profile_picture, applicant_id, school_classes(name, grade)")
              .eq("id", applicant.student_record_id)
              .maybeSingle();
            if (data) student = data;
          }
        }
      }
    }

    // 3. Fallback to get applicant if student has applicant_id
    if (student?.applicant_id && !applicant) {
      const { data: app } = await supabase
        .from("applicants")
        .select("id, student_name, birth_date, birth_place, gender, program, address, status, nik, nisn, religion, nationality, primary_language, blood_type, allergies_special_needs, medical_history, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, height, weight, child_order, previous_school")
        .eq("id", student.applicant_id)
        .maybeSingle();
      if (app) applicant = app;
    }

    return { success: true, student, applicant };
  } catch (error: any) {
    console.error("getCompleteStudentProfile error:", error);
    return { success: false, error: error.message };
  }
}

export async function getCompletePickupData(userEmail: string | undefined, metaStudentId: string | undefined) {
  const supabase = createAdminClient();
  let student = null;
  let applicant = null;
  let pickups: any[] = [];

  try {
    // 1. Try from metadata
    if (metaStudentId) {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, nis, program, school_classes(name, grade)")
        .eq("id", metaStudentId)
        .maybeSingle();
      if (data) student = data;
    }

    // 2. Try from email
    if (!student && userEmail) {
      const { data: gRows } = await supabase
        .from("guardians")
        .select("applicant_id, applicants(student_record_id, student_name, authorized_pickup_name, authorized_pickup_relation)")
        .ilike("email", userEmail)
        .limit(1);
      
      if (gRows && gRows.length > 0) {
        const g = gRows[0] as any;
        if (g.applicants) {
          applicant = g.applicants;
          if (applicant.student_record_id) {
            const { data } = await supabase
              .from("students")
              .select("id, full_name, nis, program, school_classes(name, grade)")
              .eq("id", applicant.student_record_id)
              .maybeSingle();
            if (data) student = data;
          }
        }
      }
    }

    // 3. Fetch pickups if student found
    if (student?.id) {
      const { data: p } = await supabase
        .from("pickup_queue")
        .select("id, pickup_date, status, picked_by_name, picked_by_relation, picked_up_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (p) pickups = p;
    }

    return { success: true, student, applicant, pickups };
  } catch (error: any) {
    console.error("getCompletePickupData error:", error);
    return { success: false, error: error.message };
  }
}
