import { Resend } from "resend";
import { getBatchInfo, formatBatchLabel } from "@/lib/admission-config";

// Lazy initialization — prevents 'Missing API key' error during module load
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is missing! Email will not be sent.");
  }
  return new Resend(process.env.RESEND_API_KEY!);
}

// ============================================================
// EMAIL 1 — Formulir Pendaftaran Diterima & Akses Portal Orang Tua
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

    const programLabelMap: Record<string, string> = {
      PRESCHOOL: "Preschool (PG / TK A)",
      KINDERGARTEN: "Kindergarten (TK B)",
      PRIMARY_SCHOOL: "Primary School (SD)",
      Preschool: "Preschool (PG / TK A)",
      Kindergarten: "Kindergarten (TK B)",
      Primary: "Primary School (SD)",
    };
    const programName = programLabelMap[params.program] || params.program;

    const portalUrl = params.portalUrl || process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Formulir Pendaftaran Diterima — ${params.studentName} (${params.registrationNo})`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Formulir Pendaftaran Diterima - JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0EA5E9 100%);padding:36px 32px;text-align:center;">
              <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS Logo" style="height:36px;margin-bottom:14px;object-fit:contain;" />
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Online Admission</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Formulir Pendaftaran Diterima</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih telah melengkapi dan mengirimkan formulir pendaftaran calon peserta didik di <strong>Jakarta Cosmopolite Islamic School (JACOS)</strong>. Berkas pendaftaran ananda telah berhasil kami terima dalam sistem.
              </p>

              <!-- Card Detail Pendaftaran -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:18px;border:1px solid #E2E8F0;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 14px;color:#0284C7;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Ringkasan Pendaftaran</p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Nama Calon Siswa</td>
                        <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${params.studentName}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Jenjang Pendidikan</td>
                        <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${programName}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Nomor Registrasi</td>
                        <td style="color:#0284C7;font-weight:800;font-size:14px;text-align:right;font-family:monospace;">${params.registrationNo}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Status Saat Ini</td>
                        <td style="color:#D97706;font-weight:700;font-size:14px;text-align:right;">⏳ Dalam Proses Verifikasi</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${params.portalPassword ? `
              <!-- Card Akses Portal Orang Tua -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:18px;border:1px solid #BAE6FD;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 10px;color:#0369A1;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">🔑 Akses Portal Orang Tua (Parent Portal)</p>
                    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
                      Anda dapat memantau status verifikasi dan perkembangan pendaftaran melalui Portal Orang Tua dengan informasi login di bawah ini:
                    </p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#64748B;font-size:13px;">URL Portal</td>
                        <td style="text-align:right;"><a href="${portalUrl}" style="color:#0284C7;font-weight:700;font-size:13px;text-decoration:none;">${portalUrl.replace("https://", "")}</a></td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Email Login</td>
                        <td style="color:#0F172A;font-weight:700;font-size:13px;text-align:right;">${params.portalEmail || cleanEmail}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Password Sementara</td>
                        <td style="text-align:right;"><code style="background:#E0F2FE;color:#0369A1;font-weight:800;font-size:14px;padding:3px 10px;border-radius:8px;font-family:monospace;">${params.portalPassword}</code></td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;color:#0369A1;font-size:12px;line-height:1.5;">
                      * Demi keamanan akun, Anda disarankan mengubah password setelah login pertama kali.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Langkah Selanjutnya -->
              <p style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700;">Langkah Selanjutnya:</p>
              <ol style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
                <li>Tim Admisi JACOS akan meninjau data isian dan dokumen yang telah diunggah.</li>
                <li>Setelah proses verifikasi selesai, Anda akan menerima email notifikasi hasil seleksi pendaftaran.</li>
                <li>Jika ada berkas yang perlu diklarifikasi, tim kami akan segera menghubungi Anda.</li>
              </ol>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${portalUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#0284C7,#0369A1);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 34px;border-radius:100px;box-shadow:0 4px 14px rgba(2,132,199,0.3);">Masuk ke Portal Orang Tua →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika memerlukan bantuan atau memiliki pertanyaan, silakan hubungi tim Admisi JACOS melalui WhatsApp di <strong>0821-4000-0477</strong> atau email ke <strong>admission@jacos.id</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[email] Resend sendFormReceivedEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendFormReceivedEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL 2 — Pendaftaran Diterima (Approval & Batch Assignment)
// ============================================================

export async function sendApprovalEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  tempPassword?: string;
  program: string;
  batch?: string;
  portalUrl?: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid parent email for approval:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending approval email to:", cleanEmail);

    const programLabelMap: Record<string, string> = {
      PRESCHOOL: "Preschool (PG / TK A)",
      KINDERGARTEN: "Kindergarten (TK B)",
      PRIMARY_SCHOOL: "Primary School (SD)",
      Preschool: "Preschool (PG / TK A)",
      Kindergarten: "Kindergarten (TK B)",
      Primary: "Primary School (SD)",
    };
    const programName = programLabelMap[params.program] || params.program;

    const batchInfo = getBatchInfo(params.batch);
    const batchFormatted = `${batchInfo.label} (${batchInfo.periodLabel})`;

    const portalUrl = params.portalUrl || process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Selamat! Pendaftaran ${params.studentName} Diterima di JACOS (${batchInfo.label}) 🎉`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pendaftaran Diterima - JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner (Green Celebration) -->
          <tr>
            <td style="background:linear-gradient(135deg,#16A34A 0%,#22C55E 100%);padding:38px 32px;text-align:center;">
              <div style="font-size:36px;line-height:1;margin-bottom:12px;">🎉</div>
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Jakarta Cosmopolite Islamic School</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.25;">Pendaftaran Diterima!</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">
                Dengan penuh rasa syukur dan gembira, kami menginformasikan bahwa pendaftaran ananda <strong style="color:#16A34A;">${params.studentName}</strong> telah dinyatakan <strong>LOLOS VERIFIKASI &amp; DITERIMA</strong> sebagai calon peserta didik baru di <strong>JACOS</strong>.
              </p>

              <!-- Info Kelulusan & Batch Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0FDF4;border-radius:18px;border:1px solid #BBF7D0;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 14px;color:#15803D;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">✓ Detail Penerimaan Siswa</p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Nama Siswa</td>
                        <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${params.studentName}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Jenjang Pendidikan</td>
                        <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;">${programName}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Nomor Registrasi</td>
                        <td style="color:#0F172A;font-weight:700;font-size:14px;text-align:right;font-family:monospace;">${params.registrationNo}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:14px;">Gelombang Penerimaan</td>
                        <td style="color:#16A34A;font-weight:800;font-size:14px;text-align:right;">${batchFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Penempatan Kelas -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:16px;border:1px solid #E2E8F0;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0 0 6px;color:#0F172A;font-size:13px;font-weight:700;">🏫 Informasi Penempatan Kelas</p>
                    <p style="margin:0;color:#64748B;font-size:13px;line-height:1.6;">
                      Ananda telah resmi tercatat di <strong>${batchInfo.label}</strong>. Penempatan kelas resmi (misal Kelas 1A/1B/1C) serta jadwal kegiatan awal tahun ajaran akan diumumkan oleh tim akademik sebelum tahun ajaran baru dimulai.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Akses Portal Orang Tua -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:18px;border:1px solid #BAE6FD;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 10px;color:#0369A1;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📱 Akses Portal Orang Tua (Aktif)</p>
                    <p style="margin:0 0 14px;color:#475569;font-size:14px;line-height:1.6;">
                      Akun Portal Orang Tua Anda kini telah aktif. Anda dapat masuk menggunakan kredensial berikut:
                    </p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Alamat Portal</td>
                        <td style="text-align:right;"><a href="${portalUrl}" style="color:#0284C7;font-weight:700;font-size:13px;text-decoration:none;">${portalUrl.replace("https://", "")}</a></td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Email Login</td>
                        <td style="color:#0F172A;font-weight:700;font-size:13px;text-align:right;">${cleanEmail}</td>
                      </tr>
                      ${params.tempPassword ? `
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Password Sementara</td>
                        <td style="text-align:right;"><code style="background:#E0F2FE;color:#0369A1;font-weight:800;font-size:14px;padding:3px 10px;border-radius:8px;font-family:monospace;">${params.tempPassword}</code></td>
                      </tr>
                      ` : `
                      <tr>
                        <td style="color:#64748B;font-size:13px;">Password</td>
                        <td style="color:#0F172A;font-weight:700;font-size:13px;text-align:right;">Gunakan password yang telah dibuat sebelumnya</td>
                      </tr>
                      `}
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${portalUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#16A34A,#15803D);color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;padding:16px 40px;border-radius:100px;box-shadow:0 4px 16px rgba(22,163,74,0.3);">Masuk ke Portal Orang Tua →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Selamat bergabung dengan keluarga besar JACOS. Jika ada pertanyaan, hubungi kami di WhatsApp <strong>0821-4000-0477</strong> atau email <strong>admission@jacos.id</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[email] Resend sendApprovalEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendApprovalEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL 3 — Penolakan / Update Status Pendaftaran
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

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Update Status Pendaftaran Calon Siswa — ${params.studentName} (${params.registrationNo})`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Update Status Pendaftaran - JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner (Subtle Slate/Charcoal) -->
          <tr>
            <td style="background:linear-gradient(135deg,#475569 0%,#334155 100%);padding:36px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Jakarta Cosmopolite Islamic School</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Update Status Pendaftaran</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih atas minat dan kepercayaan Anda mendaftarkan ananda <strong style="color:#0F172A;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${params.registrationNo}</code>) di JACOS.
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Setelah melalui proses peninjauan berkas dan kriteria seleksi admisi, kami menyampaikan bahwa untuk saat ini pendaftaran ananda <strong>belum dapat kami terima</strong>.
              </p>

              <!-- Box Alasan Penolakan -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7ED;border-radius:18px;border:1px solid #FED7AA;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 8px;color:#C2410C;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Catatan / Keterangan dari Tim Admisi</p>
                    <p style="margin:0;color:#9A3412;font-size:14px;font-weight:600;line-height:1.7;">
                      ${params.reason || "Mohon maaf, kuota penerimaan pada jenjang/gelombang yang dipilih saat ini telah terpenuhi atau berkas belum memenuhi kriteria."}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Panduan Selanjutnya -->
              <p style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700;">Apa yang dapat Anda lakukan selanjutnya?</p>
              <ul style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
                <li>Jika penolakan terkait kelengkapan berkas, Anda dapat melengkapi dan mengunggah ulang dokumen yang diminta.</li>
                <li>Anda dapat berkonsultasi langsung dengan Tim Admisi JACOS melalui layanan WhatsApp resmi kami.</li>
              </ul>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="https://wa.me/6282140000477" style="display:inline-block;background:linear-gradient(135deg,#22C55E,#16A34A);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 34px;border-radius:100px;box-shadow:0 4px 14px rgba(22,163,74,0.3);">Hubungi Tim Admisi via WhatsApp →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Kami sangat mengapresiasi waktu dan usaha yang telah Anda berikan dalam proses pendaftaran ini.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[email] Resend sendRejectionEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendRejectionEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL 4 — Document Agreement Approved
// ============================================================

export async function sendAgreementApprovedEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  portalUrl?: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for agreement approval:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending agreement approved email to:", cleanEmail);

    const portalUrl = params.portalUrl || process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Dokumen Agreement Disetujui — ${params.studentName} (Fitur Portal Aktif)`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Dokumen Agreement Disetujui - JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0D9488 100%);padding:36px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Jakarta Cosmopolite Islamic School</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Dokumen Agreement Disetujui 🎉</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
                Alhamdulillah, dokumen persetujuan orang tua (<strong>JACOS Agreement</strong>) untuk ananda <strong style="color:#0284C7;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${params.registrationNo}</code>) telah berhasil diperiksa dan <strong>disetujui oleh Tim Admisi JACOS</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0FDF4;border-radius:16px;border:1px solid #BBF7D0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;color:#15803D;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">✓ Status Dokumen</p>
                    <p style="margin:0;color:#166534;font-size:15px;font-weight:700;">JACOS Agreement: Terverifikasi (Verified)</p>
                    <p style="margin:6px 0 0;color:#15803D;font-size:13px;line-height:1.5;">Seluruh akses fitur di Portal Orang Tua Anda kini telah aktif sepenuhnya.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#0284C7,#0369A1);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 14px rgba(2,132,199,0.3);">Masuk ke Portal Orang Tua →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika memerlukan bantuan lebih lanjut, silakan hubungi tim admission JACOS.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} JACOS. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[email] Resend sendAgreementApprovedEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendAgreementApprovedEmail:", err);
    return { success: false, error: err };
  }
}
