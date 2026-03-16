import { google } from 'googleapis';

const FROM_NAME = 'Align Workspaces';
const FROM_EMAIL = 'hello@alignworkspaces.com';
const FROM_HEADER = `${FROM_NAME} <${FROM_EMAIL}>`;
const ADMIN_EMAIL = 'armando@alignworkspaces.com';
const SITE_URL = process.env.SITE_URL || 'https://alignworkspaces.com';

// ---------- Google OAuth2 ----------

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET not set');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:5000/api/auth/google/callback'
  );

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

/** Returns the URL the admin should visit once to authorize Gmail access */
export function getGmailAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  });
}

/** Exchange the one-time auth code for tokens; returns the refresh token to store */
export async function exchangeGmailCode(code: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned — try revoking access at https://myaccount.google.com/permissions and re-authorizing');
  }
  return tokens.refresh_token;
}

async function getGmailClient() {
  const oauth2Client = getOAuth2Client();
  // This automatically refreshes the access token using the stored refresh token
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#1a1a1a;padding:24px 32px;text-align:center;">
          <img src="${SITE_URL}/images/logo-align-mark.png" alt="Align" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:6px;" />
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#ffffff;letter-spacing:0.5px;">Align</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="border-top:1px solid #e8e4df;padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9a9590;">Align Workspaces &middot; Miami, FL</p>
              <p style="margin:0;font-size:12px;color:#b5b0ab;">
                <a href="${SITE_URL}" style="color:#c4956a;text-decoration:none;">alignworkspaces.com</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:#9a9590;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:500;">${value}</td>
  </tr>`;
}

function sectionHeading(text: string): string {
  return `<p style="margin:24px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#c4956a;font-weight:600;">${text}</p>`;
}

function mimeEncodeSubject(subject: string) {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return '=?UTF-8?B?' + Buffer.from(subject, 'utf-8').toString('base64') + '?=';
}

async function sendEmail(to: string, subject: string, htmlBody: string) {
  const gmail = await getGmailClient();
  const rawMessage = [
    `MIME-Version: 1.0`,
    `To: ${to}`,
    `From: ${FROM_HEADER}`,
    `Reply-To: ${FROM_HEADER}`,
    `Subject: ${mimeEncodeSubject(subject)}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    htmlBody,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}

export async function sendMagicLinkEmail(email: string, magicUrl: string) {
  const subject = `Your sign-in link for Align Workspaces`;

  const html = emailLayout(`
    <div style="text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
        <tr><td style="width:56px;height:56px;border-radius:50%;background-color:#1a1a1a;text-align:center;vertical-align:middle;">
          <img src="https://img.icons8.com/ios-filled/28/ffffff/key--v1.png" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;" />
        </td></tr>
      </table>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Sign in to Align</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b6560;line-height:1.5;">
        Tap the button below to securely sign in. No password needed.
      </p>
      <a href="${magicUrl}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:0.3px;">
        Sign In
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#b5b0ab;line-height:1.5;">
        This link expires in 15 minutes and can only be used once.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `);

  await sendEmail(email, subject, html);
}

export async function sendEmailChangeConfirmation(currentEmail: string, confirmUrl: string, newEmail: string) {
  const subject = `Confirm your email change`;

  const html = emailLayout(`
    <div style="text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
        <tr><td style="width:56px;height:56px;border-radius:50%;background-color:#1a1a1a;text-align:center;vertical-align:middle;">
          <img src="https://img.icons8.com/ios-filled/28/ffffff/email-sign.png" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;" />
        </td></tr>
      </table>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Confirm Email Change</h1>
      <p style="margin:0 0 8px;font-size:14px;color:#6b6560;line-height:1.5;">
        You requested to change your email to:
      </p>
      <p style="margin:0 0 24px;font-size:15px;font-weight:600;color:#1a1a1a;">
        ${newEmail}
      </p>
      <p style="margin:0 0 28px;font-size:14px;color:#6b6560;line-height:1.5;">
        Tap the button below to confirm this change.
      </p>
      <a href="${confirmUrl}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:0.3px;">
        Confirm Email Change
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#b5b0ab;line-height:1.5;">
        This link expires in 30 minutes.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `);

  await sendEmail(currentEmail, subject, html);
}

