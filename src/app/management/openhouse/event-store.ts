export interface OpenHouseSchedule {
  date: string;
  start_time: string;
  end_time: string;
}

export interface OpenHouseEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  banner_url: string | null;
  event_dates: OpenHouseSchedule[];
  is_active: boolean;
  audience_count?: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_JACOS_EVENT_ID = 'jacos-open-house-2026-default';
export const DEFAULT_JACOS_EVENT_SLUG = 'jacos-open-house-2026';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const DEFAULT_JACOS_EVENT: OpenHouseEvent = {
  id: DEFAULT_JACOS_EVENT_ID,
  slug: DEFAULT_JACOS_EVENT_SLUG,
  name: 'JACOS Open House 2026',
  description:
    'Temukan pengalaman belajar trilingual dan pembentukan karakter islami berstandar internasional di Jakarta Cosmopolite Islamic School. Ikuti School Tour, Trial Class, dan sesi konsultasi bersama pimpinan akademik.',
  banner_url: null,
  event_dates: [
    { date: '2026-08-29', start_time: '08:30', end_time: '10:00' },
    { date: '2026-08-30', start_time: '10:30', end_time: '12:00' },
  ],
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-09-14T00:00:00.000Z',
};

const store = globalThis as unknown as { openHouseEvents?: OpenHouseEvent[] };
if (!store.openHouseEvents || store.openHouseEvents.length === 0) {
  store.openHouseEvents = [{ ...DEFAULT_JACOS_EVENT }];
}

export const memoryEvents = store.openHouseEvents;

const INDO_MONTHS_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  agu: '08',
  sep: '09',
  oct: '10',
  okt: '10',
  nov: '11',
  dec: '12',
  des: '12',
};

/**
 * Converts date from either text ("Sabtu, 29 Agustus 2026") or ISO into "YYYY-MM-DD"
 */
export function toIsoDateString(val?: string | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Try extracting day, month, year from "Sabtu, 29 Agustus 2026"
  const match = trimmed.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthKey = match[2].toLowerCase();
    const month = INDO_MONTHS_MAP[monthKey] || '01';
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  // Try native date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {}
  return trimmed;
}

/**
 * Formats "YYYY-MM-DD" or standard date into "Hari, DD Bulan YYYY"
 */
export const formatIndoDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const iso = toIsoDateString(dateStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${days[dateObj.getDay()]}, ${d} ${months[m - 1]} ${y}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export function embedEventTag(
  eventId?: string | null,
  eventSlug?: string | null,
  notes?: string | null
): string | null {
  if (!eventId && !eventSlug) return notes || null;
  const clean = notes ? notes.replace(/\[EVENT:[^\]]+\]/g, '').replace(/\[EVENT_ID:[^\]]+\]/g, '').trim() : '';
  const tag = `[EVENT:${eventId || ''}|${eventSlug || ''}]`;
  return clean ? `${tag} ${clean}` : tag;
}

export function parseEventTag(notes?: string | null): {
  eventId: string | null;
  eventSlug: string | null;
  cleanNotes: string | null;
} {
  if (!notes) {
    return { eventId: null, eventSlug: null, cleanNotes: null };
  }
  const match = notes.match(/\[EVENT:([^\|\]]*)(?:\|([^\]]*))?\]/);
  if (!match) {
    const matchOld = notes.match(/\[EVENT_ID:([^\]]+)\]/);
    if (matchOld) {
      const clean = notes.replace(/\[EVENT_ID:[^\]]+\]/g, '').trim();
      return { eventId: matchOld[1] || null, eventSlug: null, cleanNotes: clean || null };
    }
    return { eventId: null, eventSlug: null, cleanNotes: notes };
  }
  const eventId = match[1] ? match[1].trim() : null;
  const eventSlug = match[2] ? match[2].trim() : null;
  const clean = notes.replace(/\[EVENT:[^\]]+\]/g, '').trim();
  return {
    eventId: eventId || null,
    eventSlug: eventSlug || null,
    cleanNotes: clean || null,
  };
}

