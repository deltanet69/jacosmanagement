import fs from 'fs';
import path from 'path';
import { OpenHouseEvent, DEFAULT_JACOS_EVENT } from './event-store';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'openhouse-events-db.json');

export function loadEventsFromDisk(): OpenHouseEvent[] {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[OpenHouse Store] Failed to read disk file backup:', err);
  }
  return [{ ...DEFAULT_JACOS_EVENT }];
}

export function saveEventsToDisk(events: OpenHouseEvent[]): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OpenHouse Store] Failed to write disk file backup:', err);
  }
}
