"use server";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { isValidEmail, getFirstValidEmail } from "@/lib/utils";
import {
  sendInitialGreetingEmail,
  sendPublicAdmissionReceivedEmail,
  sendFormWaitingApprovalEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendAgreementApprovedEmail,
} from "@/lib/email";
import {
  AdmissionBatchKey,
  getCurrentActiveBatch,
  getBatchInfo,
} from "@/lib/admission-config";

// ============================================================
// UTILITY
// ============================================================

function generateToken(): string {
  return crypto.randomBytes(6).toString("hex");
}

async function getNextRegistrationNo(supabase: any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `JCS-${currentYear}`;

  const { data: allRegs } = await supabase
    .from("applicants")
    .select("registration_no")
    .like("registration_no", `${prefix}-%`);

  let maxNum = 0;
  if (allRegs && allRegs.length > 0) {
    for (const item of allRegs) {
      if (item.registration_no) {
        const match = item.registration_no.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  const nextNum = maxNum + 1;
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
// READ — Applicants & Classes
// ============================================================

export const getApplicants = cache(async function getApplicants() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applicants")
    .select(`*, guardians (*)`)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching applicants:", error);
    return [];
  }
  
  return (data || []).map((app: any) => ({
    ...app,
    guardians: Array.isArray(app.guardians) ? app.guardians : app.guardians ? [app.guardians] : [],
  }));
});

export const getApplicantDetail = cache(async function getApplicantDetail(id: string) {
  const supabase = createAdminClient();
  
  // 1. Fetch applicant base record
  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !applicant) {
    console.error("Error fetching applicant detail:", error);
    return null;
  }

  // 2. Direct fetch from guardians table by applicant_id for 100% data reliability
  const { data: guardians, error: guardianError } = await supabase
    .from("guardians")
    .select("*")
    .eq("applicant_id", id);

  if (guardianError) {
    console.error("Error fetching guardians for applicant:", guardianError.message);
  }

  const guardiansList = Array.isArray(guardians)
    ? guardians
    : guardians
    ? [guardians]
    : [];

  const mergedData = {
    ...applicant,
    guardians: guardiansList,
  };

  // Generate signed URLs for doc_* columns on applicants
  const docFields = [
    "doc_photo_4x3",
    "doc_birth_certificate",
    "doc_immunization_card",
    "doc_previous_report",
    "doc_family_card",
    "doc_parent_id",
    "doc_jacos_agreement",
    "doc_payment_proof",
  ] as const;

  const signedUrls: Record<string, string> = {};
  for (const field of docFields) {
    let filePath = (mergedData as any)[field];
    if (!filePath && field === "doc_payment_proof" && mergedData.payment_note?.includes("Bukti: ")) {
      filePath = mergedData.payment_note.split("Bukti: ")[1]?.trim();
    }
    if (filePath) {
      const { data: urlData } = await supabase.storage
        .from("admission-documents")
        .createSignedUrl(filePath, 3600);
      if (urlData) signedUrls[`${field}_signed`] = urlData.signedUrl;
    }
  }

  return { ...mergedData, ...signedUrls };
});

export const getClasses = cache(async function getClasses() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("school_classes")
    .select("id, name, grade, capacity")
    .order("grade", { ascending: true });

  if (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
  return data || [];
});

// ============================================================
// READ — Batch Approved Students
// ============================================================

export const getBatchApprovedStudents = cache(async function getBatchApprovedStudents() {
  const supabase = createAdminClient();

  try {
    // 1. Ambil data students yang berasal dari pendaftaran
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select(`
        id,
        applicant_id,
        full_name,
        nis,
        nisn,
        gender,
        program,
        class_id,
        created_at,
        school_classes ( id, name, grade )
      `)
      .order("created_at", { ascending: false });

    if (studentError) {
      console.error("Error fetching batch students:", studentError);
      return [];
    }

    // 2. Ambil data applicants terkait
    const applicantIds = (students || [])
      .map((s) => s.applicant_id)
      .filter(Boolean);

    let applicantsMap = new Map<string, any>();
    if (applicantIds.length > 0) {
      const { data: apps } = await supabase
        .from("applicants")
        .select(`id, registration_no, submitted_at, updated_at, status, payment_note, guardians (*)`)
        .in("id", applicantIds);

      if (apps) {
        apps.forEach((a) => applicantsMap.set(a.id, a));
      }
    }

    // 3. Format data dengan resolved batch
    return (students || []).map((s: any) => {
      const app = applicantsMap.get(s.applicant_id) || {};
      const guardians = app.guardians
        ? Array.isArray(app.guardians)
          ? app.guardians
          : [app.guardians]
        : [];
      const primaryGuardian =
        guardians.find((g: any) => isValidEmail(g?.email)) || guardians[0];

      // Resolve batch:
      // a) Dari column s.batch / app.batch jika ada
      // b) Dari tag di payment_note misal "[BATCH_1]"
      // c) Dari created_at date / submitted_at date
      let resolvedBatch: AdmissionBatchKey = "BATCH_1";

      if ((s as any).batch && ["BATCH_1", "BATCH_2", "BATCH_3"].includes((s as any).batch)) {
        resolvedBatch = (s as any).batch;
      } else if ((app as any).batch && ["BATCH_1", "BATCH_2", "BATCH_3"].includes((app as any).batch)) {
        resolvedBatch = (app as any).batch;
      } else if (app.payment_note && app.payment_note.includes("[BATCH_")) {
        const match = app.payment_note.match(/\[(BATCH_[123])\]/);
        if (match) resolvedBatch = match[1] as AdmissionBatchKey;
      } else {
        const dateToUse = new Date(app.submitted_at || s.created_at || new Date());
        resolvedBatch = getCurrentActiveBatch(dateToUse);
      }

      return {
        id: s.id,
        applicant_id: s.applicant_id,
        full_name: s.full_name,
        nis: s.nis || "-",
        nisn: s.nisn || "-",
        gender: s.gender,
        program: s.program,
        class_id: s.class_id,
        school_class: s.school_classes || null,
        batch: resolvedBatch,
        registration_no: app.registration_no || "-",
        guardian_name: primaryGuardian?.full_name || "-",
        guardian_phone: primaryGuardian?.phone || "-",
        guardian_email: primaryGuardian?.email || "-",
        enrolled_at: app.submitted_at || s.created_at,
      };
    });
  } catch (err) {
    console.error("Exception in getBatchApprovedStudents:", err);
    return [];
  }
});

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
    const registrationNo = await getNextRegistrationNo(supabase);
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
        status: "PENDING",
        payment_status: "PAID",
        payment_amount: formData.paymentAmount,
        payment_method: formData.paymentMethod,
        payment_note: formData.paymentNote,
        form_submitted: false,
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

    // Kirim email greetings awal pendaftaran lengkap dengan link unik ke orang tua
    const cleanEmail = formData.parentEmail?.trim();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jacosmanagement.vercel.app";
    const uniqueLink = `${baseUrl}/reg/${registrationToken}`;

    if (cleanEmail && isValidEmail(cleanEmail)) {
      try {
        await sendInitialGreetingEmail({
          parentName: formData.parentName,
          parentEmail: cleanEmail,
          studentName: formData.studentName,
          registrationNo,
          program: formData.program,
          uniqueLink,
        });
      } catch (emailErr) {
        console.error("[createNewAdmission] Email error (non-fatal):", emailErr);
      }
    }

    revalidatePath("/management/admisi");
    return { success: true, applicantId: newApplicant.id, registrationToken, uniqueLink };
  } catch (err: any) {
    console.error(err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem." };
  }
}

