import { OpenHouseLead, OpenHouseSetting } from '@/app/management/openhouse/actions';

export const memoryRegistrations: OpenHouseLead[] = [];

export const memorySetting: OpenHouseSetting = {
  id: 'default',
  is_active: true,
  inactive_message:
    'Pendaftaran JACOS Open House saat ini sedang belum dibuka atau telah berakhir. Pantau terus akun media sosial resmi JACOS (@jacos.school) untuk informasi gelombang Open House berikutnya!',
  event_title: 'JACOS OPEN HOUSE Primary & Kindergarten 2026',
  event_dates: 'Sabtu, 29 Agustus 2026 & Ahad, 30 Agustus 2026',
  updated_at: new Date().toISOString(),
};
