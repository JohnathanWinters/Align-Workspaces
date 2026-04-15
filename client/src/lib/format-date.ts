// Shared date formatting helpers. Standard site format: MM/DD/YY.

/**
 * Formats any date-ish input as MM/DD/YY.
 * Accepts: Date, ISO timestamp, "YYYY-MM-DD" string, or null/undefined.
 * Returns "" if the input can't be parsed.
 */
export function formatDateShort(input: Date | string | null | undefined): string {
  if (!input) return "";
  if (typeof input === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (m) return `${m[2]}/${m[3]}/${m[1].slice(-2)}`;
  }
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}