interface BookingEmailData {
  name: string;
  email: string;
  phone?: string | null;
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
  const subject = `New Booking: ${data.name} — ${data.preferredDate === "TBD" ? "Inquiry" : data.preferredDate}`;

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">New Portrait Booking</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">A new session has been submitted through the portrait configurator.</p>

    ${sectionHeading('Client Information')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.name)}
      ${infoRow('Email', `<a href="mailto:${data.email}" style="color:#c4956a;text-decoration:none;">${data.email}</a>`)}
      ${infoRow('Phone', data.phone || 'Not provided')}
      ${infoRow('Preferred Date', data.preferredDate)}
    </table>

    ${sectionHeading('Concept Selections')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Environment', data.environment)}
      ${infoRow('Brand Message', data.brandMessage)}
      ${infoRow('Emotional Impact', data.emotionalImpact)}
      ${infoRow('Shoot Intent', data.shootIntent)}
    </table>

    ${sectionHeading('Estimated Investment')}
    <div style="background-color:#f5f3f0;border-radius:8px;padding:16px;text-align:center;">
      <span style="font-size:22px;font-weight:600;color:#1a1a1a;">$${data.estimatedMin} – $${data.estimatedMax}</span>
    </div>

    ${data.notes ? `${sectionHeading('Client Notes')}<p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.5;background-color:#f5f3f0;border-radius:8px;padding:16px;">${data.notes}</p>` : ''}
  `);

  await sendEmail(ADMIN_EMAIL, subject, html);
}

interface HelpRequestData {
  clientName: string;
  clientEmail: string;
  message: string;
}

export async function sendHelpRequest(data: HelpRequestData) {
  const subject = `Help Request — ${data.clientName}`;

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Client Help Request</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">A client submitted a help request from the Client Portal.</p>

    ${sectionHeading('Client')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.clientName)}
      ${infoRow('Email', `<a href="mailto:${data.clientEmail}" style="color:#c4956a;text-decoration:none;">${data.clientEmail}</a>`)}
    </table>

    ${sectionHeading('Message')}
    <div style="background-color:#f5f3f0;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
    </div>
  `);

  await sendEmail(ADMIN_EMAIL, subject, html);
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
  const subject = `New Collaboration Request — ${data.clientName}`;

  const selections = [
    data.environment ? infoRow('Environment', data.environment) : '',
    data.brandMessage ? infoRow('Brand Message', data.brandMessage) : '',
    data.emotionalImpact ? infoRow('Emotional Impact', data.emotionalImpact) : '',
    data.shootIntent ? infoRow('Shoot Intent', data.shootIntent) : '',
  ].filter(Boolean).join('');

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Collaboration Request</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">A new client is interested in collaborating.</p>

    ${sectionHeading('Client')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.clientName)}
      ${infoRow('Email', `<a href="mailto:${data.clientEmail}" style="color:#c4956a;text-decoration:none;">${data.clientEmail}</a>`)}
    </table>

    ${selections ? `${sectionHeading('Concept Selections')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">${selections}</table>` : ''}

    ${sectionHeading('Message')}
    <div style="background-color:#f5f3f0;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
    </div>
  `);

  await sendEmail(ADMIN_EMAIL, subject, html);
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
  const subject = `Invoice for ${data.shootTitle} — Align Workspaces`;

  const itemsHtml = data.lineItems
    .map(item => `
      <tr>
        <td style="padding:10px 0;font-size:14px;color:#1a1a1a;border-bottom:1px solid #e8e4df;">${item.description}</td>
        <td style="padding:10px 0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:500;border-bottom:1px solid #e8e4df;">$${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Invoice</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6560;">Hi ${data.clientName}, here's the invoice for your session.</p>

    <div style="border:1px solid #e8e4df;border-radius:8px;overflow:hidden;">
      <div style="background-color:#f5f3f0;padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:#9a9590;text-transform:uppercase;letter-spacing:0.8px;">Session</p>
        <p style="margin:4px 0 0;font-size:16px;color:#1a1a1a;font-weight:600;">${data.shootTitle}</p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:4px 16px;">
        ${itemsHtml}
        <tr>
          <td style="padding:14px 0 10px;font-size:16px;color:#1a1a1a;font-weight:700;">Total</td>
          <td style="padding:14px 0 10px;font-size:16px;color:#1a1a1a;font-weight:700;text-align:right;">$${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${data.notes ? `<p style="margin:16px 0 0;font-size:13px;color:#6b6560;background-color:#f5f3f0;border-radius:8px;padding:12px 16px;"><strong>Note:</strong> ${data.notes}</p>` : ''}

    <p style="margin:24px 0 0;font-size:14px;color:#6b6560;line-height:1.5;">
      If you have any questions about this invoice, simply reply to this email.
    </p>
  `);

  await sendEmail(data.clientEmail, subject, html);
}

interface EditRequestNotificationData {
  clientName: string;
  clientEmail: string;
  photoCount: number;
  tokensUsed: number;
  notes?: string;
}

export async function sendEditRequestNotification(data: EditRequestNotificationData) {
  const subject = `Edit Request — ${data.clientName} (${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''})`;

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">New Edit Request</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">A client has submitted photos for editing.</p>

    ${sectionHeading('Client')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.clientName)}
      ${infoRow('Email', `<a href="mailto:${data.clientEmail}" style="color:#c4956a;text-decoration:none;">${data.clientEmail}</a>`)}
    </table>

    ${sectionHeading('Request Details')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Photos', `${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''}`)}
      ${infoRow('Tokens Used', String(data.tokensUsed))}
    </table>

    ${data.notes ? `${sectionHeading('Client Instructions')}<div style="background-color:#f5f3f0;border-radius:8px;padding:16px;"><p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${data.notes}</p></div>` : ''}

    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/admin" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;">
        View in Admin Panel
      </a>
    </div>
  `);

  await sendEmail(ADMIN_EMAIL, subject, html);
}

