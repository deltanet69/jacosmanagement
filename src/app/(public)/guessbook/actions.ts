'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { memoryGuestbook, type GuestbookEntry } from '@/lib/data/guestbook-store';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const guestbookSchema = z.object({
  parent_name: z.string().min(2, 'Nama lengkap wajib diisi (minimal 2 karakter)'),
  whatsapp: z.string().min(8, 'Nomor Telepon / WhatsApp wajib diisi (minimal 8 digit)'),
  email: z.string().email('Format alamat email tidak valid'),
  address_detail: z.string().min(3, 'Alamat wajib diisi (minimal 3 karakter)'),
  visit_purpose: z.string().min(1, 'Pilih tujuan kunjungan'),
  other_purpose: z.string().optional().nullable(),
  
  // Optional / Conditional fields for student
  child_name: z.string().optional().nullable(),
  child_age: z.coerce.number().optional().nullable(),
  target_grade: z.string().optional().nullable(),
  
  visit_date: z.string().optional().nullable(),
  visit_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type GuestbookFormData = z.infer<typeof guestbookSchema>;

export interface GuestbookSubmissionResult {
  success: boolean;
  message?: string;
  ticket?: {
    visitCode: string;
    parentName: string;
    whatsapp: string;
    email: string;
    address: string;
    visitPurpose: string;
    childName?: string | null;
    childAge?: number | null;
    targetGrade?: string | null;
    visitDate: string;
    visitTime: string;
    createdAt: string;
  };
}

