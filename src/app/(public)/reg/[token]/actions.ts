"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { sendFormWaitingApprovalEmail } from "@/lib/email";
import { isValidEmail, getFirstValidEmail } from "@/lib/utils";

// Verifikasi token dan kembalikan data pendaftar (prefill)
export async function getApplicantByToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("registration_token", token)
    .single();

  if (error || !data) return null;
  return data;
}

// Submit form lengkap dari orang tua
export async function submitApplicantByToken(token: string, formData: FormData) {
  const supabase = createAdminClient();

  try {
    // 1. Cek token
    const { data: applicant, error: findError } = await supabase
      .from("applicants")
      .select("*, guardians(*)")
      .eq("registration_token", token)
      .single();

    if (findError || !applicant) {
      return { success: false, message: "Link pendaftaran tidak valid atau sudah kadaluarsa." };
    }

    if (applicant.form_submitted) {
      return { success: false, message: "Formulir ini sudah pernah dikirimkan." };
    }

    const dataString = formData.get("data") as string;
    if (!dataString) return { success: false, message: "Data pendaftaran tidak ditemukan." };
    const data = JSON.parse(dataString);

    // 2. Update applicant dengan data lengkap dari form
    const updatePayload: Record<string, any> = {
      student_name: data.fullName || applicant.student_name,
      preferred_name: data.preferredName,
      birth_place: data.birthPlace,
      birth_date: data.birthDate ? new Date(data.birthDate).toISOString() : null,
      gender: data.gender === "Laki-laki" ? "MALE" : "FEMALE",
      category: data.category === "Pindahan" ? "TRANSFER_STUDENT" : "NEW_STUDENT",
      nik: data.nik || null,
      nisn: data.nisn || null,
      religion: data.religion,
      nationality: data.nationality,
      address: data.address,
      primary_language: data.primaryLanguage,
      child_order: data.childOrder,
      previous_school: data.previousSchool,
      blood_type: data.bloodType,
      allergies_special_needs: data.allergiesSpecialNeeds,
      medical_history: data.medicalHistory,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_relation: data.emergencyContactRelation,
      emergency_contact_phone: data.emergencyContactPhone,
      daily_transportation: data.dailyTransportation,
      authorized_pickup_name: data.authorizedPickup || null,
      media_consent: data.mediaConsent,
      status: "SUBMITTED",
      form_submitted: true,
      submitted_at: new Date().toISOString(),
    };

    if (data.height !== undefined && data.height !== "") {
      updatePayload.height = Number(data.height) || data.height;
    }
    if (data.weight !== undefined && data.weight !== "") {
      updatePayload.weight = Number(data.weight) || data.weight;
    }

    let { error: updateError } = await supabase
      .from("applicants")
      .update(updatePayload)
      .eq("id", applicant.id);

    // Fallback tangguh jika kolom height/weight belum ditambahkan di DB
    if (updateError && (updateError.message?.toLowerCase().includes("height") || updateError.message?.toLowerCase().includes("weight") || updateError.code === "PGRST204")) {
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.height;
      delete fallbackPayload.weight;
      const retry = await supabase.from("applicants").update(fallbackPayload).eq("id", applicant.id);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("Error updating applicant:", updateError);
      return { success: false, message: "Gagal menyimpan data: " + updateError.message };
    }

    const guardiansToUpsert = [];
    if (data.fatherName) {
      guardiansToUpsert.push({
        applicant_id: applicant.id,
        full_name: data.fatherName,
        nik: data.fatherNik || "-",
        occupation: data.fatherJob || "-",
        relation: "FATHER",
        phone: data.fatherPhone,
        email: data.fatherEmail,
        birth_place: "-",
        birth_date: new Date().toISOString(),
        education_level: "S1",
        address: "-",
        monthly_income: data.fatherIncome || null,
      });
    }
    if (data.motherName) {
      guardiansToUpsert.push({
        applicant_id: applicant.id,
        full_name: data.motherName,
        nik: data.motherNik || "-",
        occupation: data.motherJob || "-",
        relation: "MOTHER",
        phone: data.motherPhone,
        email: data.motherEmail,
        birth_place: "-",
        birth_date: new Date().toISOString(),
        education_level: "S1",
        address: "-",
        monthly_income: data.motherIncome || null,
      });
    }
    if (data.guardianName) {
      guardiansToUpsert.push({
        applicant_id: applicant.id,
        full_name: data.guardianName,
        nik: "-",
        occupation: "-",
        relation: data.guardianRelation || "GUARDIAN",
        phone: data.guardianPhone || "-",
        email: "-",
        birth_place: "-",
        birth_date: new Date().toISOString(),
        education_level: "S1",
        address: "-",
        monthly_income: data.guardianIncome || null,
      });
    }

    if (guardiansToUpsert.length > 0) {
      // Hapus guardian lama dulu (yang diisi admin), lalu insert yang lengkap dari orang tua
      await supabase.from("guardians").delete().eq("applicant_id", applicant.id);
      let { error: insertGuardiansErr } = await supabase.from("guardians").insert(guardiansToUpsert);

      // Fallback tangguh jika kolom monthly_income belum ditambahkan di DB
      if (insertGuardiansErr && (insertGuardiansErr.message?.toLowerCase().includes("monthly_income") || insertGuardiansErr.code === "PGRST204")) {
        const fallbackGuardians = guardiansToUpsert.map(({ monthly_income, ...rest }) => rest);
        const retry = await supabase.from("guardians").insert(fallbackGuardians);
        insertGuardiansErr = retry.error;
      }

      if (insertGuardiansErr) console.error("Error inserting guardians:", insertGuardiansErr);
    }

    // 4. Upload dokumen — simpan URL ke kolom doc_* di applicants
    const docFieldMap: Record<string, string> = {
      akte: "doc_birth_certificate",
      kk: "doc_family_card",
      ktp_orangtua: "doc_parent_id",
      foto4x3: "doc_photo_4x3",
      kartu_imunisasi: "doc_immunization_card",
      rapor: "doc_previous_report",
    };

    const docKeys = Object.keys(docFieldMap);
    const uploadPromises = docKeys.map(async (key) => {
      const file = formData.get(`file_${key}`) as File;
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop();
        const filePath = `${applicant.id}/${key}.${ext}`;
        const buffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("admission-documents")
          .upload(filePath, buffer, { contentType: file.type, upsert: true });

        if (!uploadError) {
          const { error: updateErr } = await supabase
            .from("applicants")
            .update({ [docFieldMap[key]]: filePath })
            .eq("id", applicant.id);
          if (updateErr) console.error("Error updating doc column:", updateErr);
        } else {
          console.error(`Upload error for ${key}:`, uploadError);
        }
      }
    });

    await Promise.all(uploadPromises);

    // 5. Kirim email konfirmasi ke orang tua
    const guardiansList = applicant.guardians
      ? (Array.isArray(applicant.guardians) ? applicant.guardians : [applicant.guardians])
      : [];

    const emailTarget = getFirstValidEmail(
      data.fatherEmail,
      data.motherEmail,
      ...guardiansList.map((g: any) => g?.email)
    );

    const parentName =
      (data.fatherName && isValidEmail(data.fatherEmail) ? data.fatherName : null) ||
      (data.motherName && isValidEmail(data.motherEmail) ? data.motherName : null) ||
      data.fatherName ||
      data.motherName ||
      guardiansList[0]?.full_name ||
      "Orang Tua";

    const studentName = data.fullName || applicant.student_name;
    const programLabel: Record<string, string> = {
      PRESCHOOL: "Preschool",
      KINDERGARTEN: "Kindergarten",
      PRIMARY_SCHOOL: "Primary School",
    };

    let resendResult: any = null;
    if (emailTarget) {
      resendResult = await sendFormWaitingApprovalEmail({
        parentName,
        parentEmail: emailTarget,
        studentName,
        registrationNo: applicant.registration_no,
        program: applicant.program,
      });
      console.log("Form waiting approval email sent to", emailTarget, "result:", resendResult);
    } else {
      console.warn("No valid parent email found for applicant:", applicant.registration_no);
    }

    return {
      success: true,
      registrationNo: applicant.registration_no,
      studentName,
      parentName,
      emailSent: resendResult?.success ?? false,
    };
  } catch (err: any) {
    console.error(err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem." };
  }
}
