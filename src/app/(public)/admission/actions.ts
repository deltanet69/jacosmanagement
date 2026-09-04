"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { isValidEmail } from "@/lib/utils";
import { sendPublicAdmissionReceivedEmail } from "@/lib/email";

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

export async function submitPublicAdmission(formData: FormData) {
  const supabase = createAdminClient();

  try {
    const studentName = (formData.get("studentName") as string)?.trim();
    const programRaw = (formData.get("program") as string)?.trim();
    const genderRaw = (formData.get("gender") as string)?.trim();
    const parentRelationRaw = (formData.get("parentRelation") as string)?.trim();
    const parentName = (formData.get("parentName") as string)?.trim();
    const parentPhone = (formData.get("parentPhone") as string)?.trim();
    const parentEmail = (formData.get("parentEmail") as string)?.trim();
    const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || "Transfer Bank BNI";
    const paymentProof = formData.get("paymentProof") as File | null;

    // Validasi
    if (!studentName || !parentName || !parentPhone || !parentEmail) {
      return { success: false, message: "Harap lengkapi semua kolom data siswa dan orang tua." };
    }

    const digitRegex = /^\d+$/;
    if (parentPhone.length < 9 || !digitRegex.test(parentPhone)) {
      return { success: false, message: "Nomor WhatsApp harus berupa angka minimal 9 digit." };
    }

    if (!isValidEmail(parentEmail)) {
      return { success: false, message: "Format email orang tua tidak valid." };
    }

    if (!paymentProof || paymentProof.size === 0) {
      return { success: false, message: "Wajib melampirkan berkas bukti transfer pendaftaran." };
    }

    // Program map
    const programMap: Record<string, string> = {
      Preschool: "PRESCHOOL",
      Kindergarten: "KINDERGARTEN",
      Primary: "PRIMARY_SCHOOL",
      PRESCHOOL: "PRESCHOOL",
      KINDERGARTEN: "KINDERGARTEN",
      PRIMARY_SCHOOL: "PRIMARY_SCHOOL",
    };
    const program = programMap[programRaw] || "PRIMARY_SCHOOL";

    const gender = genderRaw === "Perempuan" || genderRaw === "FEMALE" ? "FEMALE" : "MALE";
    const parentRelation = parentRelationRaw === "Ibu" || parentRelationRaw === "MOTHER" ? "MOTHER" : "FATHER";

    // 1. Generate Reg No & Token
    const registrationNo = await getNextRegistrationNo(supabase);
    const registrationToken = generateToken();

    // 2. Upload Bukti Transfer ke Storage
    const safeFileName = paymentProof.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `payment-proofs/${registrationNo}_${Date.now()}_${safeFileName}`;
    const fileBuffer = await paymentProof.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("admission-documents")
      .upload(filePath, fileBuffer, {
        contentType: paymentProof.type || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[submitPublicAdmission] Error uploading proof:", uploadErr);
      return { success: false, message: "Gagal mengunggah bukti pembayaran. Silakan coba lagi." };
    }

    // 3. Insert Applicant
    const insertPayload: Record<string, any> = {
      registration_no: registrationNo,
      registration_token: registrationToken,
      student_name: studentName,
      gender,
      program,
      birth_place: "-",
      birth_date: new Date().toISOString(),
      religion: "-",
      nationality: "WNI",
      address: "-",
      primary_language: "-",
      blood_type: "-",
      category: "NEW_STUDENT",
      status: "WAITING_REVIEW",
      payment_status: "PENDING_VERIFICATION",
      payment_amount: 1000000,
      payment_method: paymentMethod,
      payment_note: `[PUBLIC_ADMISSION] Bukti: ${filePath}`,
      doc_payment_proof: filePath,
      form_submitted: false,
      submitted_at: new Date().toISOString(),
    };

    let { data: newApplicant, error: insertError } = await supabase
      .from("applicants")
      .insert(insertPayload)
      .select()
      .single();

    // Fallback jika kolom doc_payment_proof belum ada di tabel applicants
    if (insertError && (insertError.message?.toLowerCase().includes("doc_payment_proof") || insertError.code === "PGRST204")) {
      delete insertPayload.doc_payment_proof;
      const retry = await supabase.from("applicants").insert(insertPayload).select().single();
      newApplicant = retry.data;
      insertError = retry.error;
    }

    if (insertError || !newApplicant) {
      console.error("[submitPublicAdmission] Error creating applicant:", insertError);
      return { success: false, message: insertError?.message || "Gagal memproses pendaftaran." };
    }

    // 4. Insert Guardian
    const { error: guardianError } = await supabase.from("guardians").insert({
      applicant_id: newApplicant.id,
      full_name: parentName,
      nik: "-",
      relation: parentRelation,
      phone: parentPhone,
      email: parentEmail,
      occupation: "-",
      birth_place: "-",
      birth_date: new Date().toISOString(),
      education_level: "S1",
      address: "-",
    });

    if (guardianError) {
      console.error("[submitPublicAdmission] Error creating guardian:", guardianError);
    }

    // 5. Kirim email respon bahwa pendaftaran diterima dan menunggu verifikasi pembayaran
    try {
      await sendPublicAdmissionReceivedEmail({
        parentName,
        parentEmail,
        studentName,
        registrationNo,
        program,
      });
    } catch (emailErr) {
      console.error("[submitPublicAdmission] Email notification error (non-fatal):", emailErr);
    }

    revalidatePath("/management/admisi");

    return {
      success: true,
      registrationNo,
      studentName,
      parentName,
      emailSent: true,
    };
  } catch (err: any) {
    console.error("[submitPublicAdmission] Exception:", err);
    return { success: false, message: err.message || "Terjadi kesalahan sistem." };
  }
}