export function matchEventBySchedule(
  attendanceDate?: string | null,
  events: OpenHouseEvent[] = memoryEvents
): OpenHouseEvent | null {
  if (!attendanceDate) return null;
  const target = attendanceDate.toLowerCase().trim();
  const targetIso = toIsoDateString(target);

  // 1. Custom events first
  const customEvents = events.filter((e) => e.id !== DEFAULT_JACOS_EVENT_ID && e.slug !== DEFAULT_JACOS_EVENT_SLUG);
  for (const evt of customEvents) {
    for (const sch of evt.event_dates) {
      if (!sch.date) continue;
      const rawDate = sch.date.toLowerCase().trim();
      const schIso = toIsoDateString(sch.date);
      const formatted = formatIndoDate(sch.date).toLowerCase().trim();
      const formattedWithoutDay = formatted.replace(/^[a-z]+,\s*/i, '');
      if (
        (targetIso && schIso && targetIso === schIso) ||
        rawDate === target ||
        formatted === target ||
        target.includes(rawDate) ||
        (formattedWithoutDay && target.includes(formattedWithoutDay))
      ) {
        return evt;
      }
    }
  }

  // 2. Default event
  const defaultEvt = events.find((e) => e.id === DEFAULT_JACOS_EVENT_ID || e.slug === DEFAULT_JACOS_EVENT_SLUG) || DEFAULT_JACOS_EVENT;
  for (const sch of defaultEvt.event_dates) {
    if (!sch.date) continue;
    const rawDate = sch.date.toLowerCase().trim();
    const schIso = toIsoDateString(sch.date);
    const formatted = formatIndoDate(sch.date).toLowerCase().trim();
    if (
      (targetIso && schIso && targetIso === schIso) ||
      rawDate === target ||
      formatted === target ||
      target.includes('29 agustus') ||
      target.includes('30 agustus')
    ) {
      return defaultEvt;
    }
  }

  return null;
}

export function resolveLeadEvent(
  lead: {
    event_id?: string | null;
    event_slug?: string | null;
    attendance_date?: string | null;
    attendance_session?: string | null;
    follow_up_notes?: string | null;
  },
  events: OpenHouseEvent[] = memoryEvents
): {
  event_id: string;
  event_slug: string;
  cleanNotes: string | null;
} {
  // A. Valid explicit event_id
  if (lead.event_id && lead.event_id !== '') {
    const matchedEvt = events.find((e) => e.id === lead.event_id || e.slug === lead.event_id);
    const { cleanNotes } = parseEventTag(lead.follow_up_notes);
    return {
      event_id: lead.event_id,
      event_slug: matchedEvt?.slug || lead.event_slug || DEFAULT_JACOS_EVENT_SLUG,
      cleanNotes: cleanNotes ?? lead.follow_up_notes ?? null,
    };
  }

  // B. Parse follow_up_notes tag
  const parsed = parseEventTag(lead.follow_up_notes);
  if (parsed.eventId) {
    const matchedEvt = events.find((e) => e.id === parsed.eventId || e.slug === parsed.eventId);
    return {
      event_id: parsed.eventId,
      event_slug: parsed.eventSlug || matchedEvt?.slug || DEFAULT_JACOS_EVENT_SLUG,
      cleanNotes: parsed.cleanNotes,
    };
  }

  // C. Match by schedule attendance_date
  const matchedBySch = matchEventBySchedule(lead.attendance_date, events);
  if (matchedBySch) {
    return {
      event_id: matchedBySch.id,
      event_slug: matchedBySch.slug,
      cleanNotes: parsed.cleanNotes,
    };
  }

  // D. Fallback to default event
  return {
    event_id: DEFAULT_JACOS_EVENT_ID,
    event_slug: DEFAULT_JACOS_EVENT_SLUG,
    cleanNotes: parsed.cleanNotes,
  };
}
