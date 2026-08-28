'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const openHouseSchema = z.object({
  parent_name: z.string().min(2, 'Nama orang tua wajib diisi (minimal 2 karakter)'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp aktif wajib diisi (minimal 8 digit)'),
  email: z.string().email('Format email tidak valid'),
  child_name: z.string().min(2, 'Nama anak wajib diisi'),
  child_age: z.coerce.number().min(1, 'Usia anak minimal 1 tahun').max(18, 'Usia anak maksimal 18 tahun').optional().nullable(),
  target_program: z.string().min(1, 'Pilih jenjang yang diminati'),
  entry_year: z.string().min(1, 'Pilih tahun masuk JACOS'),
  interest_attendance: z.string().default('Ya'),
  attendance_date: z.string().optional().default('Sabtu, 29 Agustus 2026'),
  attendance_session: z.string().optional().default('Session 1 (09.30 - 11.30)'),
  source_info: z.string().min(1, 'Pilih dari mana Anda mengetahui acara ini'),
  topics_of_interest: z.array(z.string()).default([]),
  admission_consultation: z.string().default('Ya'),
});

export type OpenHouseFormData = z.infer<typeof openHouseSchema>;

export interface OpenHouseRegistrationResult {
  success: boolean;
  message?: string;
  ticket?: {
    ticketCode: string;
    parentName: string;
    whatsapp: string;
    email: string;
    childName: string;
    childAge?: number | null;
    targetProgram: string;
    entryYear: string;
    interestAttendance: string;
    attendanceDate: string;
    attendanceSession: string;
    sourceInfo: string;
    topicsOfInterest: string[];
    admissionConsultation: string;
    createdAt: string;
  };
}

