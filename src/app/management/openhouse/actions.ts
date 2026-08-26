'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';
import { memoryRegistrations, memorySetting, globalForOpenHouse } from './memory-store';
export type { OpenHouseLead, OpenHouseSetting } from './memory-store';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export interface OpenHouseStats {
  total: number;
  confirmed: number;
  attended: number;
  kindergarten: number;
  primary: number;
  converted: number;
  followUpProgress: number;
}


/**
 * 1. Ambil Semua Data Pendaftaran Open House & Statistik
 */
export async function getOpenHouseRegistrations(): Promise<{
  registrations: OpenHouseLead[];
  stats: OpenHouseStats;
  setting: OpenHouseSetting;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('open_house_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    let list: OpenHouseLead[] = [];

    if (error || !data) {
      console.warn('[OpenHouse Admin] Supabase query note (using memory/fallback):', error?.message);
      list = memoryRegistrations;
    } else {
      list = data as OpenHouseLead[];
    }

    // Hitung Statistik
    const stats: OpenHouseStats = {
      total: list.length,
      confirmed: list.filter((r) => r.lead_status === 'CONFIRMED_ATTENDING' || r.interest_attendance === 'Ya').length,
      attended: list.filter((r) => r.lead_status === 'ATTENDED').length,
      kindergarten: list.filter((r) => r.target_program?.toLowerCase().includes('kindergarten')).length,
      primary: list.filter((r) => r.target_program?.toLowerCase().includes('primary')).length,
      converted: list.filter((r) => r.lead_status === 'CONVERTED_TO_APPLICANT').length,
      followUpProgress: list.filter((r) => r.lead_status === 'FOLLOW_UP_PROGRESS').length,
    };

    // Ambil Pengaturan Status Toggle
    const setting = await getOpenHouseEventSetting();

    return { registrations: list, stats, setting };
  } catch (err) {
    console.error('[OpenHouse Admin] getOpenHouseRegistrations error:', err);
    return {
      registrations: memoryRegistrations,
      stats: {
        total: memoryRegistrations.length,
        confirmed: 0,
        attended: 0,
        kindergarten: 0,
        primary: 0,
        converted: 0,
        followUpProgress: 0,
      },
      setting: memorySetting,
    };
  }
}

/**
 * 2. Update Status Lead & Catatan Follow-Up
 */
