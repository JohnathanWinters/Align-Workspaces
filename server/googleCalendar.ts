import { google } from 'googleapis';
import type { HostCalendarConnection } from '@shared/schema';

// ── Admin Calendar Client (existing) ────────────────────────────────

function getCalendarClient() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar credentials not configured (GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN)');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface BookingEventParams {
  spaceName: string;
  guestName: string;
  guestEmail?: string;
  hostEmail?: string;
  hostName?: string;
  bookingDate: string;
  bookingStartTime: string;
  bookingHours: number;
  spaceAddress?: string;
  bookingId: string;
}

export async function createBookingCalendarEvent(params: BookingEventParams): Promise<string | null> {
  try {
    const calendar = getCalendarClient();

    const [startH, startM] = params.bookingStartTime.split(":").map(Number);
    const startDate = new Date(`${params.bookingDate}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
    const endDate = new Date(startDate.getTime() + params.bookingHours * 60 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    const startDateTime = toLocalISO(startDate);
    const endDateTime = toLocalISO(endDate);

    const attendees: { email: string }[] = [];
    if (params.guestEmail) attendees.push({ email: params.guestEmail });
    if (params.hostEmail && params.hostEmail !== params.guestEmail) attendees.push({ email: params.hostEmail });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${params.spaceName} — ${params.guestName}`,
        description: [
          `Space booking via Align`,
          `Guest: ${params.guestName}${params.guestEmail ? ` (${params.guestEmail})` : ""}`,
          `Duration: ${params.bookingHours} hour${params.bookingHours > 1 ? "s" : ""}`,
          `Booking ID: ${params.bookingId}`,
        ].join("\n"),
        location: params.spaceAddress || undefined,
        start: { dateTime: startDateTime, timeZone: 'America/New_York' },
        end: { dateTime: endDateTime, timeZone: 'America/New_York' },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });

    console.log(`Google Calendar event created: ${event.data.id}`);
    return event.data.id || null;
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    return null;
  }
}

interface ShootEventParams {
  shootTitle: string;
  clientName: string;
  clientEmail?: string;
  shootDate: string;       // "YYYY-MM-DD"
  shootTime?: string;      // "HH:MM"
  durationHours: number;
  location?: string;
  notes?: string;
  shootId: string;
}

export async function createShootCalendarEvent(params: ShootEventParams): Promise<string> {
  const calendar = getCalendarClient();
  const hours = params.durationHours || 2;

  let startDateTime: string;
  let endDateTime: string;
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  if (params.shootTime) {
    const [startH, startM] = params.shootTime.split(":").map(Number);
    const startDate = new Date(`${params.shootDate}T${pad(startH)}:${pad(startM)}:00`);
    const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    startDateTime = toLocalISO(startDate);
    endDateTime = toLocalISO(endDate);
  } else {
    // Default to 10am-12pm if no time specified
    startDateTime = `${params.shootDate}T10:00:00`;
    const startDate = new Date(`${params.shootDate}T10:00:00`);
    const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    endDateTime = toLocalISO(endDate);
  }

  const attendees: { email: string }[] = [];
  if (params.clientEmail) attendees.push({ email: params.clientEmail });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `${params.shootTitle} — ${params.clientName}`,
      description: [
        `Portrait session via Align`,
        `Client: ${params.clientName}${params.clientEmail ? ` (${params.clientEmail})` : ""}`,
        `Duration: ${hours} hour${hours > 1 ? "s" : ""}`,
        params.notes ? `Notes: ${params.notes}` : null,
        `Shoot ID: ${params.shootId}`,
      ].filter(Boolean).join("\n"),
      location: params.location || undefined,
      start: { dateTime: startDateTime, timeZone: 'America/New_York' },
      end: { dateTime: endDateTime, timeZone: 'America/New_York' },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    },
  });

  if (!event.data.id) throw new Error("Google Calendar returned no event ID");
  console.log(`Google Calendar shoot event created: ${event.data.id}`);
  return event.data.id;
}

export async function deleteBookingCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: 'primary', eventId });
    console.log(`Google Calendar event deleted: ${eventId}`);
    return true;
  } catch (err) {
    console.error("Failed to delete Google Calendar event:", err);
    return false;
  }
}