export async function sendNewSpaceSubmissionNotification(data: {
  spaceName: string;
  spaceType: string;
  address: string;
  hostName: string;
  submitterName: string;
  submitterEmail: string;
}) {
  const subject = `New Space Listing: ${data.spaceName} — Pending Approval`;

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">New Space Listing</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">A new space has been submitted and is awaiting your approval.</p>

    ${sectionHeading('Space Details')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.spaceName)}
      ${infoRow('Type', data.spaceType)}
      ${infoRow('Address', data.address)}
      ${infoRow('Host', data.hostName)}
    </table>

    ${sectionHeading('Submitted By')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.submitterName)}
      ${infoRow('Email', `<a href="mailto:${data.submitterEmail}" style="color:#c4956a;text-decoration:none;">${data.submitterEmail}</a>`)}
    </table>

    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/admin" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;">
        Review in Admin Panel
      </a>
    </div>
  `);

  await sendEmail(ADMIN_EMAIL, subject, html);
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
  const subject = `New Booking: ${data.spaceName} — ${data.guestName}`;

  const dateRows = data.bookingDate
    ? `${infoRow('Date', data.bookingDate)}${infoRow('Duration', `${data.bookingHours || 1} hour${(data.bookingHours || 1) > 1 ? 's' : ''}`)}`
    : '';

  const html = emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">Space Booking Confirmed</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b6560;">Someone has booked your space on Align.</p>

    ${sectionHeading('Space')}
    <div style="background-color:#f5f3f0;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">${data.spaceName}</p>
    </div>

    ${dateRows ? `${sectionHeading('Booking Details')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">${dateRows}</table>` : ''}

    ${sectionHeading('Guest')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4df;border-radius:8px;padding:12px 16px;">
      ${infoRow('Name', data.guestName)}
      ${infoRow('Email', `<a href="mailto:${data.guestEmail}" style="color:#c4956a;text-decoration:none;">${data.guestEmail}</a>`)}
    </table>

    ${data.message ? `${sectionHeading('Message')}<div style="background-color:#f5f3f0;border-radius:8px;padding:16px;"><p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${data.message}</p></div>` : ''}

    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/portal" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;">
        View in Client Portal
      </a>
    </div>
  `);

  const to = data.hostEmail || ADMIN_EMAIL;
  await sendEmail(to, subject, html);
}