export async function updateLeadStatusAndNotes(params: {
  id: string;
  leadStatus: string;
  followUpNotes: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('open_house_registrations')
      .update({
        lead_status: params.leadStatus,
        follow_up_notes: params.followUpNotes,
        last_contacted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', params.id);

    if (error) {
      console.warn('[OpenHouse Admin] Supabase update note (memory fallback):', error.message);
      const targetIndex = memoryRegistrations.findIndex((r) => r.id === params.id);
      if (targetIndex >= 0) {
        memoryRegistrations[targetIndex].lead_status = params.leadStatus;
        memoryRegistrations[targetIndex].follow_up_notes = params.followUpNotes;
        memoryRegistrations[targetIndex].last_contacted_at = nowIso;
      }
    }

    revalidatePath('/management/openhouse');
    return { success: true };
  } catch (err) {
    console.error('[OpenHouse Admin] updateLeadStatusAndNotes error:', err);
    return { success: false, message: 'Gagal memperbarui data follow up' };
  }
}

/**
 * 3. Tambah Pendaftar Manual (Walk-in / Telepon)
 */
export async function createManualOpenHouseRegistration(
  formData: Omit<OpenHouseLead, 'id' | 'ticket_code' | 'created_at' | 'updated_at' | 'last_contacted_at'> & {
    last_contacted_at?: string | null;
  }
): Promise<{ success: boolean; message?: string; lead?: OpenHouseLead }> {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const programPrefix = formData.target_program.toLowerCase().includes('kindergarten') ? 'KG' : 'PRI';
    const ticketCode = `JOH-MANUAL-${programPrefix}-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    let cleanWa = formData.whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    const record = {
      ticket_code: ticketCode,
      parent_name: formData.parent_name.trim(),
      whatsapp: cleanWa,
      email: formData.email.trim().toLowerCase(),
      child_name: formData.child_name.trim(),
      child_age: formData.child_age || null,
      target_program: formData.target_program,
      entry_year: formData.entry_year,
      interest_attendance: formData.interest_attendance || 'Ya',
      attendance_date: formData.attendance_date || 'Sabtu, 29 Agustus 2026',
      attendance_session: formData.attendance_session || 'Session 1 (09.30 - 11.30)',
      source_info: formData.source_info || 'Walk-in On Spot',
      topics_of_interest: formData.topics_of_interest || [],
      admission_consultation: formData.admission_consultation || 'Ya',
      lead_status: formData.lead_status || 'ATTENDED',
      follow_up_notes: formData.follow_up_notes || 'Pendaftaran manual / on-spot oleh staf admission',
      last_contacted_at: nowIso,
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('open_house_registrations')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn('[OpenHouse Admin] Supabase manual insert fallback:', error.message);
      const fallbackLead: OpenHouseLead = {
        ...record,
        id: `manual-${Date.now()}`,
        created_at: nowIso,
        updated_at: nowIso,
      };
      memoryRegistrations.unshift(fallbackLead);
      revalidatePath('/management/openhouse');
      return { success: true, lead: fallbackLead };
    }

    revalidatePath('/management/openhouse');
    return { success: true, lead: data as OpenHouseLead };
  } catch (err) {
    console.error('[OpenHouse Admin] createManualOpenHouseRegistration error:', err);
    return { success: false, message: 'Gagal menambahkan pendaftaran manual' };
  }
}

/**
 * 4. Hapus Pendaftar Open House
 */
export async function deleteOpenHouseRegistration(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('open_house_registrations').delete().eq('id', id);

    if (error) {
      console.warn('[OpenHouse Admin] Supabase delete fallback:', error.message);
      const idx = globalForOpenHouse.memoryRegistrations.findIndex((r) => r.id === id);
      if (idx >= 0) globalForOpenHouse.memoryRegistrations.splice(idx, 1);
    }

    revalidatePath('/management/openhouse');
    return { success: true };
  } catch (err) {
    console.error('[OpenHouse Admin] deleteOpenHouseRegistration error:', err);
    return { success: false, message: 'Gagal menghapus data' };
  }
}

/**
 * 5. Kirim Template Email Follow-Up Resmi via Resend
 */
export async function sendFollowUpEmail(params: {
  leadId: string;
  recipientEmail: string;
  parentName: string;
  childName: string;
  targetProgram: string;
  ticketCode: string;
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
      subject: `🌸 Salam Hangat dari JACOS — Follow Up Open House untuk ${params.childName}`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Follow Up JACOS Open House</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FD;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#16233D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(47,111,237,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #2F6FED 0%, #1E479E 100%);padding:28px 24px;text-align:center;color:#ffffff;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FCE9BE;">JAKARTA COSMOPOLITE ISLAMIC SCHOOL</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Follow-up JACOS Open House</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#16233D;">
                Assalamu'alaikum Wr. Wb. <strong>${params.parentName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#59647D;">
                Terima kasih telah berpartisipasi dan mendaftarkan ananda tercinta <strong>${params.childName}</strong> pada acara <strong>JACOS Open House (Jenjang ${params.targetProgram})</strong> dengan kode tiket <strong>${params.ticketCode}</strong>.
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
                Tim Admission JACOS siap mendampingi Ayah & Bunda untuk proses pendaftaran siswa baru, informasi beasiswa/promo khusus Open House, serta konsultasi program trilingual dan kurikulum terpadu kami.
              </p>
              `
              }

              <!-- Highlight Box -->
              <div style="background:#FFF6E4;border-radius:16px;padding:18px;margin:24px 0;border:1px solid #FCE9BE;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#C68A1B;">🌟 PROMO EKSKLUSIF PESERTA OPEN HOUSE</p>
                <p style="margin:0;font-size:13px;color:#16233D;line-height:1.5;">
                  Dapatkan penawaran istimewa biaya formulir dan voucher pendidikan khusus bagi pendaftar yang menyelesaikan aplikasi admisi setelah sesi Open House.
                </p>
              </div>

              <!-- Direct WhatsApp Button -->
              <table width="100%" style="margin:24px 0 12px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6282140000477?text=Assalamu'alaikum%20Tim%20Admission%20JACOS,%20saya%20${encodeURIComponent(params.parentName)}%20orang%20tua%20dari%20${encodeURIComponent(params.childName)}%20(Kode%20Tiket:%20${params.ticketCode})%20ingin%20berkonsultasi%20kelanjutan%20pendaftaran."
                       style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(37,211,102,0.25);">
                      💬 Chat Konsultasi via WhatsApp Admission
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F9FD;padding:16px;text-align:center;border-top:1px solid #E2E8F0;font-size:12px;color:#8C95AB;">
              Jakarta Cosmopolite Islamic School (JACOS) • <a href="https://jacos.sch.id" style="color:#2F6FED;text-decoration:none;">jacos.sch.id</a>
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

    // Update status to FOLLOW_UP_PROGRESS
    await updateLeadStatusAndNotes({
      id: params.leadId,
      leadStatus: 'FOLLOW_UP_PROGRESS',
      followUpNotes: `Email follow up resmi berhasil dikirim pada ${new Date().toLocaleString('id-ID')}`,
    });

    return { success: true };
  } catch (err) {
    console.error('[OpenHouse Admin] sendFollowUpEmail error:', err);
    return { success: false, message: 'Gagal mengirim email follow up' };
  }
}

