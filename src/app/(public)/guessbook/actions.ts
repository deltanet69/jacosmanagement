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
  parent_name: z.string().min(2, 'Nama lengkap Ayah/Bunda/Wali wajib diisi (minimal 2 karakter)'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp aktif wajib diisi (minimal 8 digit)'),
  email: z.string().email('Format alamat email tidak valid'),
  
  province_id: z.string().optional().nullable(),
  province_name: z.string().optional().nullable(),
  regency_id: z.string().optional().nullable(),
  regency_name: z.string().optional().nullable(),
  district_id: z.string().optional().nullable(),
  district_name: z.string().optional().nullable(),
  village_id: z.string().optional().nullable(),
  village_name: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  address_detail: z.string().min(3, 'Detail alamat tempat tinggal wajib diisi (nama jalan, nomor rumah, RT/RW)'),
  
  child_name: z.string().min(2, 'Nama lengkap ananda/calon siswa wajib diisi'),
  child_age: z.coerce.number().min(1, 'Usia ananda minimal 1 tahun').max(18, 'Usia ananda maksimal 18 tahun').optional().nullable(),
  target_grade: z.string().min(1, 'Pilih tujuan jenjang pendidikan ananda'),
  
  visit_date: z.string().optional().nullable(),
  visit_time: z.string().optional().nullable(),
  visit_purpose: z.string().optional().nullable(),
  source_info: z.string().optional().nullable(),
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
    childName: string;
    childAge?: number | null;
    targetGrade: string;
    addressSimple: string;
    addressFull: string;
    visitDate: string;
    visitTime: string;
    visitPurpose?: string | null;
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

    // Generate unique Visit Code: JCS-VISIT-2026-XXXX
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const visitCode = `JCS-VISIT-${currentYear}-${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    const simpleAddressParts = [
      validated.district_name,
      validated.regency_name,
      validated.province_name,
    ].filter(Boolean);
    const addressSimple = simpleAddressParts.length > 0 ? simpleAddressParts.join(', ') : validated.address_detail;

    const fullAddressParts = [
      validated.address_detail,
      validated.village_name ? `Kel. ${validated.village_name}` : '',
      validated.district_name ? `Kec. ${validated.district_name}` : '',
      validated.regency_name,
      validated.province_name,
      validated.postal_code ? `Kode Pos ${validated.postal_code}` : '',
    ].filter(Boolean);
    const addressFull = fullAddressParts.join(', ');

    const record = {
      visit_code: visitCode,
      parent_name: validated.parent_name.trim(),
      whatsapp: cleanWa,
      email: validated.email.trim().toLowerCase(),
      province_id: validated.province_id || null,
      province_name: validated.province_name || null,
      regency_id: validated.regency_id || null,
      regency_name: validated.regency_name || null,
      district_id: validated.district_id || null,
      district_name: validated.district_name || null,
      village_id: validated.village_id || null,
      village_name: validated.village_name || null,
      postal_code: validated.postal_code || null,
      address_detail: validated.address_detail.trim(),
      child_name: validated.child_name.trim(),
      child_age: validated.child_age || null,
      target_grade: validated.target_grade,
      visit_date: validated.visit_date || todayStr,
      visit_time: validated.visit_time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      visit_purpose: validated.visit_purpose || 'School Visit & Konsultasi Admisi',
      source_info: validated.source_info || 'Datang Langsung / Scan QR Resepsionis',
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
        await resend.emails.send({
          from: 'JACOS Admission <admission@jacos.id>',
          to: record.email,
          subject: `✨ Terima Kasih Telah Berkunjung ke JACOS — ${record.child_name} (${visitCode})`,
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
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Terima kasih atas kunjungan Ayah & Bunda di kampus JACOS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#16233D;">
                Assalamu'alaikum Wr. Wb. <strong>${record.parent_name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#59647D;">
                Senang sekali dapat menyambut kehadiran Ayah & Bunda serta ananda tercinta <strong>${record.child_name}</strong> di kampus Jakarta Cosmopolite Islamic School (JACOS). Data kunjungan Ayah/Bunda telah berhasil tercatat di buku tamu kami.
              </p>

              <!-- Ticket Box -->
              <table width="100%" style="background:#F0F4FA;border-radius:16px;padding:20px;border:1px dashed #2F6FED;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:700;color:#2F6FED;text-transform:uppercase;letter-spacing:1px;">KODE KUNJUNGAN BUKU TAMU</p>
                    <p style="margin:4px 0 16px;font-size:22px;font-weight:800;color:#16233D;letter-spacing:1px;">${visitCode}</p>
                    
                    <table width="100%" style="font-size:13px;color:#16233D;">
                      <tr>
                        <td style="padding:4px 0;color:#59647D;width:40%;">Calon Siswa:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.child_name} ${record.child_age ? `(${record.child_age} Tahun)` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Minat Jenjang:</td>
                        <td style="padding:4px 0;font-weight:700;color:#2F6FED;">${record.target_grade}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Waktu Visit:</td>
                        <td style="padding:4px 0;font-weight:700;color:#E8A62E;">${record.visit_date} • ${record.visit_time}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Tujuan:</td>
                        <td style="padding:4px 0;font-weight:700;">${record.visit_purpose}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#59647D;">Alamat:</td>
                        <td style="padding:4px 0;color:#59647D;">${addressSimple}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background:#FFF6E4;border-radius:14px;padding:16px;margin-bottom:24px;border:1px solid #FCE9BE;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#C68A1B;">🌟 KELANJUTAN PENDAFTARAN & KONSULTASI</p>
                <p style="margin:0;font-size:13px;color:#16233D;line-height:1.5;">
                  Tim Admission JACOS akan segera menghubungi Ayah & Bunda untuk mengirimkan booklet informasi biaya, panduan pendaftaran online, serta jadwal trial class untuk ananda.
                </p>
              </div>

              <!-- Button Chat WA -->
              <table width="100%" style="margin-bottom:12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Admin%20JACOS,%20saya%20${encodeURIComponent(record.parent_name)}%20orang%20tua%20dari%20${encodeURIComponent(record.child_name)}%20(Kode%20Kunjungan:%20${visitCode})%20telah%20mengisi%20Buku%20Tamu."
                       style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                      💬 Chat WhatsApp Tim Admisi JACOS
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
        childName: record.child_name,
        childAge: record.child_age,
        targetGrade: record.target_grade,
        addressSimple,
        addressFull,
        visitDate: record.visit_date,
        visitTime: record.visit_time,
        visitPurpose: record.visit_purpose,
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
