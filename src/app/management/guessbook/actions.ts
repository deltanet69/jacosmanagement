'use server';

import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';
import { memoryGuestbook, globalForGuestbook, type GuestbookEntry } from '@/lib/data/guestbook-store';

export type { GuestbookEntry };

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export interface GuestbookStats {
  total: number;
  today: number;
  unfollowed: number;
  followed: number;
  kindergarten: number;
  primary: number;
}

/**
 * 1. Ambil Semua Data Buku Tamu & Statistik Kunjungan
 */
export const getGuestbookEntries = cache(async function getGuestbookEntries(): Promise<{
  entries: GuestbookEntry[];
  stats: GuestbookStats;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('*')
      .order('created_at', { ascending: false });

    let list: GuestbookEntry[] = [];

    if (error || !data) {
      console.warn('[Guestbook Admin] Supabase query note (using fallback):', error?.message);
      list = memoryGuestbook;
    } else {
      list = data as GuestbookEntry[];
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const stats: GuestbookStats = {
      total: list.length,
      today: list.filter((r) => r.visit_date === todayStr || (r.created_at && r.created_at.startsWith(todayStr))).length,
      unfollowed: list.filter((r) => r.follow_up_status === 'BELUM_FOLLOW_UP' || !r.follow_up_status).length,
      followed: list.filter((r) => r.follow_up_status === 'SUDAH_FOLLOW_UP').length,
      kindergarten: list.filter((r) => {
        const g = r.target_grade?.toLowerCase() || '';
        return g.includes('kindergarten') || g.includes('tk') || g.includes('pre-school') || g.includes('toddler');
      }).length,
      primary: list.filter((r) => {
        const g = r.target_grade?.toLowerCase() || '';
        return g.includes('primary') || g.includes('sd');
      }).length,
    };

    return { entries: list, stats };
  } catch (err) {
    console.error('[Guestbook Admin] getGuestbookEntries error:', err);
    return {
      entries: memoryGuestbook,
      stats: {
        total: memoryGuestbook.length,
        today: 0,
        unfollowed: memoryGuestbook.filter((r) => r.follow_up_status === 'BELUM_FOLLOW_UP').length,
        followed: memoryGuestbook.filter((r) => r.follow_up_status === 'SUDAH_FOLLOW_UP').length,
        kindergarten: memoryGuestbook.filter((r) => {
          const g = r.target_grade?.toLowerCase() || '';
          return g.includes('kindergarten') || g.includes('tk') || g.includes('pre-school') || g.includes('toddler');
        }).length,
        primary: memoryGuestbook.filter((r) => {
          const g = r.target_grade?.toLowerCase() || '';
          return g.includes('primary') || g.includes('sd');
        }).length,
      },
    };
  }
});

/**
 * 2. Update Status Follow-Up & Catatan Admin
 */
export async function updateGuestbookFollowUp(params: {
  id: string;
  followUpStatus: 'BELUM_FOLLOW_UP' | 'SUDAH_FOLLOW_UP' | string;
  followUpNotes?: string | null;
  followedUpBy?: string | null;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('guestbook_entries')
      .update({
        follow_up_status: params.followUpStatus,
        follow_up_notes: params.followUpNotes || null,
        followed_up_at: params.followUpStatus === 'SUDAH_FOLLOW_UP' ? nowIso : null,
        followed_up_by: params.followedUpBy || 'Admin Admisi',
        updated_at: nowIso,
      })
      .eq('id', params.id);

    if (error) {
      console.warn('[Guestbook Admin] Supabase update note (memory fallback):', error.message);
      const targetIndex = memoryGuestbook.findIndex((r) => r.id === params.id);
      if (targetIndex >= 0) {
        memoryGuestbook[targetIndex].follow_up_status = params.followUpStatus;
        memoryGuestbook[targetIndex].follow_up_notes = params.followUpNotes || null;
        memoryGuestbook[targetIndex].followed_up_at = params.followUpStatus === 'SUDAH_FOLLOW_UP' ? nowIso : null;
        memoryGuestbook[targetIndex].followed_up_by = params.followedUpBy || 'Admin Admisi';
        memoryGuestbook[targetIndex].updated_at = nowIso;
      }
    }

    revalidatePath('/management/guessbook');
    return { success: true };
  } catch (err) {
    console.error('[Guestbook Admin] updateGuestbookFollowUp error:', err);
    return { success: false, message: 'Gagal memperbarui data follow up' };
  }
}