/**
 * 6. Ambil Pengaturan Status Toggle Event Open House
 */
export async function getOpenHouseEventSetting(): Promise<OpenHouseSetting> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('open_house_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      return memorySetting;
    }
    return data as OpenHouseSetting;
  } catch (err) {
    return memorySetting;
  }
}

/**
 * 7. Toggle Status Event Open House (ON / OFF)
 */
export async function toggleOpenHouseEventStatus(
  isActive: boolean,
  inactiveMessage?: string
): Promise<{ success: boolean; setting: OpenHouseSetting }> {
  try {
    const nowIso = new Date().toISOString();
    const updatedSetting: OpenHouseSetting = {
      id: 'default',
      is_active: isActive,
      inactive_message:
        inactiveMessage ||
        'Pendaftaran JACOS Open House saat ini sedang belum dibuka atau telah berakhir. Pantau terus akun media sosial resmi JACOS (@jacos.school) untuk informasi gelombang Open House berikutnya!',
      event_title: 'JACOS OPEN HOUSE Primary & Kindergarten 2026',
      event_dates: 'Sabtu, 29 Agustus 2026 & Ahad, 30 Agustus 2026',
      updated_at: nowIso,
    };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('open_house_settings')
      .upsert(updatedSetting, { onConflict: 'id' });

    if (error) {
      console.warn('[OpenHouse Admin] Supabase settings update fallback:', error.message);
      Object.assign(globalForOpenHouse.memorySetting, updatedSetting);
    } else {
      Object.assign(globalForOpenHouse.memorySetting, updatedSetting);
    }

    revalidatePath('/management/openhouse');
    revalidatePath('/openhouse');
    return { success: true, setting: memorySetting };
  } catch (err) {
    console.error('[OpenHouse Admin] toggleOpenHouseEventStatus error:', err);
    globalForOpenHouse.memorySetting.is_active = isActive;
    return { success: true, setting: globalForOpenHouse.memorySetting };
  }
}