async function getApplicantWithGuardians(supabase: any, applicantId: string) {
  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", applicantId)
    .single();

  if (error || !applicant) return null;

  const { data: guardians } = await supabase
    .from("guardians")
    .select("*")
    .eq("applicant_id", applicantId);

  return {
    ...applicant,
    guardians: Array.isArray(guardians) ? guardians : guardians ? [guardians] : [],
  };
}

// ============================================================
// APPROVAL — Approve Siswa dengan Assignment BATCH
// ============================================================

export async function approveApplicantWithBatch(
  applicantId: string,
  batchKey?: string
) {
  const supabase = createAdminClient();
  let resendResult: any = null;

  try {
    const selectedBatch = (batchKey as AdmissionBatchKey) || getCurrentActiveBatch();

    // 1. Ambil data applicant beserta data guardians secara reliabel
    const applicant = await getApplicantWithGuardians(supabase, applicantId);

    if (!applicant) {
      return { success: false, message: "Pendaftar tidak ditemukan." };
    }

    // 2. Insert record ke tabel students (class_id: null -> unassigned until batch assignment)
    const studentPayload: any = {
      applicant_id: applicant.id,
      full_name: applicant.student_name,
      nisn: applicant.nisn,
      gender: applicant.gender,
      program: applicant.program,
      birth_place: applicant.birth_place,
      birth_date: applicant.birth_date,
      address: applicant.address,
      class_id: null,
      is_active: true,
    };

    // Sertakan batch jika kolom ada
    try {
      studentPayload.batch = selectedBatch;
    } catch (_) {}

    let student: any = null;
    const { data: insertedStudent, error: studentError } = await supabase
      .from("students")
      .insert(studentPayload)
      .select()
      .single();

    if (studentError) {
      // Fallback jika kolom batch belum ada di students
      if (studentError.message?.includes("batch")) {
        delete studentPayload.batch;
        const { data: fallbackStudent, error: fallbackError } = await supabase
          .from("students")
          .insert(studentPayload)
          .select()
          .single();

        if (fallbackError) {
          console.error("Error inserting student (fallback):", fallbackError);
          return { success: false, message: "Gagal memindahkan data ke tabel Siswa." };
        }
        student = fallbackStudent;
      } else {
        console.error("Error inserting student:", studentError);
        return { success: false, message: "Gagal memindahkan data ke tabel Siswa: " + studentError.message };
      }
    } else {
      student = insertedStudent;
    }

    // 3. Insert ke student_parents
    const guardiansList = applicant.guardians
      ? Array.isArray(applicant.guardians)
        ? applicant.guardians
        : [applicant.guardians]
      : [];

    const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
    const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

    if (guardian && student) {
      await supabase.from("student_parents").insert({
        student_id: student.id,
        father_name: guardian.relation === "FATHER" ? guardian.full_name : null,
        mother_name: guardian.relation === "MOTHER" ? guardian.full_name : null,
        father_occupation: guardian.relation === "FATHER" ? guardian.occupation : null,
        mother_occupation: guardian.relation === "MOTHER" ? guardian.occupation : null,
        phone_number: guardian.phone,
      });

      // 4. Update / Buat Akun Auth Orang Tua
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
            student_name: applicant.student_name,
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
                password: tempPassword,
                user_metadata: {
                  ...(existingUser.user_metadata || {}),
                  full_name: guardian.full_name,
                  role: "PARENT",
                  student_id: student.id,
                  student_name: applicant.student_name,
                  admission_status: "Approved",
                },
              });
              shouldSendEmail = true;
              isExistingUser = false; // Set to false so the password is included in the email
            }
          } else {
            console.error("Error creating auth user:", authError);
          }
        } else {
          shouldSendEmail = true;
        }

        const portalUrl = process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

        // 5. Kirim Email Approval dengan Informasi BATCH
        if (shouldSendEmail) {
          resendResult = await sendApprovalEmail({
            parentName: guardian.full_name,
            parentEmail: targetEmail,
            studentName: applicant.student_name,
            registrationNo: applicant.registration_no,
            tempPassword: isExistingUser ? undefined : tempPassword,
            program: applicant.program,
            batch: selectedBatch,
            portalUrl,
          });
          console.log("[admisi] Approval email sent result:", resendResult);
        }
      }
    }

    // 6. Update applicant status ke ENROLLED + simpan tag batch di payment_note & batch column
    const noteWithBatch = applicant.payment_note
      ? `${applicant.payment_note} [${selectedBatch}]`
      : `[${selectedBatch}]`;

    const applicantUpdatePayload: any = {
      status: "ENROLLED",
      student_record_id: student ? student.id : null,
      payment_note: noteWithBatch,
    };

    try {
      applicantUpdatePayload.batch = selectedBatch;
    } catch (_) {}

    const { error: updateAppErr } = await supabase
      .from("applicants")
      .update(applicantUpdatePayload)
      .eq("id", applicantId);

    if (updateAppErr && updateAppErr.message?.includes("batch")) {
      delete applicantUpdatePayload.batch;
      await supabase
        .from("applicants")
        .update(applicantUpdatePayload)
        .eq("id", applicantId);
    }

    revalidatePath("/management/admisi");
    revalidatePath(`/management/admisi/${applicantId}`);
    revalidatePath("/management/siswa");

    return {
      success: true,
      batch: selectedBatch,
      batchInfo: getBatchInfo(selectedBatch),
      emailSent: resendResult?.success ?? false,
    };
  } catch (err: any) {
    console.error("Exception in approveApplicantWithBatch:", err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem saat approval." };
  }
}

