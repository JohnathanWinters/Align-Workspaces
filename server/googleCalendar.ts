// Google Calendar integration (Replit connector: google-calendar)
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface BookingEventParams {
  spaceName: string;
  guestName: string;
  guestEmail?: string;
  hostEmail?: string;
  bookingDate: string;
  bookingStartTime: string;
  bookingHours: number;
  spaceAddress?: string;
  bookingId: string;
}

export async function createBookingCalendarEvent(params: BookingEventParams): Promise<string | null> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();

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
        summary: `📸 ${params.spaceName} — ${params.guestName}`,
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

export async function deleteBookingCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
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

  const urlParams = new URLSearchParams({
    action: "TEMPLATE",
    text: `📸 ${params.spaceName} — Booking`,
    dates: `${startStr}/${endStr}`,
    details: `Space booking via Align\nGuest: ${params.guestName}\nDuration: ${params.bookingHours} hour${params.bookingHours > 1 ? "s" : ""}`,
    ctz: "America/New_York",
  });

  if (params.spaceAddress) {
    urlParams.set("location", params.spaceAddress);
  }

  return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}
