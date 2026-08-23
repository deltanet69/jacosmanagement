"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { isValidEmail, getFirstValidEmail } from "@/lib/utils";
import { sendFormReceivedEmail, sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

// ============================================================
// UTILITY
// ============================================================

function generateToken(): string {
  return crypto.randomBytes(6).toString("hex");
}

function generateRegistrationNo(nextNum: number): string {
  const prefix = "JCS-" + new Date().getFullYear();
  return `${prefix}-${nextNum.toString().padStart(5, "0")}`;
}

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  let pass = upper[Math.floor(Math.random() * upper.length)];
  for (let i = 0; i < 7; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass;
}

// ============================================================
// READ
// ============================================================

export async function getApplicants() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applicants")
    .select(`*, guardians (*)`)
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
    .select(`*, guardians (*), documents (*)`)
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

export async function getClasses() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("school_classes")
    .select("*")
    .order("grade", { ascending: true });
  return data || [];
}

// ============================================================
// CREATE — Pendaftaran Baru oleh Admin
// ============================================================

export async function createNewAdmission(formData: {
  studentName: string;
  program: string;
  gender: string;
  parentRelation: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentNote: string;
}) {
  const supabase = createAdminClient();

  try {
    const { data: last } = await supabase
      .from("applicants")
      .select("registration_no")
      .order("submitted_at", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (last && last.length > 0) {
      const match = last[0].registration_no?.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    const registrationNo = generateRegistrationNo(nextNum);
    const registrationToken = generateToken();

    const programMap: Record<string, string> = {
      Preschool: "PRESCHOOL",
      Kindergarten: "KINDERGARTEN",
      Primary: "PRIMARY_SCHOOL",
    };

    const { data: newApplicant, error: insertError } = await supabase
      .from("applicants")
      .insert({
        registration_no: registrationNo,
        registration_token: registrationToken,
        student_name: formData.studentName,
        gender: formData.gender === "Laki-laki" ? "MALE" : "FEMALE",
        program: programMap[formData.program] || "PRIMARY_SCHOOL",
        birth_place: "-",
        birth_date: new Date().toISOString(),
        religion: "-",
        nationality: "WNI",
        address: "-",
        primary_language: "-",
        blood_type: "-",
        category: "NEW_STUDENT",
        status: "SUBMITTED",
        payment_status: "PAID",
        payment_amount: formData.paymentAmount,
        payment_method: formData.paymentMethod,
        payment_note: formData.paymentNote,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newApplicant) {
      console.error("Error creating admission:", insertError);
      return { success: false, message: insertError?.message || "Gagal membuat pendaftaran." };
    }

    const { error: guardianError } = await supabase.from("guardians").insert({
      applicant_id: newApplicant.id,
      full_name: formData.parentName,
      nik: "-",
      relation: formData.parentRelation === "Ayah" ? "FATHER" : "MOTHER",
      phone: formData.parentPhone,
      email: formData.parentEmail,
      occupation: "-",
      birth_place: "-",
      birth_date: new Date().toISOString(),
      education_level: "S1",
      address: "-",
    });

    if (guardianError) {
      console.error("Error creating guardian:", guardianError);
    }

    // ============================================================
    // Kirim email konfirmasi pendaftaran ke orang tua
    // ============================================================
    const cleanEmail = formData.parentEmail?.trim();
    if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      try {
        // 1. Buat akun auth untuk orang tua
        const tempPassword = generateTempPassword();
        const portalUrl = process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

        let finalPassword = tempPassword;
        const { error: authError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          user_metadata: {
            full_name: formData.parentName,
            role: "PARENT",
            first_login: true,
            applicant_id: newApplicant.id,
            admission_status: "Waiting for approval",
          },
          email_confirm: true,
        });

        if (authError) {
          const isAlreadyExists =
            authError.message.toLowerCase().includes("already") ||
            authError.message.toLowerCase().includes("exist") ||
            authError.code === "email_exists";

          if (isAlreadyExists) {
            const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const existingUser = userList?.users?.find(
              (u) => u.email?.toLowerCase() === cleanEmail.toLowerCase()
            );
            if (existingUser) {
              await supabase.auth.admin.updateUserById(existingUser.id, {
                password: tempPassword,
                user_metadata: {
                  ...(existingUser.user_metadata || {}),
                  full_name: formData.parentName,
                  role: "PARENT",
                  first_login: true,
                  applicant_id: newApplicant.id,
                  admission_status: "Waiting for approval",
                },
              });
              console.log("[createNewAdmission] Updated existing user password for:", cleanEmail);
            }
          } else {
            console.error("[createNewAdmission] Error creating parent auth user:", authError);
            finalPassword = ""; // Jangan kirim password jika ada error tak terduga
          }
        }

        // 2. Kirim email dengan detail portal access dan nomor registrasi
        const emailResult = await sendFormReceivedEmail({
          parentName: formData.parentName,
          parentEmail: cleanEmail,
          studentName: formData.studentName,
          registrationNo,
          program: formData.program,
          portalUrl,
          portalEmail: cleanEmail,
          portalPassword: finalPassword,
        });

        console.log("[createNewAdmission] Email sent to", cleanEmail, "result:", emailResult);
      } catch (emailErr) {
        // Email error tidak memblokir proses pendaftaran
        console.error("[createNewAdmission] Email error (non-fatal):", emailErr);
      }
    } else {
      console.warn("[createNewAdmission] Invalid or missing parent email:", formData.parentEmail);
    }

    revalidatePath("/management/admisi");
    return { success: true, applicantId: newApplicant.id, registrationToken };
  } catch (err: any) {
    console.error(err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem." };
  }
}

// ============================================================
// UPDATE — Payment Status
// ============================================================

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

// ============================================================
// APPROVE — Pindahkan ke Siswa + Kirim Email
// ============================================================

export async function approveAndAssignClass(applicantId: string, classId: string) {
  const supabase = createAdminClient();
  let resendResult: any = null;

  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("id", applicantId)
    .single();

  if (applicantError || !applicant)
    return { success: false, message: "Pendaftar tidak ditemukan." };

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      applicant_id: applicant.id,
      full_name: applicant.student_name,
      nisn: applicant.nisn,
      gender: applicant.gender,
      program: applicant.program,
      birth_place: applicant.birth_place,
      birth_date: applicant.birth_date,
      address: applicant.address,
      class_id: classId,
      is_active: true,
    })
    .select()
    .single();

  if (studentError) {
    console.error("Error inserting student:", studentError);
    return { success: false, message: "Gagal memindahkan data ke tabel Siswa." };
  }

  const guardiansList = applicant.guardians
    ? (Array.isArray(applicant.guardians) ? applicant.guardians : [applicant.guardians])
    : [];

  const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
  const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

  if (guardian) {
    await supabase.from("student_parents").insert({
      student_id: student.id,
      father_name: guardian.relation === "FATHER" ? guardian.full_name : null,
      mother_name: guardian.relation === "MOTHER" ? guardian.full_name : null,
      father_occupation: guardian.relation === "FATHER" ? guardian.occupation : null,
      mother_occupation: guardian.relation === "MOTHER" ? guardian.occupation : null,
      phone_number: guardian.phone,
    });

    if (targetEmail) {
      const tempPassword = generateTempPassword();

      const { error: authError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: tempPassword,
        user_metadata: {
          full_name: guardian.full_name,
          role: "PARENT",
          first_login: true,
          student_id: student.id,
          admission_status: "Approved",
        },
        email_confirm: true,
      });

      let shouldSendEmail = false;
      let isExistingUser = false;

      if (authError) {
        const isAlreadyExists =
          authError.message.toLowerCase().includes("already") ||
          authError.message.toLowerCase().includes("exist") ||
          authError.code === "email_exists";

        if (isAlreadyExists) {
          const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = userList?.users?.find(
            (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
          );
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                ...(existingUser.user_metadata || {}),
                full_name: guardian.full_name,
                role: "PARENT",
                student_id: student.id,
                admission_status: "Approved",
              },
            });
            shouldSendEmail = true;
            isExistingUser = true;
          }
        } else {
          console.error("Error creating auth user:", authError);
        }
      } else {
        shouldSendEmail = true;
      }

      const portalUrl = process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

      if (shouldSendEmail) {
        resendResult = await sendApprovalEmail({
          parentName: guardian.full_name,
          parentEmail: targetEmail,
          studentName: applicant.student_name,
          registrationNo: applicant.registration_no,
          tempPassword: isExistingUser ? undefined : tempPassword,
          program: applicant.program,
          portalUrl,
        });
        console.log("[admisi] Approval email result:", resendResult);
      }
    } else {
      console.warn("[admisi] No valid email for approval:", applicantId);
    }
  }

  await supabase
    .from("applicants")
    .update({ status: "ENROLLED", student_record_id: student.id })
    .eq("id", applicantId);

  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  revalidatePath("/management/siswa");

  return { success: true, emailSent: resendResult?.success ?? false };
}

// ============================================================
// REJECT — Update Status + Kirim Email
// ============================================================

export async function rejectApplicant(applicantId: string, reason?: string) {
  const supabase = createAdminClient();
  let resendResult: any = null;

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("id", applicantId)
    .single();

  await supabase
    .from("applicants")
    .update({ status: "REJECTED", rejection_reason: reason || null })
    .eq("id", applicantId);

  if (applicant) {
    const guardiansList = applicant.guardians
      ? (Array.isArray(applicant.guardians) ? applicant.guardians : [applicant.guardians])
      : [];
    const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
    const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

    if (targetEmail && guardian) {
      resendResult = await sendRejectionEmail({
        parentName: guardian.full_name,
        parentEmail: targetEmail,
        studentName: applicant.student_name,
        registrationNo: applicant.registration_no,
        reason: reason || "Belum ada keterangan dari admin.",
      });
    }
  }

  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  return { success: true, emailSent: resendResult?.success ?? false };
}
