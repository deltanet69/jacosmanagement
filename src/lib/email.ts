import { Resend } from "resend";
import { getBatchInfo, formatBatchLabel } from "@/lib/admission-config";

// Lazy initialization — prevents 'Missing API key' error during module load
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is missing! Email will not be sent.");
  }
  return new Resend(process.env.RESEND_API_KEY!);
}

const PROGRAM_LABEL_MAP: Record<string, string> = {
  PRESCHOOL: "Preschool (PG / TK A)",
  KINDERGARTEN: "Kindergarten (TK B)",
  PRIMARY_SCHOOL: "Primary School (SD)",
  Preschool: "Preschool (PG / TK A)",
  Kindergarten: "Kindergarten (TK B)",
  Primary: "Primary School (SD)",
};

function formatProgram(prog: string): string {
  return PROGRAM_LABEL_MAP[prog] || prog || "Primary School";
}

// ============================================================
// EMAIL 1 — Greetings Awal Pendaftaran & Tautan Formulir Unik
// Digunakan untuk:
// - Direct Admin setelah slot dibuat & pembayaran diterima
// - Public Online Admission setelah bukti transfer di-approve admin
// ============================================================

export async function sendInitialGreetingEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  program: string;
  uniqueLink: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for initial greeting:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending initial greeting email to:", cleanEmail);

    const programName = formatProgram(params.program);

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Formulir Pendaftaran Calon Siswa — ${params.studentName} (${params.registrationNo})`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Formulir Pendaftaran JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);padding:36px 32px;text-align:center;">
              <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS Logo" style="height:36px;margin-bottom:14px;object-fit:contain;" />
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Online Admission</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Selamat Datang di JACOS</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih atas kepercayaan Anda mendaftarkan ananda di <strong>Jakarta Cosmopolite Islamic School (JACOS)</strong>. Pembayaran biaya pendaftaran pendaftaran ananda telah berhasil tercatat.
              </p>

              <!-- Card Detail Pendaftaran -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:18px;border:1px solid #E2E8F0;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 14px;color:#0284C7;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Data Registrasi Siswa</p>
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
                        <td style="color:#64748B;font-size:14px;">Status Pembayaran</td>
                        <td style="color:#16A34A;font-weight:700;font-size:14px;text-align:right;">Lunas (Rp 1.000.000)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Card Link Unik Formulir -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:18px;border:1px solid #BAE6FD;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 10px;color:#0369A1;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Tautan Formulir Pendaftaran Eksklusif</p>
                    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
                      Silakan buka tautan formulir pendaftaran khusus ananda di bawah ini untuk melengkapi biodata siswa, data orang tua, riwayat medis, serta mengunggah dokumen persyaratan:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td align="center">
                          <a href="${params.uniqueLink}" style="display:inline-block;background:linear-gradient(135deg,#0284C7,#0369A1);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 34px;border-radius:100px;box-shadow:0 4px 14px rgba(2,132,199,0.3);">Isi Formulir Pendaftaran Sekarang &rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0;color:#64748B;font-size:12px;line-height:1.5;word-break:break-all;text-align:center;">
                      Atau salin tautan ini di browser: <br/>
                      <a href="${params.uniqueLink}" style="color:#0284C7;font-weight:600;text-decoration:none;">${params.uniqueLink}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Langkah Selanjutnya -->
              <p style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700;">Panduan Pengisian:</p>
              <ol style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
                <li>Buka tautan formulir di atas melalui ponsel atau laptop Anda.</li>
                <li>Lengkapi seluruh kolom isian dan unggah dokumen pendukung (Akta Kelahiran, Kartu Keluarga, KTP Orang Tua, Pas Foto 3x4).</li>
                <li>Setelah formulir dikirim, Tim Admisi JACOS akan melakukan verifikasi berkas dan mengumumkan hasil seleksi pendaftaran.</li>
              </ol>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika memerlukan bantuan atau pertanyaan seputar pengisian formulir, silakan hubungi tim Admisi JACOS melalui WhatsApp di <strong>0821-4000-0477</strong> atau email ke <strong>admission@jacos.id</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
      console.error("[email] Resend sendInitialGreetingEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendInitialGreetingEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL 2 — Notifikasi Pendaftaran Public Online Admission Diterima
// (Menunggu Verifikasi Bukti Transfer oleh Admin)
// ============================================================

export async function sendPublicAdmissionReceivedEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  program: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for public admission received:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending public admission received email to:", cleanEmail);

    const programName = formatProgram(params.program);

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Pendaftaran Online Diterima — Menunggu Verifikasi Pembayaran (${params.studentName})`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pendaftaran Online Diterima - JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FA;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);padding:36px 32px;text-align:center;">
              <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS Logo" style="height:36px;margin-bottom:14px;object-fit:contain;" />
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Public Online Admission</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Pendaftaran Berhasil Dikirim</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih telah melakukan pendaftaran online calon siswa baru di <strong>Jakarta Cosmopolite Islamic School (JACOS)</strong>. Berkas bukti transfer pembayaran biaya pendaftaran ananda telah berhasil kami terima.
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
                        <td style="color:#64748B;font-size:14px;">Status Pembayaran</td>
                        <td style="color:#D97706;font-weight:700;font-size:14px;text-align:right;">Menunggu Verifikasi Admin</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Proses Verifikasi -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:18px;border:1px solid #FDE68A;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;color:#B45309;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Proses Selanjutnya</p>
                    <p style="margin:0;color:#92400E;font-size:14px;line-height:1.6;">
                      Tim Admisi JACOS sedang memverifikasi bukti transfer pembayaran Anda. Setelah diverifikasi dan disetujui, sistem kami akan secara otomatis mengirimkan <strong>email konfirmasi lanjutan yang memuat Tautan (Link) Formulir Pendaftaran Lengkap</strong> ke alamat email ini dan WhatsApp Anda.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika Anda memerlukan bantuan mendesak, silakan hubungi tim Admisi JACOS via WhatsApp di <strong>0821-4000-0477</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
      console.error("[email] Resend sendPublicAdmissionReceivedEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendPublicAdmissionReceivedEmail:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// EMAIL 3 — Formulir Lengkap Disubmit Orang Tua
// (Menunggu Review & Approval Admin, TANPA PASSWORD DULU)
// ============================================================

export async function sendFormWaitingApprovalEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  program: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for form waiting approval:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending form waiting approval email to:", cleanEmail);

    const programName = formatProgram(params.program);

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
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);padding:36px 32px;text-align:center;">
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
                Terima kasih telah melengkapi dan mengirimkan formulir pendaftaran calon peserta didik di <strong>Jakarta Cosmopolite Islamic School (JACOS)</strong>. Berkas formulir dan dokumen persyaratan ananda telah berhasil kami terima dalam sistem.
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
                        <td style="color:#D97706;font-weight:700;font-size:14px;text-align:right;">Dalam Proses Peninjauan &amp; Approval Admin</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Langkah Selanjutnya -->
              <p style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700;">Langkah Selanjutnya:</p>
              <ol style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
                <li>Tim Admisi JACOS akan meneliti data isian biodata serta keabsahan dokumen persyaratan yang telah diunggah.</li>
                <li>Setelah pendaftaran disetujui (Approved), Anda akan menerima email notifikasi kelulusan seleksi yang memuat <strong>Kredensial Login Akun Parent Portal</strong>.</li>
                <li>Jika ada berkas yang memerlukan konfirmasi lebih lanjut, tim kami akan segera menghubungi Anda.</li>
              </ol>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika memerlukan bantuan atau pertanyaan seputar proses seleksi, hubungi tim Admisi JACOS melalui WhatsApp di <strong>0821-4000-0477</strong> atau email ke <strong>admission@jacos.id</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
      console.error("[email] Resend sendFormWaitingApprovalEmail error:", JSON.stringify(error));
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception in sendFormWaitingApprovalEmail:", err);
    return { success: false, error: err };
  }
}

