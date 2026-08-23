import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.error("WARNING: RESEND_API_KEY is not defined in the environment variables!");
}

// ============================================================
// EMAIL — Konfirmasi Form Diterima
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
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for form received:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending form received email to:", cleanEmail);

    const { data, error } = await resend.emails.send({
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
            <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS" style="max-height:40px;margin-bottom:16px;object-fit:contain;" />
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
                <p style="margin:0 0 16px;color:#64748B;font-size:14px;line-height:1.6;">Gunakan kredensial berikut untuk login ke Portal Orang Tua:</p>
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
      console.error("[email] Resend sendFormReceivedEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    console.log("[email] Form received email sent successfully. ID:", data?.id);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendFormReceivedEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL — Approved
// ============================================================

export async function sendApprovalEmail(params: {
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
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid parent email for approval:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending approval email to:", cleanEmail);

    const programLabel: Record<string, string> = {
      PRESCHOOL: "Preschool",
      KINDERGARTEN: "Kindergarten",
      PRIMARY_SCHOOL: "Primary School",
    };

    const { data, error } = await resend.emails.send({
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
        <tr>
          <td style="background:linear-gradient(135deg,#22C55E,#16A34A);padding:36px 40px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;font-size:28px;display:flex;align-items:center;justify-content:center;">🎉</div>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">JACOS ONLINE ADMISSION</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Pendaftaran Diterima!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Kami dengan bangga menyampaikan bahwa pendaftaran ananda <strong style="color:#0F172A;">${params.studentName}</strong> untuk jenjang <strong style="color:#0F172A;">${programLabel[params.program] || params.program}</strong> di JACOS telah <strong style="color:#16A34A;">DITERIMA</strong>. Selamat bergabung! 🌟</p>

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
                    <td style="text-align:right;"><code style="background:#E2E8F0;color:#0F172A;font-weight:700;font-size:14px;padding:4px 10px;border-radius:8px;">${params.tempPassword}</code></td>
                  </tr>
                  ` : `
                  <tr>
                    <td style="color:#64748B;font-size:14px;padding:6px 0;">Password</td>
                    <td style="text-align:right;"><span style="color:#0F172A;font-weight:700;font-size:14px;">Gunakan password Anda saat ini</span></td>
                  </tr>
                  `}
                </table>
                ${params.tempPassword ? `<p style="margin:16px 0 0;color:#15803D;font-size:12px;font-weight:600;">⚠️ Harap segera ganti password setelah login pertama kali.</p>` : `<p style="margin:16px 0 0;color:#15803D;font-size:12px;font-weight:600;">Gunakan email dan password yang telah Anda buat sebelumnya.</p>`}
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${params.portalUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#0EA5E9,#0284C7);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:100px;">Masuk ke Portal Orang Tua →</a>
              </td></tr>
            </table>

            <p style="margin:0;color:#64748B;font-size:13px;line-height:1.7;border-top:1px solid #E2E8F0;padding-top:24px;">Jika ada pertanyaan, hubungi kami di WhatsApp <strong>0821-4000-0477</strong> atau email <strong>admission@jacos.id</strong>.</p>
          </td>
        </tr>
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
      console.error("[email] Resend sendApprovalEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    console.log("[email] Approval email sent successfully. ID:", data?.id);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendApprovalEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL — Rejected
// ============================================================

export async function sendRejectionEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  reason: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for rejection:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending rejection email to:", cleanEmail);

    const { data, error } = await resend.emails.send({
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
        <tr>
          <td style="background:linear-gradient(135deg,#64748B,#475569);padding:36px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">JACOS ONLINE ADMISSION</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Update Status Pendaftaran</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Kami telah meninjau pendaftaran ananda <strong style="color:#0F172A;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${params.registrationNo}</code>) dan saat ini belum dapat kami proses lebih lanjut.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-radius:16px;border:1px solid #FED7AA;margin-bottom:24px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 8px;color:#C2410C;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Keterangan dari Admin</p>
                <p style="margin:0;color:#7C3AED;font-size:15px;font-weight:600;line-height:1.6;">${params.reason}</p>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;color:#64748B;font-size:14px;line-height:1.7;">Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi lebih lanjut, jangan ragu untuk menghubungi tim admission kami.</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="https://wa.me/6282140000477" style="display:inline-block;background:linear-gradient(135deg,#22C55E,#16A34A);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:100px;">Hubungi Admin via WhatsApp →</a>
              </td></tr>
            </table>
          </td>
        </tr>
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
      console.error("[email] Resend sendRejectionEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    console.log("[email] Rejection email sent successfully. ID:", data?.id);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendRejectionEmail:", err);
    return { success: false, error: err };
  }
}