export function generateAddToCalendarUrl(params: BookingEventParams): string {
  const [startH, startM] = params.bookingStartTime.split(":").map(Number);
  const startDate = new Date(`${params.bookingDate}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
  const endDate = new Date(startDate.getTime() + params.bookingHours * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toGCalDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const startStr = toGCalDate(startDate);
  const endStr = toGCalDate(endDate);

  const details = [
    `Space booking via Align`,
    `Guest: ${params.guestName}${params.guestEmail ? ` (${params.guestEmail})` : ""}`,
    params.hostName ? `Host: ${params.hostName}` : null,
    `Duration: ${params.bookingHours} hour${params.bookingHours > 1 ? "s" : ""}`,
    `Booking ID: ${params.bookingId}`,
    ``,
    `Manage booking: https://alignworkspaces.com/portal`,
  ].filter(Boolean).join("\n");

  const urlParams = new URLSearchParams({
    action: "TEMPLATE",
    text: `${params.spaceName} — Booking`,
    dates: `${startStr}/${endStr}`,
    details,
    ctz: "America/New_York",
  });

  if (params.spaceAddress) {
    urlParams.set("location", params.spaceAddress);
  }

  const attendees = [params.guestEmail, params.hostEmail].filter(Boolean);
  if (attendees.length > 0) {
    urlParams.set("add", attendees.join(","));
  }

  return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}

// ── Admin Meeting Calendar ──────────────────────────────────────────

export async function createMeetingCalendarEvent(params: {
  adminName: string;
  adminEmail?: string;
  guestName: string;
  guestEmail: string;
  meetingDate: string;
  meetingStartTime: string;
  durationMinutes: number;
  title: string;
  location?: string;
  notes?: string;
  meetingId: string;
}): Promise<string | null> {
  try {
    const calendar = getCalendarClient();
    const [startH, startM] = params.meetingStartTime.split(":").map(Number);
    const startDate = new Date(`${params.meetingDate}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
    const endDate = new Date(startDate.getTime() + params.durationMinutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    const attendees: { email: string }[] = [{ email: params.guestEmail }];
    if (params.adminEmail && params.adminEmail !== params.guestEmail) attendees.push({ email: params.adminEmail });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${params.title} — ${params.guestName}`,
        description: [
          `Meeting booked via Align`,
          `Guest: ${params.guestName} (${params.guestEmail})`,
          `Duration: ${params.durationMinutes} minutes`,
          params.notes ? `Notes: ${params.notes}` : null,
        ].filter(Boolean).join("\n"),
        location: params.location || undefined,
        start: { dateTime: toLocalISO(startDate), timeZone: 'America/New_York' },
        end: { dateTime: toLocalISO(endDate), timeZone: 'America/New_York' },
        attendees,
        reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 30 }] },
      },
    });
    console.log(`Meeting calendar event created: ${event.data.id}`);
    return event.data.id || null;
  } catch (err) {
    console.error("Failed to create meeting calendar event:", err);
    return null;
  }
}

export async function fetchAdminCalendarEvents(dateMin: string, dateMax: string): Promise<{ start: string; end: string }[]> {
  try {
    const calendar = getCalendarClient();
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(`${dateMin}T00:00:00`).toISOString(),
      timeMax: new Date(`${dateMax}T23:59:59`).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });
    const pad = (n: number) => String(n).padStart(2, "0");
    return (res.data.items || []).filter(e => e.start?.dateTime).map(e => {
      const s = new Date(e.start!.dateTime!);
      const en = new Date(e.end!.dateTime!);
      return { start: `${pad(s.getHours())}:${pad(s.getMinutes())}`, end: `${pad(en.getHours())}:${pad(en.getMinutes())}` };
    });
  } catch (err) {
    console.error("Failed to fetch admin calendar events:", err);
    return [];
  }
}

// ── Host Calendar OAuth (per-host) ──────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://alignworkspaces.com';

