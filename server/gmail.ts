// Gmail integration via Replit connector (google-mail)
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface BookingEmailData {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  notes?: string | null;
  environment: string;
  brandMessage: string;
  emotionalImpact: string;
  shootIntent: string;
  estimatedMin: number;
  estimatedMax: number;
}

export async function sendBookingNotification(data: BookingEmailData) {
  const gmail = await getUncachableGmailClient();

  const subject = `New Booking: ${data.name} — ${data.preferredDate === "TBD" ? "Inquiry" : data.preferredDate}`;

  const body = [
    `New booking submission from Brand Vision Studio`,
    ``,
    `--- Client Information ---`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Preferred Date: ${data.preferredDate}`,
    ``,
    `--- Selections ---`,
    `Environment: ${data.environment}`,
    `Brand Message: ${data.brandMessage}`,
    `Emotional Impact: ${data.emotionalImpact}`,
    `Shoot Intent: ${data.shootIntent}`,
    ``,
    `--- Estimated Investment ---`,
    `$${data.estimatedMin} – $${data.estimatedMax}`,
    ``,
    data.notes ? `--- Notes ---\n${data.notes}` : '',
  ].join('\n');

  const to = 'ArmandoRamirezRomero89@gmail.com';

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}