// ============================================================
// ASSIGN — Siswa ke Classroom (pada Batch Listing)
// ============================================================

export async function assignStudentToClass(studentId: string, classId: string | null) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("students")
      .update({ class_id: classId || null })
      .eq("id", studentId);

    if (error) {
      console.error("Error assigning student to class:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/management/admisi");
    revalidatePath("/management/siswa");
    revalidatePath("/management/classroom");

    return { success: true };
  } catch (err: any) {
    console.error("Exception in assignStudentToClass:", err);
    return { success: false, message: err.message || "Gagal meng-assign kelas." };
  }
}

// ============================================================
// REJECT — Update Status + Kirim Email Penolakan
// ============================================================

export async function rejectApplicant(applicantId: string, reason?: string) {
  const supabase = createAdminClient();
  let resendResult: any = null;

  try {
    const applicant = await getApplicantWithGuardians(supabase, applicantId);

    await supabase
      .from("applicants")
      .update({ status: "REJECTED", rejection_reason: reason || null })
      .eq("id", applicantId);

    if (applicant) {
      const guardiansList = applicant.guardians || [];
      const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
      const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

      if (targetEmail && guardian) {
        resendResult = await sendRejectionEmail({
          parentName: guardian.full_name,
          parentEmail: targetEmail,
          studentName: applicant.student_name,
          registrationNo: applicant.registration_no,
          reason: reason || "Belum ada keterangan khusus dari tim admisi.",
        });
      }
    }

    revalidatePath("/management/admisi");
    revalidatePath(`/management/admisi/${applicantId}`);
    return { success: true, emailSent: resendResult?.success ?? false };
  } catch (err: any) {
    console.error("Exception in rejectApplicant:", err);
    return { success: false, message: err.message || "Gagal menolak pendaftaran." };
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
// JACOS AGREEMENT VERIFICATION
// ============================================================

export async function verifyDocumentAgreement(_documentId: string, applicantId: string, status: string, note?: string) {
  const supabase = createAdminClient();
  const dbStatus = status === "APPROVED" ? "VERIFIED" : status;

  const { error } = await supabase
    .from("applicants")
    .update({
      doc_jacos_agreement_status: dbStatus,
      doc_jacos_agreement_note: note || null,
    })
    .eq("id", applicantId);

  if (error) {
    console.error("Error verifying agreement:", error);
    return { success: false, message: error.message };
  }

  if (dbStatus === "VERIFIED") {
    try {
      const applicant = await getApplicantWithGuardians(supabase, applicantId);

      if (applicant) {
        const guardiansList = applicant.guardians || [];
        const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
        const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

        if (targetEmail && guardian) {
          const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = userList?.users?.find(
            (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
          );
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              user_metadata: { ...(existingUser.user_metadata || {}), admission_status: "Approved" },
            });
          }

          await sendAgreementApprovedEmail({
            parentName: guardian.full_name,
            parentEmail: targetEmail,
            studentName: applicant.student_name,
            registrationNo: applicant.registration_no,
            portalUrl: process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id",
          });
        }
      }
    } catch (err) {
      console.error("[admisi] Error sending agreement approved email:", err);
    }
  }

  revalidatePath(`/management/admisi/${applicantId}`);
  revalidatePath("/parent-portal");
  return { success: true };
}

