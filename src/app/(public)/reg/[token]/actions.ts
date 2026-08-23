"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { sendFormReceivedEmail } from "@/lib/email";
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
    const { error: updateError } = await supabase
      .from("applicants")
      .update({
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
        authorized_pickup_name: data.authorizedPickup,
        media_consent: data.mediaConsent,
        status: "SUBMITTED",
        form_submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", applicant.id);

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
      });
    }
    if (data.guardianName) {
      guardiansToUpsert.push({
        applicant_id: applicant.id,
        full_name: data.guardianName,
        nik: "-",
        occupation: "-",
        relation: "GUARDIAN",
        phone: data.guardianPhone || "-",
        email: "-",
        birth_place: "-",
        birth_date: new Date().toISOString(),
        education_level: "S1",
        address: "-",
      });
    }

    if (guardiansToUpsert.length > 0) {
      // Hapus guardian lama dulu (yang diisi admin), lalu insert yang lengkap dari orang tua
      await supabase.from("guardians").delete().eq("applicant_id", applicant.id);
      const { error: insertGuardiansErr } = await supabase.from("guardians").insert(guardiansToUpsert);
      if (insertGuardiansErr) console.error("Error inserting guardians:", insertGuardiansErr);
    }

    // 4. Upload dokumen (Parallel untuk menghindari timeout di Vercel)
    const docKeys = ["akte", "kk", "ktp_orangtua", "foto4x3", "kartu_imunisasi", "rapor"];
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
          const typeMap: Record<string, string> = {
            akte: "BIRTH_CERTIFICATE",
            kk: "FAMILY_CARD",
            ktp_orangtua: "PARENT_ID",
            foto4x3: "PHOTO_4X3",
            kartu_imunisasi: "IMMUNIZATION_CARD",
            rapor: "PREVIOUS_REPORT",
          };
          
          const docType = typeMap[key] || "BIRTH_CERTIFICATE";
          
          // Delete old doc entry just in case to simulate upsert without unique constraint
          await supabase.from("documents").delete().match({ applicant_id: applicant.id, type: docType });

          // Insert dokumen
          const { error: docInsertErr } = await supabase.from("documents").insert({
            applicant_id: applicant.id,
            type: docType,
            file_url: filePath,
          });
          if (docInsertErr) console.error("Error inserting document:", docInsertErr);
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

    let portalPassword = "";
    
    let resendResult: any = null;
    if (emailTarget) {
      // Create user auto-generate password
      portalPassword = Math.random().toString(36).slice(-8) + "Aa1!"; // Secure random password
      
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: emailTarget,
        password: portalPassword,
        email_confirm: true,
        user_metadata: {
          first_login: true,
          applicant_id: applicant.id,
          role: "PARENT",
        },
      });

      if (createUserError) {
        // Kalau user sudah ada, reset passwordnya ke password baru yang akan kita kirim via email
        const isAlreadyExists = createUserError.message.toLowerCase().includes("already") || 
                                createUserError.message.toLowerCase().includes("exist") ||
                                createUserError.code === "email_exists";
        
        if (isAlreadyExists) {
          // Cari user ID dan update passwordnya
          const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === emailTarget.toLowerCase());
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: portalPassword,
              user_metadata: { ...(existingUser.user_metadata || {}), first_login: true, applicant_id: applicant.id, role: "PARENT" },
            });
            console.log("Existing user password reset for:", emailTarget);
          }
        } else {
          console.error("Error creating parent user:", createUserError);
          portalPassword = ""; // Tidak kirim password kalau error tidak dikenal
        }
      }

      const isProduction = process.env.NEXT_PUBLIC_PARENT_URL?.includes("parent.jacos.id");
      const portalUrl = isProduction 
        ? "https://parent.jacos.id" 
        : "https://jacosmanagement.vercel.app/parent-portal";

      resendResult = await sendFormReceivedEmail({
        parentName,
        parentEmail: emailTarget,
        studentName,
        registrationNo: applicant.registration_no,
        program: programLabel[applicant.program] || applicant.program,
        portalUrl,
        portalEmail: emailTarget,
        portalPassword,
      });
      console.log("Form received email sent to", emailTarget, "result:", resendResult);
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