/**
 * 3. Tambah Tamu Manual oleh Resepsionis (Walk-in on spot)
 */
export async function createManualGuestbookEntry(
  formData: Omit<GuestbookEntry, 'id' | 'visit_code' | 'created_at' | 'updated_at' | 'followed_up_at'> & {
    followed_up_at?: string | null;
  }
): Promise<{ success: boolean; message?: string; entry?: GuestbookEntry }> {
  try {
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const visitCode = `JCS-MANUAL-${currentYear}-${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    let cleanWa = formData.whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    const record = {
      visit_code: visitCode,
      parent_name: formData.parent_name.trim(),
      whatsapp: cleanWa,
      email: formData.email.trim().toLowerCase(),
      province_id: formData.province_id || null,
      province_name: formData.province_name || null,
      regency_id: formData.regency_id || null,
      regency_name: formData.regency_name || null,
      district_id: formData.district_id || null,
      district_name: formData.district_name || null,
      village_id: formData.village_id || null,
      village_name: formData.village_name || null,
      postal_code: formData.postal_code || null,
      address_detail: formData.address_detail || 'Kampus JACOS (Walk-in)',
      child_name: formData.child_name ? formData.child_name.trim() : '-',
      child_age: formData.child_age || null,
      target_grade: formData.target_grade || '-',
      visit_date: formData.visit_date || todayStr,
      visit_time: formData.visit_time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      visit_purpose: formData.visit_purpose || 'Konsultasi Admisi (Walk-in)',
      source_info: formData.source_info || 'Walk-in On Spot',
      notes: formData.notes || null,
      follow_up_status: formData.follow_up_status || 'BELUM_FOLLOW_UP',
      follow_up_notes: formData.follow_up_notes || null,
      followed_up_at: formData.follow_up_status === 'SUDAH_FOLLOW_UP' ? nowIso : null,
      followed_up_by: formData.followed_up_by || 'Staf Resepsionis',
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('guestbook_entries')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('[Guestbook Admin] Supabase manual insert fallback:', error.message);
      const fallbackEntry: GuestbookEntry = {
        ...record,
        id: `manual-guest-${Date.now()}`,
        created_at: nowIso,
        updated_at: nowIso,
      };
      memoryGuestbook.unshift(fallbackEntry);
      revalidatePath('/management/guessbook');
      return { success: true, entry: fallbackEntry };
    }

    revalidatePath('/management/guessbook');
    return { success: true, entry: data as GuestbookEntry };
  } catch (err) {
    console.error('[Guestbook Admin] createManualGuestbookEntry error:', err);
    return { success: false, message: 'Gagal menambahkan data buku tamu manual' };
  }
}

/**
 * 4. Hapus Data Buku Tamu
 */
export async function deleteGuestbookEntry(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('guestbook_entries').delete().eq('id', id);

    if (error) {
      console.warn('[Guestbook Admin] Supabase delete fallback:', error.message);
      const idx = globalForGuestbook.memoryGuestbook.findIndex((r) => r.id === id);
      if (idx >= 0) globalForGuestbook.memoryGuestbook.splice(idx, 1);
    }

    revalidatePath('/management/guessbook');
    return { success: true };
  } catch (err) {
    console.error('[Guestbook Admin] deleteGuestbookEntry error:', err);
    return { success: false, message: 'Gagal menghapus data buku tamu' };
  }
}

/**
 * 5. Kirim Template Email Follow-Up Resmi via Resend
 */
export async function sendGuestbookFollowUpEmail(params: {
  entryId: string;
  recipientEmail: string;
  parentName: string;
  childName: string;
  targetGrade: string;
  visitCode: string;
  customMessage?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      return { success: false, message: 'Koneksi Resend API Key belum terkonfigurasi di server' };
    }

    const { error } = await resend.emails.send({
      from: 'JACOS Admission Team <admission@jacos.id>',
      to: params.recipientEmail,
      subject: `🌸 Salam Hangat dari JACOS — Tindak Lanjut Kunjungan untuk ${params.childName}`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Follow Up Kunjungan JACOS</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FD;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#16233D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(47,111,237,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #2F6FED 0%, #1E479E 100%);padding:28px 24px;text-align:center;color:#ffffff;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FCE9BE;">JAKARTA COSMOPOLITE ISLAMIC SCHOOL</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Follow-up Kunjungan JACOS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#16233D;">
                Assalamu'alaikum Wr. Wb. <strong>${params.parentName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#59647D;">
                Terima kasih atas kunjungan Ayah & Bunda ke kampus <strong>Jakarta Cosmopolite Islamic School (JACOS)</strong> untuk konsultasi jenjang <strong>${params.targetGrade}</strong> bagi ananda tercinta <strong>${params.childName}</strong> (Kode Kunjungan: <strong>${params.visitCode}</strong>).
              </p>

              ${
                params.customMessage
                  ? `
              <div style="background:#F0F4FA;border-left:4px solid #2F6FED;border-radius:8px;padding:16px;margin:20px 0;font-size:14px;color:#16233D;line-height:1.6;">
                ${params.customMessage.replace(/\n/g, '<br/>')}
              </div>
              `
                  : `
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#59647D;">
                Tim Admisi JACOS dengan senang hati siap mendampingi Ayah & Bunda untuk tahapan pendaftaran siswa baru, jadwal trial class interaktif, serta rincian pembiayaan pendidikan.
              </p>
              `
              }

              <!-- Highlight Box -->
              <div style="background:#FFF6E4;border-radius:16px;padding:18px;margin:24px 0;border:1px solid #FCE9BE;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#C68A1B;">🌟 KEMUDAHAN PENDAFTARAN ONLINE</p>
                <p style="margin:0;font-size:13px;color:#16233D;line-height:1.5;">
                  Ayah & Bunda dapat melanjutkan proses registrasi secara praktis melalui portal pendaftaran online kami di <a href="https://admission.jacos.id" style="color:#2F6FED;font-weight:700;text-decoration:none;">admission.jacos.id</a>.
                </p>
              </div>

              <!-- Button WhatsApp -->
              <table width="100%" style="margin:24px 0 12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Tim%20Admission%20JACOS,%20saya%20${encodeURIComponent(params.parentName)}%20orang%20tua%20dari%20${encodeURIComponent(params.childName)}%20(Kode%20Kunjungan:%20${params.visitCode})%20ingin%20berkonsultasi%20tindak%20lanjut%20pendaftaran."
                       style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                      💬 Hubungi WhatsApp Tim Admisi
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F9FD;padding:16px;text-align:center;border-top:1px solid #E2E8F0;font-size:12px;color:#8C95AB;">
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

    if (error) {
      return { success: false, message: error.message };
    }

    // Update status to SUDAH_FOLLOW_UP
    await updateGuestbookFollowUp({
      id: params.entryId,
      followUpStatus: 'SUDAH_FOLLOW_UP',
      followUpNotes: `Email follow up resmi terkirim pada ${new Date().toLocaleString('id-ID')}`,
    });

    return { success: true };
  } catch (err) {
    console.error('[Guestbook Admin] sendGuestbookFollowUpEmail error:', err);
    return { success: false, message: 'Gagal mengirim email follow up' };
  }
}