function getHostOAuth2Client() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google Calendar credentials not configured');
  const callbackUrl = `${SITE_URL}/api/calendar/google/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl);
}

export function generateHostCalendarAuthUrl(hostUserId: string): string {
  const oauth2Client = getHostOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state: hostUserId,
  });
}

export async function exchangeHostCalendarCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const oauth2Client = getHostOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) throw new Error('No refresh token received — user may have already authorized');
  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
  };
}

function getHostCalendarClient(connection: HostCalendarConnection) {
  const oauth2Client = getHostOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiresAt?.getTime(),
  });
  return { calendar: google.calendar({ version: 'v3', auth: oauth2Client }), oauth2Client };
}

export interface ExternalBlock {
  externalEventId: string;
  title: string;
  blockDate: string;       // YYYY-MM-DD
  blockStartTime: string;  // HH:MM
  blockEndTime: string;    // HH:MM
  allDay: boolean;
}

export async function fetchHostCalendarEvents(
  connection: HostCalendarConnection,
  timeMin: Date,
  timeMax: Date,
): Promise<{ blocks: ExternalBlock[]; newAccessToken?: string; newExpiresAt?: Date }> {
  const { calendar, oauth2Client } = getHostCalendarClient(connection);
  const blocks: ExternalBlock[] = [];

  const res = await calendar.events.list({
    calendarId: connection.calendarId || 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  for (const event of res.data.items || []) {
    if (event.status === 'cancelled') continue;
    // Skip events created by Align (avoid feedback loop)
    if (event.description?.includes('Booking ID:') && event.description?.includes('Align')) continue;

    const start = event.start;
    const end = event.end;
    if (!start || !end) continue;

    if (start.date && end.date) {
      // All-day event — block each day
      const startDate = new Date(start.date + 'T12:00:00');
      const endDate = new Date(end.date + 'T12:00:00');
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        blocks.push({
          externalEventId: event.id || '',
          title: event.summary || 'Busy',
          blockDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          blockStartTime: '00:00',
          blockEndTime: '23:59',
          allDay: true,
        });
      }
    } else if (start.dateTime && end.dateTime) {
      const s = new Date(start.dateTime);
      const e = new Date(end.dateTime);
      blocks.push({
        externalEventId: event.id || '',
        title: event.summary || 'Busy',
        blockDate: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
        blockStartTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
        blockEndTime: `${pad(e.getHours())}:${pad(e.getMinutes())}`,
        allDay: false,
      });
    }
  }

  // Check if token was refreshed
  const creds = oauth2Client.credentials;
  const tokenRefreshed = creds.access_token !== connection.accessToken;

  return {
    blocks,
    ...(tokenRefreshed ? {
      newAccessToken: creds.access_token || undefined,
      newExpiresAt: creds.expiry_date ? new Date(creds.expiry_date) : undefined,
    } : {}),
  };
}

export async function createHostBookingEvent(
  connection: HostCalendarConnection,
  params: BookingEventParams,
): Promise<string | null> {
  try {
    const { calendar } = getHostCalendarClient(connection);
    const [startH, startM] = params.bookingStartTime.split(":").map(Number);
    const startDate = new Date(`${params.bookingDate}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
    const endDate = new Date(startDate.getTime() + params.bookingHours * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    const event = await calendar.events.insert({
      calendarId: connection.calendarId || 'primary',
      requestBody: {
        summary: `${params.spaceName} — ${params.guestName}`,
        description: `Space booking via Align\nGuest: ${params.guestName}\nDuration: ${params.bookingHours}hr\nBooking ID: ${params.bookingId}`,
        location: params.spaceAddress || undefined,
        start: { dateTime: toLocalISO(startDate), timeZone: 'America/New_York' },
        end: { dateTime: toLocalISO(endDate), timeZone: 'America/New_York' },
      },
    });
    return event.data.id || null;
  } catch (err) {
    console.error("Failed to create host calendar event:", err);
    return null;
  }
}

export async function deleteHostBookingEvent(connection: HostCalendarConnection, eventId: string): Promise<boolean> {
  try {
    const { calendar } = getHostCalendarClient(connection);
    await calendar.events.delete({ calendarId: connection.calendarId || 'primary', eventId });
    return true;
  } catch (err) {
    console.error("Failed to delete host calendar event:", err);
    return false;
  }
}