// ============================================================
// PARENT ACCOUNT ACCESS & PASSWORD RESET
// ============================================================

export async function getParentAccountStatus(applicantId: string) {
  const supabase = createAdminClient();

  const applicant = await getApplicantWithGuardians(supabase, applicantId);

  if (!applicant) {
    return { success: false, message: "Data pendaftaran tidak ditemukan" };
  }

  const guardiansList = applicant.guardians || [];

  const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
  const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

  if (!targetEmail) {
    return {
      success: true,
      hasEmail: false,
      email: null,
      guardianName: guardian?.full_name || "-",
      guardianPhone: guardian?.phone || null,
      exists: false,
    };
  }

  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );

  return {
    success: true,
    hasEmail: true,
    email: targetEmail,
    guardianName: guardian?.full_name || "-",
    guardianPhone: guardian?.phone || null,
    exists: !!existingUser,
    lastSignIn: existingUser?.last_sign_in_at || null,
    userId: existingUser?.id || null,
  };
}

export async function resetParentAccountPassword(applicantId: string, customPassword?: string) {
  const supabase = createAdminClient();

  const applicant = await getApplicantWithGuardians(supabase, applicantId);

  if (!applicant) {
    return { success: false, message: "Data pendaftaran tidak ditemukan" };
  }

  const guardiansList = applicant.guardians || [];

  const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
  const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

  if (!targetEmail) {
    return {
      success: false,
      message: "Tidak ditemukan email orang tua/wali pada data pendaftaran ini.",
    };
  }

  const newPassword =
    customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : `Jacos${Math.floor(1000 + Math.random() * 9000)}!`;

  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );

  if (existingUser) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: newPassword,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        full_name: guardian?.full_name || existingUser.user_metadata?.full_name,
        role: "PARENT",
        first_login: false,
        applicant_id: applicantId,
        student_id: applicant.student_record_id || existingUser.user_metadata?.student_id || null,
        student_name: applicant.student_name,
        admission_status: applicant.status === "ENROLLED" ? "Approved" : (existingUser.user_metadata?.admission_status || "Waiting for approval"),
      },
    });

    if (updateErr) {
      return { success: false, message: `Gagal memperbarui password: ${updateErr.message}` };
    }
  } else {
    const { error: createErr } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: newPassword,
      user_metadata: {
        full_name: guardian?.full_name || "Orang Tua Siswa",
        role: "PARENT",
        first_login: false,
        applicant_id: applicantId,
        student_id: applicant.student_record_id || null,
        student_name: applicant.student_name,
        admission_status: applicant.status === "ENROLLED" ? "Approved" : "Waiting for approval",
      },
      email_confirm: true,
    });

    if (createErr) {
      return { success: false, message: `Gagal membuat akun orang tua: ${createErr.message}` };
    }
  }

  revalidatePath(`/management/admisi/${applicantId}`);
  return {
    success: true,
    email: targetEmail,
    newPassword,
    guardianName: guardian?.full_name || "Orang Tua",
    guardianPhone: guardian?.phone || null,
    studentName: applicant.student_name,
  };
}

