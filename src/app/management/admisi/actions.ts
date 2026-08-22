"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import crypto from "crypto";
import { isValidEmail, getFirstValidEmail } from "@/lib/utils";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

// ============================================================
// UTILITY
// ============================================================

function generateToken(): string {
  return crypto.randomBytes(6).toString("hex"); // 12-char hex, e.g. "a3f9c2b1d4e8"
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
  let pass = upper[Math.floor(Math.random() * upper.length)]; // pastikan ada uppercase
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
    // Generate registration no
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

    // Map program
    const programMap: Record<string, string> = {
      Preschool: "PRESCHOOL",
      Kindergarten: "KINDERGARTEN",
      Primary: "PRIMARY_SCHOOL",
    };

    // Insert applicant
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

    // Insert guardian
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

  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("id", applicantId)
    .single();

  if (applicantError || !applicant)
    return { success: false, message: "Pendaftar tidak ditemukan." };

  // Insert student
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

  // Insert parent
  let guardian = null;
  const guardiansList = applicant.guardians
    ? (Array.isArray(applicant.guardians) ? applicant.guardians : [applicant.guardians])
    : [];

  const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
  guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

  if (guardian) {
    await supabase.from("student_parents").insert({
      student_id: student.id,
      father_name: guardian.relation === "FATHER" ? guardian.full_name : null,
      mother_name: guardian.relation === "MOTHER" ? guardian.full_name : null,
      father_occupation: guardian.relation === "FATHER" ? guardian.occupation : null,
      mother_occupation: guardian.relation === "MOTHER" ? guardian.occupation : null,
      phone_number: guardian.phone,
    });

    // Create parent portal account + send email
    if (targetEmail) {
      const tempPassword = generateTempPassword();

      // Create Supabase Auth user for the parent
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
        // If user already exists, update their password and metadata
        const isAlreadyExists = authError.message.toLowerCase().includes("already") || 
                                authError.message.toLowerCase().includes("exist") ||
                                authError.code === "email_exists";
                                
        if (isAlreadyExists) {
          const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              user_metadata: { 
                ...(existingUser.user_metadata || {}),
                full_name: guardian.full_name,
                role: "PARENT", 
                student_id: student.id,
                admission_status: "Approved" 
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
        const approveEmailRes = await sendApprovalEmail({
          parentName: guardian.full_name,
          parentEmail: targetEmail,
          studentName: applicant.student_name,
          registrationNo: applicant.registration_no,
          tempPassword: isExistingUser ? undefined : tempPassword,
          program: applicant.program,
          portalUrl,
        });
        console.log("Approval email sending result:", approveEmailRes);
      }
    } else {
      console.warn("No valid email address found to send approval email for applicant:", applicantId);
    }
  }

  // Update applicant status
  await supabase
    .from("applicants")
    .update({ status: "ENROLLED", student_record_id: student.id })
    .eq("id", applicantId);

  revalidatePath("/management/admisi");
  revalidatePath(`/management/admisi/${applicantId}`);
  revalidatePath("/management/siswa");

  return { success: true };
}

// ============================================================
// REJECT — Update Status + Kirim Email
// ============================================================

export async function rejectApplicant(applicantId: string, reason?: string) {
  const supabase = createAdminClient();

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*, guardians(*)")
    .eq("id", applicantId)
    .single();

  await supabase
    .from("applicants")
    .update({ status: "REJECTED", rejection_reason: reason || null })
    .eq("id", applicantId);

  // Kirim email penolakan
  if (applicant) {
    const guardiansList = applicant.guardians
      ? (Array.isArray(applicant.guardians) ? applicant.guardians : [applicant.guardians])
      : [];
    const targetEmail = getFirstValidEmail(...guardiansList.map((g: any) => g?.email));
    const guardian = guardiansList.find((g: any) => isValidEmail(g?.email)) || guardiansList[0];

    if (targetEmail && guardian) {
      await sendRejectionEmail({
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
  return { success: true };
}

// ============================================================
// EMAIL — Konfirmasi Form Diterima (dipanggil dari public form)
// ============================================================

export async function sendFormReceivedEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  program: string;
  portalUrl?: string;
  portalEmail?: string;
  portalPassword?: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!isValidEmail(cleanEmail)) {
      console.warn("Invalid email for form received:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Formulir Pendaftaran Diterima — ${params.studentName}`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0EA5E9,#0284C7);padding:36px 40px;text-align:center;">
            <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS ONLINE ADMISSION" style="max-height: 40px; margin-bottom: 16px; object-fit: contain;" />
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Formulir Pendaftaran Diterima</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Terima kasih telah mengisi formulir pendaftaran untuk ananda <strong style="color:#0F172A;">${params.studentName}</strong>. Formulir Anda telah kami terima dan saat ini sedang dalam proses verifikasi oleh tim admin JACOS.</p>

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border-radius:16px;border:1px solid #BAE6FD;margin-bottom:24px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 12px;color:#0284C7;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Detail Pendaftaran</p>
                <table width="100%">
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">Nama Siswa</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${params.studentName}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">Jenjang</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${params.program}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">Nomor Registrasi</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;font-family:monospace;">${params.registrationNo}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 32px;color:#64748B;font-size:14px;line-height:1.7;">Tim kami akan segera meninjau seluruh data dan dokumen yang telah dikirimkan. Anda akan mendapatkan notifikasi email kembali setelah proses verifikasi selesai.</p>

            ${params.portalUrl && params.portalEmail && params.portalPassword ? `
            <!-- Akun Portal Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:16px;border:1px solid #E2E8F0;margin-bottom:32px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 12px;color:#0F172A;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Akses Portal Orang Tua</p>
                <p style="margin:0 0 16px;color:#64748B;font-size:14px;line-height:1.6;">Gunakan kredensial berikut untuk login ke Portal Orang Tua dan memantau status pendaftaran secara *real-time*:</p>
                <table width="100%">
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">URL Portal</td>
                    <td style="color:#0EA5E9;font-weight:700;font-size:14px;text-align:right;"><a href="${params.portalUrl}" style="color:#0EA5E9;text-decoration:none;">${params.portalUrl}</a></td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">Email</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${params.portalEmail}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:4px 0;">Password Sementara</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;font-family:monospace;">${params.portalPassword}</td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;color:#DC2626;font-size:12px;">* Anda akan diminta untuk mengubah password saat pertama kali login.</p>
              </td></tr>
            </table>
            ` : ''}

            <p style="margin:0;color:#64748B;font-size:14px;">Jika ada pertanyaan, Anda dapat menghubungi kami melalui WhatsApp di <strong>0821-4000-0477</strong> atau email ke <strong>admission@jacos.id</strong>.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0;color:#94A3B8;font-size:12px;">Jakarta Cosmopolite Islamic School</p>
            <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. Semua hak dilindungi.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error("Resend sendFormReceivedEmail error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Error sending form received email:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL — Approved (dipanggil dari approveAndAssignClass)
// ============================================================

async function sendApprovalEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  tempPassword?: string;
  program: string;
  portalUrl: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!isValidEmail(cleanEmail)) {
      console.warn("Invalid parent email address for approval:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    const programLabel: Record<string, string> = {
      PRESCHOOL: "Preschool",
      KINDERGARTEN: "Kindergarten",
      PRIMARY_SCHOOL: "Primary School",
    };

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Selamat! Pendaftaran ${params.studentName} Diterima di JACOS 🎉`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#22C55E,#16A34A);padding:36px 40px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">🎉</div>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">JACOS ONLINE ADMISSION</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Pendaftaran Diterima!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Kami dengan bangga menyampaikan bahwa pendaftaran ananda <strong style="color:#0F172A;">${params.studentName}</strong> untuk jenjang <strong style="color:#0F172A;">${programLabel[params.program] || params.program}</strong> di JACOS telah <strong style="color:#16A34A;">DITERIMA</strong>. Selamat bergabung bersama keluarga besar JACOS! 🌟</p>

            <!-- Login Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;border:1px solid #BBF7D0;margin-bottom:24px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 16px;color:#15803D;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Akses Portal Orang Tua</p>
                <table width="100%">
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:6px 0;">Alamat Portal</td>
                    <td style="text-align:right;"><a href="${params.portalUrl}" style="color:#0284C7;font-weight:700;font-size:14px;">${params.portalUrl.replace('https://', '')}</a></td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:6px 0;">Email Login</td>
                    <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${cleanEmail}</td>
                  </tr>
                  ${params.tempPassword ? `
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:6px 0;">Password Sementara</td>
                    <td style="text-align:right;"><code style="background:#E2E8F0;color:#0F172A;font-weight:700;font-size:14px;padding:4px 10px;border-radius:8px;font-family:monospace;">${params.tempPassword}</code></td>
                  </tr>
                  ` : `
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:6px 0;">Password</td>
                    <td style="text-align:right;"><span style="color:#0F172A;font-weight:700;font-size:14px;">Gunakan password Anda saat ini</span></td>
                  </tr>
                  `}
                </table>
                ${params.tempPassword ? `
                <p style="margin:16px 0 0;color:#15803D;font-size:12px;font-weight:600;">⚠️ Harap segera ganti password setelah login pertama kali. Password harus minimal 6 karakter dan mengandung huruf kapital.</p>
                ` : `
                <p style="margin:16px 0 0;color:#15803D;font-size:12px;font-weight:600;">Gunakan email dan password yang telah Anda buat sebelumnya untuk login ke portal.</p>
                `}
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${params.portalUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#0EA5E9,#0284C7);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 12px rgba(14,165,233,0.4);">Masuk ke Portal Orang Tua →</a>
              </td></tr>
            </table>

            <p style="margin:0;color:#64748B;font-size:13px;line-height:1.7;border-top:1px solid #E2E8F0;padding-top:24px;">Jika ada pertanyaan, hubungi kami di WhatsApp <strong>0821-4000-0477</strong> atau email <strong>admission@jacos.id</strong>.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0;color:#94A3B8;font-size:12px;">Jakarta Cosmopolite Islamic School</p>
            <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. Semua hak dilindungi.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error("Resend sendApprovalEmail error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Error sending approval email:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL — Rejected (dipanggil dari rejectApplicant)
// ============================================================

async function sendRejectionEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  reason: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!isValidEmail(cleanEmail)) {
      console.warn("Invalid email for rejection:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Update Pendaftaran ${params.studentName} di JACOS`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#64748B,#475569);padding:36px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">JACOS ONLINE ADMISSION</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Update Status Pendaftaran</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Kami telah meninjau pendaftaran ananda <strong style="color:#0F172A;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${params.registrationNo}</code>) dan saat ini belum dapat kami proses lebih lanjut.</p>

            <!-- Reason Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-radius:16px;border:1px solid #FED7AA;margin-bottom:24px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 8px;color:#C2410C;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Keterangan dari Admin</p>
                <p style="margin:0;color:#7C3AED;font-size:15px;font-weight:600;line-height:1.6;">${params.reason}</p>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;color:#64748B;font-size:14px;line-height:1.7;">Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi lebih lanjut, jangan ragu untuk menghubungi tim admission kami. Kami siap membantu.</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="https://wa.me/6282140000477?text=Halo%2C%20saya%20ingin%20menanyakan%20tentang%20pendaftaran%20ananda%20${encodeURIComponent(params.studentName)}%20(${params.registrationNo})" style="display:inline-block;background:linear-gradient(135deg,#22C55E,#16A34A);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 12px rgba(34,197,94,0.4);">Hubungi Admin via WhatsApp →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0;color:#94A3B8;font-size:12px;">Jakarta Cosmopolite Islamic School</p>
            <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. Semua hak dilindungi.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error("Resend sendRejectionEmail error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Error sending rejection email:", err);
    return { success: false, error: err };
  }
}
