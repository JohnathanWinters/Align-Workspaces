import { google } from 'googleapis';

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
