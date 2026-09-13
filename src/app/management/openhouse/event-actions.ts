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
  type OpenHouseEvent,
  type OpenHouseSchedule,
} from './event-store';

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
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    banner_url: row.banner_url ? String(row.banner_url) : null,
    event_dates: Array.isArray(row.event_dates) ? (row.event_dates as OpenHouseSchedule[]) : [],
    is_active: Boolean(row.is_active),
    audience_count: audienceCount,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

/**
 * Get all Open House events with live audience counts
 */
export async function getOpenHouseEvents(): Promise<OpenHouseEvent[]> {
  try {
    const supabase = createAdminClient();

    // 1. Ambil event dari Supabase jika ada
    let eventsData: any[] | null = null;
    try {
      const { data, error } = await supabase.from('open_house_events').select('*').order('created_at', { ascending: false });
      if (!error && data) eventsData = data;
    } catch {}

    // 2. Ambil pendaftar dari Supabase
    let rawRegs: any[] = [];
    try {
      const { data } = await supabase.from('open_house_registrations').select('*');
      if (data) rawRegs = data;
    } catch {}

    // 3. Gabungkan pendaftar memori
    const { memoryRegistrations } = await import('./memory-store');
    const allRegs = [...rawRegs];
    for (const mem of memoryRegistrations) {
      if (!allRegs.find((r) => r.id === mem.id || (r.ticket_code && r.ticket_code === mem.ticket_code))) {
        allRegs.push(mem);
      }
    }

    // 4. Susun daftar events
    const eventsList: OpenHouseEvent[] = (eventsData && eventsData.length > 0)
      ? eventsData.map((row) => normalizeEvent(row))
      : [...memoryEvents];

    for (const mem of memoryEvents) {
      if (!eventsList.find((e) => e.id === mem.id || e.slug === mem.slug)) {
        eventsList.push(mem);
      }
    }

    // 5. Hitung pendaftar per-event dengan deteksi akurat
    const countMap: Record<string, number> = {};
    for (const reg of allRegs) {
      const resolved = resolveLeadEvent(reg, eventsList);
      countMap[resolved.event_id] = (countMap[resolved.event_id] || 0) + 1;
    }

    return eventsList.map((evt) => ({
      ...evt,
      audience_count: countMap[evt.id] || 0,
    }));
  } catch (err) {
    console.error('[OpenHouse] getOpenHouseEvents error:', err);
    return memoryEvents;
  }
}

/**
 * Get single event by slug (for public registration)
 */
export async function getOpenHouseEventBySlug(slug: string): Promise<OpenHouseEvent | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('open_house_events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      return normalizeEvent(data);
    }
  } catch {
    // Fallback to memory
  }

  const mem = memoryEvents.find((evt) => evt.slug === slug && evt.is_active);
  if (mem) return mem;

  if (slug === DEFAULT_JACOS_EVENT_SLUG || slug === 'default') {
    return DEFAULT_JACOS_EVENT;
  }

  return null;
}

/**
 * Get single event by id (for admin detail & management)
 */
export async function getOpenHouseEventById(id: string): Promise<OpenHouseEvent | null> {
  try {
    const supabase = createAdminClient();
    let evt: OpenHouseEvent | null = null;

    try {
      const { data, error } = await supabase.from('open_house_events').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        evt = normalizeEvent(data);
      }
    } catch {}

    if (!evt) {
      const mem = memoryEvents.find((item) => item.id === id || item.slug === id);
      if (mem) {
        evt = { ...mem };
      } else if (id === DEFAULT_JACOS_EVENT_ID || id === DEFAULT_JACOS_EVENT_SLUG) {
        evt = { ...DEFAULT_JACOS_EVENT };
      }
    }

    if (!evt) return null;

    // Hitung pendaftar terdaftar untuk event ini
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

    const count = allRegs.filter((r) => {
      const resolved = resolveLeadEvent(r, memoryEvents);
      return resolved.event_id === evt!.id || resolved.event_slug === evt!.slug;
    }).length;

    return { ...evt, audience_count: count };
  } catch {
    const mem = memoryEvents.find((item) => item.id === id || item.slug === id);
    if (mem) return mem;
    if (id === DEFAULT_JACOS_EVENT_ID) return DEFAULT_JACOS_EVENT;
    return null;
  }
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

  const now = new Date().toISOString();
  const eventPayload = {
    name: parsed.data.name,
    slug: finalSlug,
    description: parsed.data.description,
    banner_url: parsed.data.banner_url ?? null,
    event_dates: parsed.data.event_dates,
    is_active: parsed.data.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('open_house_events').insert(eventPayload).select().single();

    if (!error && data) {
      const saved = normalizeEvent(data, 0);
      revalidatePath('/management/openhouse');
      revalidatePath('/openhouse');
      return { success: true, event: saved };
    }
  } catch (err) {
    console.warn('[OpenHouse] Supabase insert event note (fallback):', err);
  }

  // Memory fallback
  const fallback: OpenHouseEvent = {
    ...eventPayload,
    id: `evt-${Date.now()}`,
    audience_count: 0,
  };
  memoryEvents.unshift(fallback);

  revalidatePath('/management/openhouse');
  revalidatePath('/openhouse');
  return { success: true, event: fallback };
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
  const updates = {
    name: parsed.data.name,
    slug: finalSlug,
    description: parsed.data.description,
    banner_url: parsed.data.banner_url ?? null,
    event_dates: parsed.data.event_dates,
    is_active: parsed.data.is_active ?? true,
    updated_at: now,
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('open_house_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const saved = normalizeEvent(data);
      revalidatePath('/management/openhouse');
      revalidatePath(`/management/openhouse/${id}`);
      revalidatePath('/openhouse');
      revalidatePath(`/openhouse/${saved.slug}`);
      return { success: true, event: saved };
    }
  } catch (err) {
    console.warn('[OpenHouse] Supabase update event error:', err);
  }

  const index = memoryEvents.findIndex((item) => item.id === id);
  if (index >= 0) {
    memoryEvents[index] = { ...memoryEvents[index], ...updates };
    revalidatePath('/management/openhouse');
    revalidatePath(`/management/openhouse/${id}`);
    revalidatePath('/openhouse');
    return { success: true, event: memoryEvents[index] };
  }

  return { success: false, message: 'Event tidak ditemukan' };
}

/**
 * Toggle Event Active Status
 */
export async function toggleOpenHouseEvent(id: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  if (!(await isAuthenticatedAdmin())) {
    return { success: false, message: 'Sesi login admin telah berakhir.' };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('open_house_events')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      revalidatePath('/management/openhouse');
      revalidatePath(`/management/openhouse/${id}`);
      revalidatePath('/openhouse');
      return { success: true };
    }
  } catch {
    // fallback
  }

  const event = memoryEvents.find((item) => item.id === id);
  if (!event) return { success: false, message: 'Event tidak ditemukan' };
  event.is_active = isActive;
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

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('open_house_events').delete().eq('id', id);
    if (!error) {
      revalidatePath('/management/openhouse');
      revalidatePath('/openhouse');
      return { success: true };
    }
  } catch {
    // fallback
  }

  const index = memoryEvents.findIndex((item) => item.id === id);
  if (index >= 0) {
    memoryEvents.splice(index, 1);
    revalidatePath('/management/openhouse');
    revalidatePath('/openhouse');
    return { success: true };
  }

  return { success: false, message: 'Event tidak ditemukan' };
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

    // Auto-create bucket jika belum ada (Bucket not found)
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
