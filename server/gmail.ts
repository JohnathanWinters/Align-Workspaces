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
    `New booking submission from Align`,
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

  const to = 'armando@alignworkspaces.com';

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

interface HelpRequestData {
  clientName: string;
  clientEmail: string;
  message: string;
}

export async function sendHelpRequest(data: HelpRequestData) {
  const gmail = await getUncachableGmailClient();

  const subject = `Client Help Request — ${data.clientName}`;

  const body = [
    `A client has submitted a help request from the Client Portal.`,
    ``,
    `--- Client ---`,
    `Name: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    ``,
    `--- Message ---`,
    data.message,
  ].join('\n');

  const to = 'armando@alignworkspaces.com';

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

interface CollaborateMessageData {
  clientName: string;
  clientEmail: string;
  message: string;
  environment?: string;
  brandMessage?: string;
  emotionalImpact?: string;
  shootIntent?: string;
}

export async function sendCollaborateMessage(data: CollaborateMessageData) {
  const gmail = await getUncachableGmailClient();

  const subject = `New Collaboration Request — ${data.clientName}`;

  const selections = [
    data.environment ? `Environment: ${data.environment}` : null,
    data.brandMessage ? `Brand Message: ${data.brandMessage}` : null,
    data.emotionalImpact ? `Emotional Impact: ${data.emotionalImpact}` : null,
    data.shootIntent ? `Shoot Intent: ${data.shootIntent}` : null,
  ].filter(Boolean);

  const body = [
    `A new client has submitted a collaboration request from Align.`,
    ``,
    `--- Client ---`,
    `Name: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    ``,
    ...(selections.length > 0 ? [`--- Concept Selections ---`, ...selections, ``] : []),
    `--- Message ---`,
    data.message,
  ].join('\n');

  const to = 'armando@alignworkspaces.com';

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

interface InvoiceLineItem {
  description: string;
  amount: number;
}

interface InvoiceEmailData {
  clientName: string;
  clientEmail: string;
  shootTitle: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  notes?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  const gmail = await getUncachableGmailClient();

  const subject = `Align Portrait Design — Invoice for ${data.shootTitle}`;

  const itemRows = data.lineItems
    .map((item) => `  ${item.description}: $${item.amount.toFixed(2)}`)
    .join('\n');

  const body = [
    `Hi ${data.clientName},`,
    ``,
    `Thank you for choosing Align Portrait Design. Below is the invoice for your session.`,
    ``,
    `——————————————————`,
    `Session: ${data.shootTitle}`,
    ``,
    `Itemization:`,
    itemRows,
    ``,
    `Total: $${data.totalAmount.toFixed(2)}`,
    `——————————————————`,
    ``,
    data.notes ? `Note: ${data.notes}\n` : '',
    `If you have any questions about this invoice, please reply to this email.`,
    ``,
    `Best regards,`,
    `Align Portrait Design`,
  ].join('\n');

  const rawMessage = [
    `To: ${data.clientEmail}`,
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

interface EditRequestNotificationData {
  clientName: string;
  clientEmail: string;
  photoCount: number;
  tokensUsed: number;
  notes?: string;
}

export async function sendEditRequestNotification(data: EditRequestNotificationData) {
  const gmail = await getUncachableGmailClient();

  const subject = `New Edit Request — ${data.clientName} (${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''})`;

  const bodyLines = [
    `A client has submitted photos for editing.`,
    ``,
    `--- Client ---`,
    `Name: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    ``,
    `--- Request Details ---`,
    `Photos submitted: ${data.photoCount}`,
    `Tokens used: ${data.tokensUsed}`,
  ];
  if (data.notes) {
    bodyLines.push(``, `--- Client Instructions ---`, data.notes);
  }
  bodyLines.push(``, `Log in to the admin panel to view the photos and start a conversation.`);
  const body = bodyLines.join('\n');

  const to = 'armando@alignworkspaces.com';

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

export async function sendNewSpaceSubmissionNotification(data: {
  spaceName: string;
  spaceType: string;
  address: string;
  hostName: string;
  submitterName: string;
  submitterEmail: string;
}) {
  const gmail = await getUncachableGmailClient();

  const subject = `New Space Listing: ${data.spaceName} — Pending Approval`;

  const body = [
    `A new space listing has been submitted on Align Spaces and is pending your approval.`,
    ``,
    `--- Space Details ---`,
    `Name: ${data.spaceName}`,
    `Type: ${data.spaceType}`,
    `Address: ${data.address}`,
    `Host: ${data.hostName}`,
    ``,
    `--- Submitted By ---`,
    `Name: ${data.submitterName}`,
    `Email: ${data.submitterEmail}`,
    ``,
    `Log in to the admin panel to review and approve this listing.`,
  ].join('\n');

  const to = 'armando@alignworkspaces.com';

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

export async function sendSpaceBookingNotification(data: {
  spaceName: string;
  guestName: string;
  guestEmail: string;
  message: string;
  hostEmail: string;
  bookingDate?: string;
  bookingHours?: number;
}) {
  const gmail = await getUncachableGmailClient();

  const subject = `New Booking Request: ${data.spaceName} — from ${data.guestName}`;

  const dateInfo = data.bookingDate
    ? [`--- Booking Details ---`, `Date: ${data.bookingDate}`, `Duration: ${data.bookingHours || 1} hour${(data.bookingHours || 1) > 1 ? 's' : ''}`, ``]
    : [];

  const body = [
    `Someone has booked your space on Align Spaces!`,
    ``,
    `--- Space ---`,
    `${data.spaceName}`,
    ``,
    ...dateInfo,
    `--- Guest ---`,
    `Name: ${data.guestName}`,
    `Email: ${data.guestEmail}`,
    ``,
    `--- Message ---`,
    data.message || '(No message provided)',
    ``,
    `Log in to your Align client portal to view the booking and start a conversation.`,
  ].join('\n');

  const to = data.hostEmail || 'armando@alignworkspaces.com';

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