export async function submitOpenHouseRegistration(
  formData: OpenHouseFormData
): Promise<OpenHouseRegistrationResult> {
  try {
    const validated = openHouseSchema.parse(formData);

    // Format Nomor WhatsApp (+62 standard)
    let cleanWa = validated.whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    // Generate unique Ticket Code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const programPrefix = validated.target_program.toLowerCase().includes('kindergarten') ? 'KG' : 'PRI';
    const ticketCode = `JOH-${programPrefix}-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const record = {
      ticket_code: ticketCode,
      parent_name: validated.parent_name.trim(),
      whatsapp: cleanWa,
      email: validated.email.trim().toLowerCase(),
      child_name: validated.child_name.trim(),
      child_age: validated.child_age || null,
      target_program: validated.target_program,
      entry_year: validated.entry_year,
      interest_attendance: validated.interest_attendance,
      attendance_date: validated.attendance_date || 'Sabtu, 29 Agustus 2026',
      attendance_session: validated.attendance_session || 'Session 1 (09.30 - 11.30)',
      source_info: validated.source_info,
      topics_of_interest: validated.topics_of_interest,
      admission_consultation: validated.admission_consultation,
      lead_status: validated.interest_attendance === 'Ya' ? 'CONFIRMED_ATTENDING' : 'NEW_LEAD',
    };

    // Save to Supabase
    try {
      const supabase = createAdminClient();
      const { error: dbError } = await supabase
        .from('open_house_registrations')
        .insert(record);

      if (dbError) {
        console.warn('[OpenHouse] Supabase insert note (fallback mode active):', dbError.message);
        const { memoryRegistrations } = await import('@/app/management/openhouse/memory-store');
        memoryRegistrations.unshift({
          ...record,
          id: `public-${Date.now()}`,
          created_at: nowIso,
          updated_at: nowIso,
          last_contacted_at: null,
          follow_up_notes: null
        });
      }
    } catch (dbErr) {
      console.warn('[OpenHouse] Supabase connection error:', dbErr);
      const { memoryRegistrations } = await import('@/app/management/openhouse/memory-store');
      memoryRegistrations.unshift({
        ...record,
        id: `public-${Date.now()}`,
        created_at: nowIso,
        updated_at: nowIso,
        last_contacted_at: null,
        follow_up_notes: null
      });
    }

    // Send confirmation email asynchronously via Resend
    const resend = getResend();
    if (resend && record.email) {
      try {
        await resend.emails.send({
          from: 'JACOS Open House <admission@jacos.id>',
          to: record.email,
          subject: `✨ E-Ticket VIP Open House JACOS 2026 — ${record.child_name} (${ticketCode})`,
          html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>VIP Pass JACOS Open House 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FD;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#16233D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 10px 25px rgba(47,111,237,0.08);overflow:hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #2F6FED 0%, #1E479E 100%);padding:32px 24px;text-align:center;color:#ffffff;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FCE9BE;">JAKARTA COSMOPOLITE ISLAMIC SCHOOL</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">VIP ADMISSION PASS</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">JACOS Open House 2026 — Kindergarten & Primary</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#16233D;">
                Assalamu'alaikum Wr. Wb. <strong>${record.parent_name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#59647D;">
                Terima kasih atas pendaftaran Mommy/Daddy untuk menghadiri <strong>JACOS Open House 2026</strong>. Kami sangat menantikan kehadiran keluarga Mommy/Daddy untuk mengenal lebih dekat lingkungan belajar islami berstandar internasional kami.
              </p>

              <!-- Ticket Box -->
              <table width="100%" style="background:#F0F4FA;border-radius:16px;padding:20px;border:1px dashed #2F6FED;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:700;color:#2F6FED;text-transform:uppercase;letter-spacing:1px;">KODE TIKET VIP</p>
                    <p style="margin:4px 0 16px;font-size:22px;font-weight:800;color:#16233D;letter-spacing:1px;">${ticketCode}</p>
                    
                    <table width="100%" style="font-size:13px;color:#16233D;">
                      <tr>
                        <td style="padding:4px 0;color:#59647D;width:40%;">Calon Siswa:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.child_name} ${record.child_age ? `(${record.child_age} Thn)` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Jenjang Minat:</td>
                        <td style="padding:4px 0;font-weight:700;color:#2F6FED;">${record.target_program}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Tahun Masuk:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.entry_year}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Jadwal Kehadiran:</td>
                        <td style="padding:4px 0;font-weight:700;color:#E8A62E;">${record.attendance_date}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Sesi Waktu:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.attendance_session}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Konsultasi Tim:</td>
                        <td style="padding:4px 0;font-weight:700;color:#2FB378;">${record.admission_consultation === 'Ya' ? 'Dijadwalkan (Ya)' : record.admission_consultation}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Lokasi Info -->
              <div style="background:#FFF6E4;border-radius:12px;padding:14px 18px;margin-bottom:24px;border:1px solid #FCE9BE;">
                <p style="margin:0;font-size:12px;font-weight:700;color:#C68A1B;">📍 LOKASI KAMPUS JACOS</p>
                <p style="margin:4px 0 0;font-size:13px;color:#16233D;line-height:1.5;">
                  Jakarta Cosmopolite Islamic School Campus<br/>
                  <em>Silakan tunjukkan kode tiket ini kepada tim penerima tamu saat tiba.</em>
                </p>
              </div>

              <!-- Action Button -->
              <table width="100%" style="margin-bottom:12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20sudah%20mendaftar%20Open%20House%20dengan%20Kode%20Tiket:%20${ticketCode}%20untuk%20${encodeURIComponent(record.child_name)}"
                       style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                      💬 Konfirmasi ke WhatsApp Admission
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#F7F9FD;padding:18px 24px;text-align:center;border-top:1px solid #E2E8F0;font-size:12px;color:#8C95AB;">
              © 2026 Jakarta Cosmopolite Islamic School (JACOS). All rights reserved.
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
      } catch (emailErr) {
        console.warn('[OpenHouse] Resend email delivery note:', emailErr);
      }
    }

    return {
      success: true,
      ticket: {
        ticketCode,
        parentName: record.parent_name,
        whatsapp: record.whatsapp,
        email: record.email,
        childName: record.child_name,
        childAge: record.child_age,
        targetProgram: record.target_program,
        entryYear: record.entry_year,
        interestAttendance: record.interest_attendance,
        attendanceDate: record.attendance_date,
        attendanceSession: record.attendance_session,
        sourceInfo: record.source_info,
        topicsOfInterest: record.topics_of_interest,
        admissionConsultation: record.admission_consultation,
        createdAt: nowIso,
      },
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        message: err.errors[0]?.message || 'Data formulir tidak lengkap',
      };
    }
    return {
      success: false,
      message: 'Terjadi kesalahan sistem saat menyimpan pendaftaran. Silakan coba kembali.',
    };
  }
}
