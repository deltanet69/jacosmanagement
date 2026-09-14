'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import {
  memoryEvents,
  DEFAULT_JACOS_EVENT,
  DEFAULT_JACOS_EVENT_ID,
  DEFAULT_JACOS_EVENT_SLUG,
  slugify,
  resolveLeadEvent,
  toIsoDateString,
  type OpenHouseEvent,
  type OpenHouseSchedule,
} from './event-store';
import { loadEventsFromDisk, saveEventsToDisk } from './event-disk-store';

const scheduleSchema = z.object({
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  start_time: z.string().trim().min(1, 'Jam mulai wajib diisi'),
  end_time: z.string().trim().min(1, 'Jam selesai wajib diisi'),
});

const eventSchema = z.object({
  name: z.string().trim().min(3, 'Nama event minimal 3 karakter'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Deskripsi event minimal 10 karakter'),
  banner_url: z.string().url().nullable().optional(),
  event_dates: z.array(scheduleSchema).min(1, 'Tambahkan minimal satu jadwal pelaksanaan'),
  is_active: z.boolean().default(true),
});

async function isAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

function normalizeEvent(row: Record<string, unknown>, audienceCount = 0): OpenHouseEvent {
  let parsedDates: OpenHouseSchedule[] = [];
  if (Array.isArray(row.event_dates)) {
    parsedDates = row.event_dates as OpenHouseSchedule[];
  } else if (typeof row.event_dates === 'string') {
    try {
      const parsed = JSON.parse(row.event_dates);
      if (Array.isArray(parsed)) parsedDates = parsed;
    } catch {}
  }

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description || ''),
    banner_url: row.banner_url ? String(row.banner_url) : null,
    event_dates: parsedDates,
    is_active: Boolean(row.is_active),
    audience_count: audienceCount,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

function parseEventFromSettingsRow(row: Record<string, unknown>, audienceCount = 0): OpenHouseEvent | null {
  try {
    const id = String(row.id);
    if (id === 'default') return null;

    let meta: { slug?: string; description?: string; banner_url?: string | null; created_at?: string } = {};
    if (typeof row.inactive_message === 'string' && row.inactive_message.startsWith('{')) {
      try {
        meta = JSON.parse(row.inactive_message);
      } catch {}
    }

    let parsedDates: OpenHouseSchedule[] = [];
    if (typeof row.event_dates === 'string') {
      try {
        const parsed = JSON.parse(row.event_dates);
        if (Array.isArray(parsed)) parsedDates = parsed;
      } catch {
        parsedDates = [{ date: String(row.event_dates), start_time: '08:30', end_time: '10:00' }];
      }
    }

    const name = String(row.event_title || 'JACOS Open House');
    const slug = meta.slug || slugify(name) || `event-${id}`;
    const description = meta.description || '';
    const banner_url = meta.banner_url || null;

    return {
      id,
      slug,
      name,
      description,
      banner_url,
      event_dates: parsedDates,
      is_active: Boolean(row.is_active),
      audience_count: audienceCount,
      created_at: meta.created_at || String(row.updated_at || new Date().toISOString()),
      updated_at: String(row.updated_at || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

/**
 * Get all Open House events with live audience counts (Multi-Layer Store)
 */
export async function getOpenHouseEvents(): Promise<OpenHouseEvent[]> {
  try {
    const supabase = createAdminClient();

    // 1. Ambil event dari Supabase open_house_events jika ada
    let eventsFromDbTable: OpenHouseEvent[] = [];
    try {
      const { data, error } = await supabase.from('open_house_events').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        eventsFromDbTable = data.map((row) => normalizeEvent(row));
      }
    } catch {}

    // 2. Ambil event dari Supabase open_house_settings (Multi-row cloud store)
    let eventsFromSettingsTable: OpenHouseEvent[] = [];
    try {
      const { data, error } = await supabase.from('open_house_settings').select('*');
      if (!error && data && data.length > 0) {
        for (const row of data) {
          const parsed = parseEventFromSettingsRow(row);
          if (parsed) eventsFromSettingsTable.push(parsed);
        }
      }
    } catch {}

    // 3. Ambil event dari persistent disk file backup
    const diskEvents = loadEventsFromDisk();

    // 4. Gabungkan semua sumber (prioritas: table > settings table > disk > memory > default)
    const combinedMap = new Map<string, OpenHouseEvent>();

    // Masukkan default terlebih dahulu jika ada di disk
    for (const evt of diskEvents) {
      combinedMap.set(evt.id, evt);
    }
    for (const evt of memoryEvents) {
      combinedMap.set(evt.id, evt);
    }
    for (const evt of eventsFromSettingsTable) {
      combinedMap.set(evt.id, evt);
    }
    for (const evt of eventsFromDbTable) {
      combinedMap.set(evt.id, evt);
    }

    // Pastikan default JACOS event selalu ada jika belum ada event sama sekali
    if (combinedMap.size === 0 || (!combinedMap.has(DEFAULT_JACOS_EVENT_ID) && !Array.from(combinedMap.values()).some((e) => e.slug === DEFAULT_JACOS_EVENT_SLUG))) {
      combinedMap.set(DEFAULT_JACOS_EVENT_ID, { ...DEFAULT_JACOS_EVENT });
    }

    const eventsList = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 5. Ambil seluruh pendaftar untuk kalkulasi live audience count
    let rawRegs: any[] = [];
    try {
      const { data } = await supabase.from('open_house_registrations').select('*');
      if (data) rawRegs = data;
    } catch {}

    const { memoryRegistrations } = await import('./memory-store');
    const allRegs = [...rawRegs];
    for (const mem of memoryRegistrations) {
      if (!allRegs.find((r) => r.id === mem.id || (r.ticket_code && r.ticket_code === mem.ticket_code))) {
        allRegs.push(mem);
      }
    }

    // 6. Hitung pendaftar per-event dengan deteksi akurat
    const countMap: Record<string, number> = {};
    for (const reg of allRegs) {
      const resolved = resolveLeadEvent(reg, eventsList);
      countMap[resolved.event_id] = (countMap[resolved.event_id] || 0) + 1;
    }

    const finalEvents = eventsList.map((evt) => ({
      ...evt,
      audience_count: countMap[evt.id] || 0,
    }));

    // Simpan ke disk & update memory store agar selalu sinkron
    saveEventsToDisk(finalEvents);
    memoryEvents.length = 0;
    memoryEvents.push(...finalEvents);

    return finalEvents;
  } catch (err) {
    console.error('[OpenHouse] getOpenHouseEvents error:', err);
    const diskFallback = loadEventsFromDisk();
    return diskFallback.length > 0 ? diskFallback : [{ ...DEFAULT_JACOS_EVENT }];
  }
}

/**
 * Get single event by slug (for public registration)
 */
export async function getOpenHouseEventBySlug(slug: string): Promise<OpenHouseEvent | null> {
  const allEvents = await getOpenHouseEvents();
  const matched = allEvents.find((evt) => evt.slug === slug && evt.is_active);
  if (matched) return matched;

  if (slug === DEFAULT_JACOS_EVENT_SLUG || slug === 'default') {
    return allEvents.find((e) => e.id === DEFAULT_JACOS_EVENT_ID) || DEFAULT_JACOS_EVENT;
  }

  return null;
}

/**
 * Get single event by id (for admin detail & management)
 */
export async function getOpenHouseEventById(id: string): Promise<OpenHouseEvent | null> {
  const allEvents = await getOpenHouseEvents();
  const matched = allEvents.find((evt) => evt.id === id || evt.slug === id);
  if (matched) return matched;

  if (id === DEFAULT_JACOS_EVENT_ID || id === DEFAULT_JACOS_EVENT_SLUG) {
    return allEvents.find((e) => e.id === DEFAULT_JACOS_EVENT_ID) || DEFAULT_JACOS_EVENT;
  }

  return null;
}

/**
 * Create a new Open House Event
 */
export async function createOpenHouseEvent(input: unknown): Promise<{
  success: boolean;
  event?: OpenHouseEvent;
  message?: string;
}> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir. Silakan login ulang.' };
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Data event tidak valid' };
  }

  const rawSlug = parsed.data.slug?.trim() || parsed.data.name;
  let finalSlug = slugify(rawSlug) || `open-house-${Date.now().toString(36)}`;

  // Ensure slug doesn't conflict
  const existingBySlug = await getOpenHouseEventBySlug(finalSlug);
  if (existingBySlug) {
    finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const newEventId = `evt_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  // Normalize dates to YYYY-MM-DD
  const normalizedSchedules = parsed.data.event_dates.map((s) => ({
    ...s,
    date: toIsoDateString(s.date) || s.date,
  }));

  const newEvent: OpenHouseEvent = {
    id: newEventId,
    name: parsed.data.name,
    slug: finalSlug,
    description: parsed.data.description,
    banner_url: parsed.data.banner_url ?? null,
    event_dates: normalizedSchedules,
    is_active: parsed.data.is_active ?? true,
    audience_count: 0,
    created_at: now,
    updated_at: now,
  };

  const supabase = createAdminClient();

  // 1. Simpan ke Supabase open_house_events (jika tabel ada)
  try {
    await supabase.from('open_house_events').insert({
      id: newEvent.id,
      name: newEvent.name,
      slug: newEvent.slug,
      description: newEvent.description,
      banner_url: newEvent.banner_url,
      event_dates: newEvent.event_dates,
      is_active: newEvent.is_active,
      created_at: now,
      updated_at: now,
    });
  } catch {}

  // 2. Simpan ke Supabase open_house_settings (Cloud persistence multi-row)
  try {
    await supabase.from('open_house_settings').upsert(
      {
        id: newEvent.id,
        event_title: newEvent.name,
        event_dates: JSON.stringify(newEvent.event_dates),
        inactive_message: JSON.stringify({
          slug: newEvent.slug,
          description: newEvent.description,
          banner_url: newEvent.banner_url,
          created_at: now,
        }),
        is_active: newEvent.is_active,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[OpenHouse] Supabase open_house_settings insert note:', err);
  }

  // 3. Simpan ke disk file lokal & memory cache
  const currentEvents = loadEventsFromDisk();
  const updatedEvents = [newEvent, ...currentEvents.filter((e) => e.id !== newEvent.id)];
  saveEventsToDisk(updatedEvents);

  memoryEvents.length = 0;
  memoryEvents.push(...updatedEvents);

  revalidatePath('/management/openhouse');
  revalidatePath('/openhouse');
  revalidatePath(`/openhouse/${newEvent.slug}`);

  return { success: true, event: newEvent };
}

/**
 * Update existing Open House Event
 */
export async function updateOpenHouseEvent(
  id: string,
  input: unknown
): Promise<{
  success: boolean;
  event?: OpenHouseEvent;
  message?: string;
}> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir.' };
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Data event tidak valid' };
  }

  let finalSlug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  if (!finalSlug) finalSlug = `open-house-${Date.now().toString(36)}`;

  const now = new Date().toISOString();

  // Normalize dates to YYYY-MM-DD
  const normalizedSchedules = parsed.data.event_dates.map((s) => ({
    ...s,
    date: toIsoDateString(s.date) || s.date,
  }));

  const currentEvents = loadEventsFromDisk();
  const existing = currentEvents.find((e) => e.id === id || e.slug === id);

  const updatedEvent: OpenHouseEvent = {
    id: existing?.id || id,
    name: parsed.data.name,
    slug: finalSlug,
    description: parsed.data.description,
    banner_url: parsed.data.banner_url ?? null,
    event_dates: normalizedSchedules,
    is_active: parsed.data.is_active ?? true,
    audience_count: existing?.audience_count || 0,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const supabase = createAdminClient();

  // 1. Update di Supabase open_house_events
  try {
    await supabase.from('open_house_events').update({
      name: updatedEvent.name,
      slug: updatedEvent.slug,
      description: updatedEvent.description,
      banner_url: updatedEvent.banner_url,
      event_dates: updatedEvent.event_dates,
      is_active: updatedEvent.is_active,
      updated_at: now,
    }).eq('id', updatedEvent.id);
  } catch {}

  // 2. Update di Supabase open_house_settings
  try {
    await supabase.from('open_house_settings').upsert(
      {
        id: updatedEvent.id,
        event_title: updatedEvent.name,
        event_dates: JSON.stringify(updatedEvent.event_dates),
        inactive_message: JSON.stringify({
          slug: updatedEvent.slug,
          description: updatedEvent.description,
          banner_url: updatedEvent.banner_url,
          created_at: updatedEvent.created_at,
        }),
        is_active: updatedEvent.is_active,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[OpenHouse] Supabase open_house_settings update note:', err);
  }

  // 3. Update disk file lokal & memory cache
  const nextEvents = currentEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
  if (!nextEvents.some((e) => e.id === updatedEvent.id)) {
    nextEvents.unshift(updatedEvent);
  }
  saveEventsToDisk(nextEvents);

  memoryEvents.length = 0;
  memoryEvents.push(...nextEvents);

  revalidatePath('/management/openhouse');
  revalidatePath(`/management/openhouse/${updatedEvent.id}`);
  revalidatePath('/openhouse');
  revalidatePath(`/openhouse/${updatedEvent.slug}`);

  return { success: true, event: updatedEvent };
}

/**
 * Toggle Event Active Status
 */
export async function toggleOpenHouseEvent(id: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir.' };
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();

  // 1. Supabase open_house_events
  try {
    await supabase.from('open_house_events').update({ is_active: isActive, updated_at: now }).eq('id', id);
  } catch {}

  // 2. Supabase open_house_settings
  try {
    await supabase.from('open_house_settings').update({ is_active: isActive, updated_at: now }).eq('id', id);
  } catch {}

  // 3. Disk file & memory
  const currentEvents = loadEventsFromDisk();
  const updatedEvents = currentEvents.map((e) => (e.id === id ? { ...e, is_active: isActive, updated_at: now } : e));
  saveEventsToDisk(updatedEvents);

  memoryEvents.length = 0;
  memoryEvents.push(...updatedEvents);

  revalidatePath('/management/openhouse');
  revalidatePath(`/management/openhouse/${id}`);
  revalidatePath('/openhouse');

  return { success: true };
}

/**
 * Delete Open House Event
 */
export async function deleteOpenHouseEvent(id: string): Promise<{ success: boolean; message?: string }> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir.' };
  }

  const supabase = createAdminClient();

  // 1. Supabase open_house_events
  try {
    await supabase.from('open_house_events').delete().eq('id', id);
  } catch {}

  // 2. Supabase open_house_settings
  try {
    await supabase.from('open_house_settings').delete().eq('id', id);
  } catch {}

  // 3. Disk file & memory
  const currentEvents = loadEventsFromDisk();
  const updatedEvents = currentEvents.filter((e) => e.id !== id);
  saveEventsToDisk(updatedEvents);

  memoryEvents.length = 0;
  memoryEvents.push(...updatedEvents);

  revalidatePath('/management/openhouse');
  revalidatePath('/openhouse');

  return { success: true };
}

/**
 * Upload Banner to Supabase Storage
 */
export async function uploadOpenHouseBanner(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { success: false, message: 'Format gambar harus JPG, PNG, atau WebP' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'Ukuran file banner maksimal 5 MB' };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `banner-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    const supabase = createAdminClient();
    const fileBuffer = await file.arrayBuffer();

    let { error } = await supabase.storage.from('openhouse-banners').upload(filename, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

    // Auto-create bucket jika belum ada
    if (error && error.message.toLowerCase().includes('bucket not found')) {
      console.warn('[OpenHouse Storage] Bucket not found. Auto-creating public bucket "openhouse-banners"...');
      await supabase.storage.createBucket('openhouse-banners', { public: true });

      const retry = await supabase.storage.from('openhouse-banners').upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });
      error = retry.error;
    }

    if (error) {
      console.warn('[OpenHouse Storage] Upload error:', error.message);
      return { success: false, message: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('openhouse-banners').getPublicUrl(filename);

    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('[OpenHouse] upload banner error:', err);
    return { success: false, message: 'Gagal mengunggah banner event.' };
  }
}