// Backwards compatibility alias
export const sendFormReceivedEmail = sendFormWaitingApprovalEmail;

// ============================================================
// EMAIL 4 — Pendaftaran Disetujui (Approval, Batch Assignment,
// Kredensial Login Parent Portal & Wajib Declaration Letter)
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

    const programName = formatProgram(params.program);
    const batchInfo = getBatchInfo(params.batch);
    const batchFormatted = `${batchInfo.label} (${batchInfo.periodLabel})`;

    const portalUrl = params.portalUrl || process.env.NEXT_PUBLIC_PARENT_URL || "https://parent.jacos.id";

    const { data, error } = await getResend().emails.send({
      from: "JACOS Admission <admission@jacos.id>",
      to: cleanEmail,
      subject: `Selamat! Pendaftaran ${params.studentName} Diterima di JACOS (${batchInfo.label})`,
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
            <td style="background:linear-gradient(135deg,#16A34A 0%,#15803D 100%);padding:38px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Jakarta Cosmopolite Islamic School</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.25;">Pendaftaran Disetujui!</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">
                Dengan rasa syukur dan gembira, kami menginformasikan bahwa pendaftaran ananda <strong style="color:#16A34A;">${params.studentName}</strong> telah dinyatakan <strong>LOLOS VERIFIKASI &amp; RESMI DITERIMA</strong> sebagai calon peserta didik baru di <strong>JACOS</strong>.
              </p>

              <!-- Info Kelulusan & Batch Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0FDF4;border-radius:18px;border:1px solid #BBF7D0;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 14px;color:#15803D;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Detail Penerimaan Siswa</p>
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

              <!-- Akses Portal Orang Tua -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:18px;border:1px solid #BAE6FD;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 10px;color:#0369A1;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Akses Akun Parent Portal</p>
                    <p style="margin:0 0 14px;color:#475569;font-size:14px;line-height:1.6;">
                      Akun Portal Orang Tua Anda kini telah aktif. Silakan login menggunakan kredensial berikut:
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
                        <td style="color:#0F172A;font-weight:700;font-size:13px;text-align:right;">Gunakan password akun yang sudah terdaftar</td>
                      </tr>
                      `}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PENTING: Langkah Wajib Pengisian Declaration Letter -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:18px;border:1px solid #FDE68A;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 8px;color:#B45309;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Langkah Wajib: Pengisian Declaration Letter</p>
                    <p style="margin:0 0 12px;color:#92400E;font-size:14px;line-height:1.6;">
                      Setelah berhasil login ke Parent Portal, Anda diwajibkan menyelesaikan tahapan persetujuan:
                    </p>
                    <ol style="margin:0;padding-left:20px;color:#92400E;font-size:13px;line-height:1.6;">
                      <li>Unduh formulir <strong>Surat Pernyataan Orang Tua (Declaration Letter)</strong> di dashboard.</li>
                      <li>Cetak dan bubuhkan <strong>tanda tangan basah di atas Materai Rp 10.000</strong>.</li>
                      <li>Unggah kembali berkas dokumen tersebut melalui Parent Portal.</li>
                      <li>Seluruh fitur portal (penjemputan QR, presensi, dll.) akan langsung terbuka penuh setelah dokumen diverifikasi oleh admin.</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${portalUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#16A34A,#15803D);color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;padding:16px 40px;border-radius:100px;box-shadow:0 4px 16px rgba(22,163,74,0.3);">Masuk ke Portal Orang Tua &rarr;</a>
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
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
// EMAIL 5 — Penolakan / Update Status Pendaftaran
// ============================================================

export async function sendRejectionEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  registrationNo: string;
  reason: string;
  uniqueLink?: string;
  registrationToken?: string;
}) {
  try {
    const cleanEmail = params.parentEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      console.warn("[email] Invalid email for rejection:", params.parentEmail);
      return { success: false, message: "Invalid email" };
    }

    console.log("[email] Sending rejection email to:", cleanEmail);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admission.jacos.id";
    const editLink = params.uniqueLink || (params.registrationToken ? `${baseUrl}/reg/${params.registrationToken}` : "");

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
          
          <!-- Header Banner (Warm Crimson / Charcoal) -->
          <tr>
            <td style="background:linear-gradient(135deg,#334155 0%,#1E293B 100%);padding:36px 32px;text-align:center;">
              <img src="https://jacosmanagement.vercel.app/publicjacos/logoputih.png" alt="JACOS Logo" style="height:36px;margin-bottom:14px;object-fit:contain;" />
              <p style="margin:0;color:#FCE9BE;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Jakarta Cosmopolite Islamic School</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Update Status Pendaftaran</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Perlu Penyesuaian / Perbaikan Data Pendaftaran</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih atas minat dan kepercayaan Anda mendaftarkan ananda <strong style="color:#0F172A;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;color:#0284C7;font-weight:700;">${params.registrationNo}</code>) di JACOS.
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Setelah melalui proses peninjauan berkas oleh Tim Admisi, terdapat beberapa informasi atau dokumen pendaftaran yang <strong>perlu diperbaiki/dilengkapi kembali</strong> sebelum pendaftaran dapat kami setujui.
              </p>

              <!-- Box Catatan / Alasan Penolakan -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7ED;border-radius:18px;border:1px solid #FED7AA;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 8px;color:#C2410C;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📌 Catatan Perbaikan dari Tim Admisi</p>
                    <p style="margin:0;color:#9A3412;font-size:14px;font-weight:600;line-height:1.7;">
                      ${params.reason || "Mohon periksa kembali kelengkapan dokumen atau data pendaftaran yang belum sesuai."}
                    </p>
                  </td>
                </tr>
              </table>

              ${
                editLink
                  ? `
              <!-- Box Tautan Pembaruan Formulir (Link Unik Pendaftar) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:20px;border:1px solid #BAE6FD;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px;color:#0369A1;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📝 Tautan Perbaikan Formulir Pendaftaran</p>
                    <p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:1.6;">
                      Silakan klik tombol di bawah ini untuk langsung membuka dan memperbarui data/dokumen formulir pendaftaran ananda:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td align="center">
                          <a href="${editLink}" style="display:inline-block;background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:15px 36px;border-radius:100px;box-shadow:0 4px 14px rgba(2,132,199,0.35);">
                            ✏️ Perbarui Formulir Pendaftaran Sekarang &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0;color:#64748B;font-size:12px;line-height:1.5;word-break:break-all;text-align:center;">
                      Atau salin tautan unik ini di browser: <br/>
                      <a href="${editLink}" style="color:#0284C7;font-weight:600;text-decoration:none;">${editLink}</a>
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Panduan Selanjutnya -->
              <p style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700;">Langkah yang Perlu Dilakukan:</p>
              <ol style="margin:0 0 28px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
                <li>Buka tautan perbaikan formulir pendaftaran di atas.</li>
                <li>Sesuaikan data atau unggah ulang dokumen yang diminta pada catatan tim admisi.</li>
                <li>Kirimkan kembali formulir tersebut untuk proses verifikasi ulang oleh tim kami.</li>
              </ol>

              <!-- Hubungi WhatsApp -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=${encodeURIComponent(`Assalamu'alaikum Tim Admisi JACOS, saya ${params.parentName} orang tua dari ${params.studentName} (No. Registrasi: ${params.registrationNo}) ingin berkonsultasi mengenai perbaikan berkas pendaftaran.`)}" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:12px 28px;border-radius:100px;box-shadow:0 3px 10px rgba(37,211,102,0.25);">
                      💬 Konsultasi via WhatsApp Tim Admisi
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Kami sangat mengapresiasi kerjasama Bapak/Ibu dalam melengkapi data pendaftaran ananda tercinta.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School (JACOS)</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
// EMAIL 6 — Declaration Letter / Agreement Disetujui
// (Seluruh Fitur Parent Portal Aktif Penuh)
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
      subject: `Declaration Letter Disetujui — ${params.studentName} (Akses Parent Portal Aktif Penuh)`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Declaration Letter Disetujui - JACOS</title>
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
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Declaration Letter Disetujui</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 10px;color:#64748B;font-size:15px;">Yth. Bapak/Ibu <strong style="color:#0F172A;">${params.parentName}</strong>,</p>
              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
                Alhamdulillah, dokumen persetujuan orang tua (<strong>Declaration Letter</strong>) untuk ananda <strong style="color:#0284C7;">${params.studentName}</strong> (No. Registrasi: <code style="font-family:monospace;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${params.registrationNo}</code>) telah berhasil diperiksa dan <strong>resmi disetujui oleh Tim Admisi JACOS</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0FDF4;border-radius:16px;border:1px solid #BBF7D0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;color:#15803D;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Status Dokumen Persetujuan</p>
                    <p style="margin:0;color:#166534;font-size:15px;font-weight:700;">Declaration Letter: Terverifikasi (Verified)</p>
                    <p style="margin:6px 0 0;color:#15803D;font-size:13px;line-height:1.5;">Seluruh akses fitur di Portal Orang Tua Anda kini telah aktif sepenuhnya tanpa pembatasan.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#0284C7,#0369A1);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 14px rgba(2,132,199,0.3);">Buka Parent Portal Sekarang &rarr;</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;">
                Jika memerlukan bantuan lebih lanjut, silakan hubungi tim admission JACOS melalui WhatsApp <strong>0821-4000-0477</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#64748B;font-size:13px;font-weight:700;">Jakarta Cosmopolite Islamic School</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">&copy; ${new Date().getFullYear()} JACOS. All rights reserved.</p>
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
