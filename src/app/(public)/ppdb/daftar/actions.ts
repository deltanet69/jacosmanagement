"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function submitApplicant(formData: FormData) {
  const supabase = createAdminClient();

  try {
    const dataString = formData.get("data") as string;
    if (!dataString) throw new Error("Data pendaftaran tidak ditemukan");
    const data = JSON.parse(dataString);

    // 1. Generate Registration No
    const prefix = "JCS-" + new Date().getFullYear();
    const { data: lastApplicant } = await supabase
      .from("applicants")
      .select("registration_no")
      .order("submitted_at", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastApplicant && lastApplicant.length > 0) {
      const lastNo = lastApplicant[0].registration_no;
      const match = lastNo.match(/-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const registrationNo = `${prefix}-${nextNum.toString().padStart(5, "0")}`;

    // 2. Insert into applicants
    const applicantData = {
      registration_no: registrationNo,
      student_name: data.fullName,
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
      program: data.program === "Preschool" ? "PRESCHOOL" : data.program === "Kindergarten" ? "KINDERGARTEN" : "PRIMARY_SCHOOL",
      status: "SUBMITTED",
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_relation: data.emergencyContactRelation,
      emergency_contact_phone: data.emergencyContactPhone,
      daily_transportation: data.dailyTransportation,
      authorized_pickup_name: data.authorizedPickup,
      media_consent: data.mediaConsent,
    };

    const { data: newApplicant, error: applicantError } = await supabase
      .from("applicants")
      .insert(applicantData)
      .select()
      .single();

    if (applicantError) {
      console.error("Error creating applicant:", applicantError);
      return {
        success: false,
        message: "Gagal menyimpan data siswa: " + applicantError.message,
      };
    }

    // 3. Insert guardians (Father, Mother, Guardian if exists)
    const guardiansToInsert = [];
    if (data.fatherName) {
      guardiansToInsert.push({
        applicant_id: newApplicant.id,
        full_name: data.fatherName,
        nik: data.fatherNik,
        occupation: data.fatherJob || "-",
        relation: "FATHER",
        phone: data.fatherPhone,
        email: data.fatherEmail,
      });
    }
    if (data.motherName) {
      guardiansToInsert.push({
        applicant_id: newApplicant.id,
        full_name: data.motherName,
        nik: data.motherNik,
        occupation: data.motherJob || "-",
        relation: "MOTHER",
        phone: data.motherPhone,
        email: data.motherEmail,
      });
    }
    if (data.guardianName) {
      guardiansToInsert.push({
        applicant_id: newApplicant.id,
        full_name: data.guardianName,
        occupation: "-",
        relation: data.guardianRelation || "GUARDIAN",
        phone: data.guardianPhone,
      });
    }

    if (guardiansToInsert.length > 0) {
      const { error: guardianError } = await supabase
        .from("guardians")
        .insert(guardiansToInsert);

      if (guardianError) {
        console.error("Error creating guardians:", guardianError);
        return {
          success: false,
          message: "Gagal menyimpan data orang tua: " + guardianError.message,
        };
      }
    }

    // 4. Upload Documents
    const docKeys = ["akte", "kk", "ktp_orangtua", "foto4x3", "kartu_imunisasi", "rapor"];
    for (const key of docKeys) {
      const file = formData.get(`file_${key}`) as File;
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop();
        const filePath = `${newApplicant.id}/${key}.${ext}`;
        
        const buffer = await file.arrayBuffer();
        
        const { error: uploadError } = await supabase.storage
          .from("admission-documents")
          .upload(filePath, buffer, {
            contentType: file.type,
          });
          
        if (uploadError) {
          console.error(`Error uploading ${key}:`, uploadError);
        } else {
          let type = "OTHER";
          if (key === "akte") type = "BIRTH_CERTIFICATE";
          if (key === "kk") type = "FAMILY_CARD";
          if (key === "ktp_orangtua") type = "PARENT_ID";
          if (key === "foto4x3") type = "PHOTO_4X3";
          if (key === "kartu_imunisasi") type = "IMMUNIZATION_CARD";
          if (key === "rapor") type = "PREVIOUS_REPORT";
          
          await supabase.from("documents").insert({
            applicant_id: newApplicant.id,
            type,
            file_url: filePath,
          });
        }
      }
    }

    return { success: true, registrationNo };
  } catch (err: any) {
    console.error(err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem" };
  }
}
