const KIT_API_BASE = "https://api.convertkit.com/v3";

function getApiKey() {
  const key = process.env.KIT_API_KEY;
  if (!key) throw new Error("KIT_API_KEY not set");
  return key;
}

function getApiSecret() {
  return process.env.KIT_API_SECRET || getApiKey();
}

/** Add a subscriber to your Kit form and tag with interests */
export async function kitSubscribe(opts: {
  email: string;
  firstName?: string | null;
  interests?: string[];
  zipCode?: string | null;
}) {
  const formId = process.env.KIT_FORM_ID;
  if (!formId) {
    console.warn("KIT_FORM_ID not set — skipping Kit sync");
    return null;
  }

  const fields: Record<string, string> = {};
  if (opts.zipCode) fields.zip_code = opts.zipCode;
  if (opts.interests?.length) fields.interests = opts.interests.join(",");

  const res = await fetch(`${KIT_API_BASE}/forms/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getApiKey(),
      email: opts.email,
      first_name: opts.firstName || undefined,
      fields,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Kit subscribe error [${res.status}]:`, body);
    throw new Error(`Kit API error: ${res.status}`);
  }

  const data = await res.json();

  // Tag subscriber with interests
  if (opts.interests?.length) {
    await kitTagSubscriber(opts.email, opts.interests);
  }

  return data;
}

/** Update subscriber custom fields (interests, zip code) */
export async function kitUpdateSubscriber(opts: {
  email: string;
  interests?: string[];
  zipCode?: string | null;
}) {
  const subscriber = await kitFindSubscriber(opts.email);
  if (!subscriber) return null;

  const fields: Record<string, string> = {};
  if (opts.zipCode !== undefined) fields.zip_code = opts.zipCode || "";
  if (opts.interests) fields.interests = opts.interests.join(",");

  const res = await fetch(`${KIT_API_BASE}/subscribers/${subscriber.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_secret: getApiSecret(),
      fields,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Kit update error [${res.status}]:`, body);
  }

  // Update tags
  if (opts.interests) {
    await kitTagSubscriber(opts.email, opts.interests);
  }

  return subscriber;
}

/** Unsubscribe an email from Kit */
export async function kitUnsubscribe(email: string) {
  try {
    const subscriber = await kitFindSubscriber(email);
    if (subscriber) {
      await fetch(`${KIT_API_BASE}/unsubscribe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_secret: getApiSecret(),
          email,
        }),
      });
    }
  } catch (err) {
    console.error("Kit unsubscribe error:", err);
  }
}

/** Find a subscriber by email */
async function kitFindSubscriber(email: string) {
  try {
    const res = await fetch(
      `${KIT_API_BASE}/subscribers?api_secret=${getApiSecret()}&email_address=${encodeURIComponent(email)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.subscribers?.[0] || null;
  } catch {
    return null;
  }
}

/** Tag a subscriber with interest-based tags */
async function kitTagSubscriber(email: string, interests: string[]) {
  if (!interests.length) return;

  try {
    // Get all tags
    const tagsRes = await fetch(`${KIT_API_BASE}/tags?api_key=${getApiKey()}`);
    if (!tagsRes.ok) return;
    const tagsData = await tagsRes.json();

    const existingTags: Record<string, string> = {};
    for (const tag of tagsData.tags || []) {
      existingTags[tag.name.toLowerCase()] = String(tag.id);
    }

    for (const interest of interests) {
      let tagId = existingTags[interest.toLowerCase()];

      // Create tag if it doesn't exist
      if (!tagId) {
        const createRes = await fetch(`${KIT_API_BASE}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: getApiKey(), tag: { name: interest } }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          tagId = String(created.id);
        }
      }

      if (tagId) {
        await fetch(`${KIT_API_BASE}/tags/${tagId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: getApiKey(), email }),
        });
      }
    }
  } catch (err) {
    console.error("Kit tagging error:", err);
  }
}