export async function submitGuestbookEntry(
  formData: GuestbookFormData
): Promise<GuestbookSubmissionResult> {
  try {
    const validated = guestbookSchema.parse(formData);

    // Format Nomor WhatsApp (+62 standard)
    let cleanWa = validated.whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    // Determine final purpose text
    const finalPurpose =
      validated.visit_purpose === 'Others...' && validated.other_purpose
        ? `Others: ${validated.other_purpose.trim()}`
        : validated.visit_purpose;

    const isParentStudentMatter =
      validated.visit_purpose.toLowerCase().includes('parent') &&
      validated.visit_purpose.toLowerCase().includes('matters');

    const finalChildName = isParentStudentMatter && validated.child_name ? validated.child_name.trim() : (validated.child_name?.trim() || '-');
    const finalTargetGrade = isParentStudentMatter && validated.target_grade ? validated.target_grade.trim() : (validated.target_grade?.trim() || '-');

    // Generate unique Visit Code: JCS-VISIT-2026-XXXX
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const visitCode = `JCS-VISIT-${currentYear}-${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    const record = {
      visit_code: visitCode,
      parent_name: validated.parent_name.trim(),
      whatsapp: cleanWa,
      email: validated.email.trim().toLowerCase(),
      province_id: null,
      province_name: null,
      regency_id: null,
      regency_name: null,
      district_id: null,
      district_name: null,
      village_id: null,
      village_name: null,
      postal_code: null,
      address_detail: validated.address_detail.trim(),
      child_name: finalChildName,
      child_age: validated.child_age || null,
      target_grade: finalTargetGrade,
      visit_date: validated.visit_date || todayStr,
      visit_time: validated.visit_time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      visit_purpose: finalPurpose,
      source_info: 'Buku Tamu Digital (Web Resepsionis)',
      notes: validated.notes || null,
      follow_up_status: 'BELUM_FOLLOW_UP',
      follow_up_notes: null,
      followed_up_at: null,
      followed_up_by: null,
    };

    // 1. Save to Supabase (with fallback)
    try {
      const supabase = createAdminClient();
      const { error: dbError } = await supabase
        .from('guestbook_entries')
        .insert(record);

      if (dbError) {
        console.warn('[Guestbook Public] Supabase insert fallback:', dbError.message);
        const fallbackEntry: GuestbookEntry = {
          ...record,
          id: `guest-${Date.now()}`,
          created_at: nowIso,
          updated_at: nowIso,
        };
        memoryGuestbook.unshift(fallbackEntry);
      }
    } catch (dbErr) {
      console.warn('[Guestbook Public] Supabase connection error:', dbErr);
      const fallbackEntry: GuestbookEntry = {
        ...record,
        id: `guest-${Date.now()}`,
        created_at: nowIso,
        updated_at: nowIso,
      };
      memoryGuestbook.unshift(fallbackEntry);
    }

    // 2. Send Confirmation Email via Resend
    const resend = getResend();
    if (resend && record.email) {
      try {
        const studentInfoBlock = isParentStudentMatter && finalChildName !== '-'
          ? `<tr>
               <td style="padding:4px 0;color:#59647D;width:40%;">Nama Siswa:</td>
               <td style="padding:4px 0;font-weight:700;">${finalChildName}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;color:#59647D;">Jenjang Pendidikan:</td>
               <td style="padding:4px 0;font-weight:700;color:#2F6FED;">${finalTargetGrade}</td>
             </tr>`
          : '';

        await resend.emails.send({
          from: 'JACOS Admission <admission@jacos.id>',
          to: record.email,
          subject: `✨ Terima Kasih Telah Berkunjung ke JACOS — ${record.parent_name} (${visitCode})`,
          html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Tamu Kunjungan JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FD;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#16233D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(47,111,237,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #2F6FED 0%, #1E479E 100%);padding:32px 24px;text-align:center;color:#ffffff;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FCE9BE;">JAKARTA COSMOPOLITE ISLAMIC SCHOOL</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">CAMPUS VISIT PASS</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Terima kasih atas kunjungan Bapak/Ibu di kampus JACOS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#16233D;">
                Assalamu'alaikum Wr. Wb. <strong>${record.parent_name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#59647D;">
                Senang sekali dapat menyambut kehadiran Bapak/Ibu di kampus Jakarta Cosmopolite Islamic School (JACOS). Data kunjungan Anda telah berhasil tercatat di buku tamu digital kami.
              </p>

              <!-- Ticket Box -->
              <table width="100%" style="background:#F0F4FA;border-radius:16px;padding:20px;border:1px dashed #2F6FED;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:700;color:#2F6FED;text-transform:uppercase;letter-spacing:1px;">KODE KUNJUNGAN BUKU TAMU</p>
                    <p style="margin:4px 0 16px;font-size:22px;font-weight:800;color:#16233D;letter-spacing:1px;">${visitCode}</p>
                    
                    <table width="100%" style="font-size:13px;color:#16233D;">
                      <tr>
                        <td style="padding:4px 0;color:#59647D;width:40%;">Nama Tamu:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.parent_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Tujuan:</td>
                        <td style="padding:4px 0;font-weight:700;color:#2F6FED;">${record.visit_purpose}</td>
                      </tr>
                      ${studentInfoBlock}
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Waktu Visit:</td>
                        <td style="padding:4px 0;font-weight:700;color:#E8A62E;">${record.visit_date} • ${record.visit_time}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Alamat:</td>
                        <td style="padding:4px 0;color:#59647D;">${record.address_detail}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Button Chat WA -->
              <table width="100%" style="margin-bottom:12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20${encodeURIComponent(record.parent_name)}%20(Kode%20Kunjungan:%20${visitCode})%20telah%20mengisi%20Buku%20Tamu."
                       style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                      💬 Hubungi Tim Admisi JACOS
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F9FD;padding:18px 24px;text-align:center;border-top:1px solid #E2E8F0;font-size:12px;color:#8C95AB;">
              Jakarta Cosmopolite Islamic School (JACOS) • <a href="https://admission.jacos.id" style="color:#2F6FED;text-decoration:none;">admission.jacos.id</a>
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
        console.warn('[Guestbook Public] Resend email note:', emailErr);
      }
    }

    return {
      success: true,
      ticket: {
        visitCode,
        parentName: record.parent_name,
        whatsapp: record.whatsapp,
        email: record.email,
        address: record.address_detail,
        visitPurpose: record.visit_purpose,
        childName: isParentStudentMatter ? record.child_name : null,
        childAge: isParentStudentMatter ? record.child_age : null,
        targetGrade: isParentStudentMatter ? record.target_grade : null,
        visitDate: record.visit_date,
        visitTime: record.visit_time,
        createdAt: nowIso,
      },
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        message: err.errors[0]?.message || 'Data buku tamu tidak lengkap',
      };
    }
    return {
      success: false,
      message: 'Terjadi kendala saat menyimpan buku tamu. Silakan coba kembali.',
    };
  }
}