// ============================================================
// PUBLIC ADMISSION — Ambil Pendaftar Jalur Public
// ============================================================

export const getPublicAdmissionApplicants = cache(async function getPublicAdmissionApplicants() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("applicants")
      .select(`*, guardians (*)`)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .or("status.eq.WAITING_REVIEW,payment_note.ilike.%[PUBLIC_ADMISSION]%")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching public applicants:", error);
      return [];
    }

    return (data || []).map((item: any) => {
      let proofPath = item.doc_payment_proof;
      if (!proofPath && item.payment_note?.includes("Bukti: ")) {
        proofPath = item.payment_note.split("Bukti: ")[1]?.trim();
      }

      return {
        ...item,
        guardians: Array.isArray(item.guardians) ? item.guardians : item.guardians ? [item.guardians] : [],
        has_payment_proof: !!proofPath,
        payment_proof_path: proofPath || null,
        doc_payment_proof_signed: null, // Loaded on-demand when user clicks modal
      };
    });
  } catch (err) {
    console.error("Exception in getPublicAdmissionApplicants:", err);
    return [];
  }
});

export async function getPaymentProofSignedUrl(proofPathOrApplicantId: string): Promise<string | null> {
  const supabase = createAdminClient();
  try {
    let filePath = proofPathOrApplicantId;
    if (!filePath.includes("/")) {
      // It might be an applicantId
      const { data: applicant } = await supabase
        .from("applicants")
        .select("doc_payment_proof, payment_note")
        .eq("id", proofPathOrApplicantId)
        .single();
      if (applicant) {
        filePath = applicant.doc_payment_proof;
        if (!filePath && applicant.payment_note?.includes("Bukti: ")) {
          filePath = applicant.payment_note.split("Bukti: ")[1]?.trim();
        }
      }
    }

    if (!filePath) return null;

    const { data: urlData, error } = await supabase.storage
      .from("admission-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !urlData) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return urlData.signedUrl;
  } catch (err) {
    console.error("Exception in getPaymentProofSignedUrl:", err);
    return null;
  }
}

// ============================================================
// PUBLIC ADMISSION — Approve Bukti Transfer & Kirim Link Unik
// ============================================================

export async function approvePublicPayment(applicantId: string) {
  const supabase = createAdminClient();
  try {
    const applicant = await getApplicantWithGuardians(supabase, applicantId);

    if (!applicant) {
      return { success: false, message: "Pendaftar tidak ditemukan." };
    }

    const registrationToken = applicant.registration_token || generateToken();

    const { error: updateError } = await supabase
      .from("applicants")
      .update({
        payment_status: "PAID",
        status: applicant.form_submitted ? "WAITING_REVIEW" : "PENDING",
        registration_token: registrationToken,
      })
      .eq("id", applicantId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    const guardiansList = applicant.guardians || [];
    const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];
    const targetEmail = guardian?.email;
    const parentName = guardian?.full_name || "Bapak/Ibu";

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jacosmanagement.vercel.app";
    const uniqueLink = `${baseUrl}/reg/${registrationToken}`;

    let emailSent = false;
    if (targetEmail && isValidEmail(targetEmail)) {
      try {
        const res = await sendInitialGreetingEmail({
          parentName,
          parentEmail: targetEmail,
          studentName: applicant.student_name,
          registrationNo: applicant.registration_no,
          program: applicant.program,
          uniqueLink,
        });
        emailSent = res.success ?? false;
      } catch (e) {
        console.error("Error sending initial greeting email on payment approval:", e);
      }
    }

    const rawPhone = (guardian?.phone || "").replace(/[^0-9]/g, "");
    const waPhone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone;
    const waMessage = `Assalamu'alaikum Warahmatullahi Wabarakatuh Bapak/Ibu ${parentName},\n\nPembayaran pendaftaran calon siswa ananda *${applicant.student_name}* di JACOS telah berhasil diverifikasi oleh Tim Admisi.\n\nBerikut tautan formulir pendaftaran eksklusif ananda:\n👉 ${uniqueLink}\n\nSilakan isi formulir dengan lengkap dan lampirkan dokumen pendukung.\n\nSalam hangat,\n*Tim Admisi JACOS*`;

    revalidatePath("/management/admisi");
    revalidatePath(`/management/admisi/${applicantId}`);

    return {
      success: true,
      uniqueLink,
      waPhone,
      waMessage,
      emailSent,
    };
  } catch (err: any) {
    console.error("Exception in approvePublicPayment:", err);
    return { success: false, message: err.message || "Gagal memproses approval pembayaran." };
  }
}

// ============================================================
// PUBLIC ADMISSION — Tolak Pembayaran & Beri Catatan
// ============================================================

export async function rejectPublicPayment(applicantId: string, reason: string) {
  const supabase = createAdminClient();
  try {
    const applicant = await getApplicantWithGuardians(supabase, applicantId);

    if (!applicant) return { success: false, message: "Data tidak ditemukan." };

    await supabase
      .from("applicants")
      .update({
        payment_status: "REJECTED",
        status: "REJECTED",
        rejection_reason: reason,
      })
      .eq("id", applicantId);

    const guardiansList = applicant.guardians || [];
    const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];
    const targetEmail = guardian?.email;

    if (targetEmail && isValidEmail(targetEmail)) {
      try {
        await sendRejectionEmail({
          parentName: guardian?.full_name || "Bapak/Ibu",
          parentEmail: targetEmail,
          studentName: applicant.student_name,
          registrationNo: applicant.registration_no,
          reason,
        });
      } catch (e) {
        console.error("Error sending rejection email:", e);
      }
    }

    revalidatePath("/management/admisi");
    revalidatePath(`/management/admisi/${applicantId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Gagal menolak pembayaran." };
  }
}

// ============================================================
// SOFT DELETE
// ============================================================
export async function softDeleteApplicant(applicantId: string) {
  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from("applicants")
      .update({ is_deleted: true })
      .eq("id", applicantId);

    if (error) throw error;
    revalidatePath("/management/admisi");
    revalidatePath(`/management/admisi/${applicantId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error soft deleting applicant:", err);
    return { success: false, message: err.message || "Gagal menghapus data pendaftar." };
  }
}

// ============================================================
// UPSERT GUARDIANS — Admin can add/update guardian data manually
// ============================================================
export async function upsertGuardians(
  applicantId: string,
  guardians: Array<{
    id?: string;
    relation: string;
    full_name: string;
    nik?: string;
    phone?: string;
    email?: string;
    occupation?: string;
    monthly_income?: string;
    education_level?: string;
    address?: string;
  }>
) {
  const supabase = createAdminClient();
  try {
    // Build base payload without optional columns
    const buildPayload = (g: (typeof guardians)[0]) => ({
      applicant_id: applicantId,
      full_name: g.full_name,
      nik: g.nik || "-",
      relation: g.relation,
      phone: g.phone || "-",
      email: g.email || "-",
      occupation: g.occupation || "-",
      education_level: g.education_level || "S1",
      address: g.address || "-",
      birth_place: "-",
      birth_date: new Date().toISOString(),
    });

    // Delete existing guardians then re-insert
    await supabase.from("guardians").delete().eq("applicant_id", applicantId);

    const payloads = guardians
      .filter((g) => g.full_name?.trim())
      .map((g) => {
        const base = buildPayload(g);
        // Try to include monthly_income — will be stripped on fallback if column missing
        return { ...base, monthly_income: g.monthly_income || null };
      });

    if (payloads.length === 0) {
      return { success: false, message: "Tidak ada data orang tua untuk disimpan." };
    }

    let { error } = await supabase.from("guardians").insert(payloads);

    // Fallback: remove monthly_income if column doesn't exist
    if (error && error.message?.toLowerCase().includes("monthly_income")) {
      const fallback = payloads.map(({ monthly_income, ...rest }: any) => rest);
      const retry = await supabase.from("guardians").insert(fallback);
      error = retry.error;
    }

    if (error) {
      console.error("Error upserting guardians:", error);
      return { success: false, message: error.message };
    }

    revalidatePath(`/management/admisi/${applicantId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in upsertGuardians:", err);
    return { success: false, message: err.message || "Gagal menyimpan data orang tua." };
  }
}
