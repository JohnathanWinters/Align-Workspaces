/**
 * Run: node script/get-google-token.js
 *
 * Opens a browser for Google OAuth, then prints the new refresh token.
 * Update GOOGLE_CALENDAR_REFRESH_TOKEN in .env with the result.
 */
require("dotenv").config();
const http = require("http");
const { google } = require("googleapis");
let open;
try { open = require("open"); } catch {
  // fallback: use platform command
  const { exec } = require("child_process");
  open = (url) => exec(process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`);
}

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3939/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CALENDAR_CLIENT_ID or GOOGLE_CALENDAR_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) return;

  const url = new URL(req.url, "http://localhost:3939");
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("No code received. Try again.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end("Success! You can close this tab. Check your terminal for the refresh token.");

    console.log("\n========================================");
    console.log("NEW REFRESH TOKEN:");
    console.log("========================================");
    console.log(tokens.refresh_token);
    console.log("========================================\n");
    console.log("Update GOOGLE_CALENDAR_REFRESH_TOKEN in your .env file with this value.");
  } catch (err) {
    console.error("Failed to get token:", err.message);
    res.end("Error exchanging code. Check terminal.");
  }

  server.close();
});

server.listen(3939, () => {
  console.log("Opening browser for Google OAuth...");
  console.log("If it doesn't open, visit:", authUrl);
  open(authUrl);
});
