import ical from 'node-ical';
import { storage } from './storage';
import type { ExternalBlock } from './googleCalendar';

const FETCH_TIMEOUT = 10_000; // 10 seconds
const MAX_BODY_SIZE = 1_048_576; // 1MB
const LOOKAHEAD_DAYS = 60;

/**
 * Fetch and parse an external iCal feed URL into blocked time slots.
 */
export async function fetchAndParseIcalFeed(feedUrl: string): Promise<ExternalBlock[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AlignWorkspaces/1.0 (Calendar Sync)' },
    });

    if (!res.ok) throw new Error(`Feed returned ${res.status}`);

    const text = await res.text();
    if (text.length > MAX_BODY_SIZE) throw new Error('Feed exceeds 1MB limit');

    const events = ical.sync.parseICS(text);
    const blocks: ExternalBlock[] = [];
    const now = new Date();
    const maxDate = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');

    for (const key of Object.keys(events)) {
      const event = events[key] as any;
      if (!event || event.type !== 'VEVENT') continue;

      const start = event.start ? new Date(event.start) : null;
      const end = event.end ? new Date(event.end) : null;
      if (!start || !end) continue;
      if (end < now || start > maxDate) continue;

      const isAllDay = !event.start?.getHours;
      const title = (event.summary as string) || 'Busy';
      const uid = (event.uid as string) || key;

      if (isAllDay || (end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000)) {
        // Multi-day or all-day event — block each day
        const cursor = new Date(start);
        cursor.setHours(12, 0, 0, 0);
        const endDay = new Date(end);
        endDay.setHours(12, 0, 0, 0);
        while (cursor < endDay) {
          if (cursor >= now && cursor <= maxDate) {
            blocks.push({
              externalEventId: uid,
              title,
              blockDate: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`,
              blockStartTime: '00:00',
              blockEndTime: '23:59',
              allDay: true,
            });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        blocks.push({
          externalEventId: uid,
          title,
          blockDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
          blockStartTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
          blockEndTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
          allDay: false,
        });
      }
    }

    return blocks;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate a single ICS event string for a booking.
 */
export function generateIcsEvent(params: {
  uid: string;
  summary: string;
  description: string;
  dtstart: Date;
  dtend: Date;
  location?: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIcalDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const lines = [
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${toIcalDate(new Date())}`,
    `DTSTART;TZID=America/New_York:${toIcalDate(params.dtstart)}`,
    `DTEND;TZID=America/New_York:${toIcalDate(params.dtend)}`,
    `SUMMARY:${escapeIcal(params.summary)}`,
    `DESCRIPTION:${escapeIcal(params.description)}`,
  ];
  if (params.location) lines.push(`LOCATION:${escapeIcal(params.location)}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

/**
 * Generate a full ICS feed for all confirmed bookings on a space.
 */
export async function generateIcsExportFeed(spaceId: string): Promise<string> {
  const space = await storage.getSpaceById(spaceId);
  const bookings = await storage.getSpaceBookingsBySpace(spaceId);
  const confirmed = bookings.filter(b =>
    b.bookingDate && b.bookingStartTime && b.bookingHours &&
    (b.status === 'approved' || b.status === 'confirmed' || b.status === 'checked_in')
  );

  const events = confirmed.map(b => {
    const [h, m] = b.bookingStartTime!.split(':').map(Number);
    const start = new Date(`${b.bookingDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    const end = new Date(start.getTime() + (b.bookingHours || 1) * 60 * 60 * 1000);
    return generateIcsEvent({
      uid: `booking-${b.id}@alignworkspaces.com`,
      summary: `${space?.name || 'Space'} — ${b.userName || 'Booking'}`,
      description: `Booking via Align Workspaces\\nGuest: ${b.userName || 'Guest'}\\nDuration: ${b.bookingHours}hr`,
      dtstart: start,
      dtend: end,
      location: space?.address || undefined,
    });
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Align Workspaces//Calendar//EN`,
    `X-WR-CALNAME:${space?.name || 'Align Bookings'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
