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
      birth_place: data.birthPlace,
      birth_date: data.birthDate ? new Date(data.birthDate).toISOString() : null,
      gender: data.gender === "Laki-laki" ? "MALE" : "FEMALE",
      category:
        data.category === "Pindahan" ? "TRANSFER_STUDENT" : "NEW_STUDENT",
      nisn: data.nisn || null,
      address: data.address,
      program:
        data.program === "Kindergarten" ? "KINDERGARTEN" : "PRIMARY_SCHOOL",
      status: "SUBMITTED",
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

    // 3. Map relation value
    let relation = "GUARDIAN";
    if (data.parentRelation === "ayah") relation = "FATHER";
    else if (data.parentRelation === "ibu") relation = "MOTHER";

    // 4. Insert into guardians with all fields
    const guardianData = {
      applicant_id: newApplicant.id,
      full_name: data.parentName,
      birth_place: data.parentBirthPlace || "-",
      birth_date: data.parentBirthDate
        ? new Date(data.parentBirthDate).toISOString()
        : new Date("1980-01-01").toISOString(),
      occupation: data.parentJob || "Lainnya",
      education_level: data.parentEducation || "S1",
      address: data.parentAddress || data.address,
      relation,
      phone: data.phone,
      email: data.email,
    };

    const { error: guardianError } = await supabase
      .from("guardians")
      .insert(guardianData);

    if (guardianError) {
      console.error("Error creating guardian:", guardianError);
      return {
        success: false,
        message: "Gagal menyimpan data orang tua: " + guardianError.message,
      };
    }

    // 5. Upload Documents
    const docKeys = ["kk", "akte", "foto4x3", "foto2x3"];
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
          let type = "PHOTO_4X3";
          if (key === "kk") type = "FAMILY_CARD";
          if (key === "akte") type = "BIRTH_CERTIFICATE";
          if (key === "foto2x3") type = "PHOTO_2X3";
          
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
