import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { gzipSync, gunzipSync } from "zlib";
import { log } from "./index";

const BACKUP_PREFIX = "backups/";
const RETENTION_DAYS = 14;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let backupInterval: ReturnType<typeof setInterval> | null = null;

function getS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function getAllTableNames(): Promise<string[]> {
  const result = await db.execute(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  return (result.rows as { tablename: string }[]).map((r) => r.tablename);
}

async function exportTableData(tableName: string): Promise<any[]> {
  const result = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));
  return result.rows as any[];
}

export async function createBackup(): Promise<{ key: string; size: number; tables: number; rows: number }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `${BACKUP_PREFIX}db-backup-${timestamp}.json.gz`;

  log("Starting database backup...", "backup");

  const tables = await getAllTableNames();
  const backup: Record<string, any[]> = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const rows = await exportTableData(table);
      backup[table] = rows;
      totalRows += rows.length;
    } catch (err: any) {
      log(`Warning: could not export table "${table}": ${err.message}`, "backup");
      backup[table] = [];
    }
  }

  const json = JSON.stringify({
    version: 1,
    createdAt: new Date().toISOString(),
    tables: Object.keys(backup).length,
    totalRows,
    data: backup,
  });

  const compressed = gzipSync(Buffer.from(json));

  const s3 = getS3Client();
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: compressed,
    ContentType: "application/gzip",
    ContentEncoding: "gzip",
  }));

  log(`Backup complete: ${key} (${tables.length} tables, ${totalRows} rows, ${(compressed.length / 1024).toFixed(1)} KB)`, "backup");

  return { key, size: compressed.length, tables: tables.length, rows: totalRows };
}

async function cleanupOldBackups(): Promise<number> {
  const s3 = getS3Client();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let deleted = 0;

  try {
    const listed = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: BACKUP_PREFIX,
    }));

    if (!listed.Contents) return 0;

    for (const obj of listed.Contents) {
      if (obj.LastModified && obj.LastModified < cutoff && obj.Key) {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: obj.Key,
        }));
        deleted++;
      }
    }

    if (deleted > 0) {
      log(`Cleaned up ${deleted} old backup(s) beyond ${RETENTION_DAYS}-day retention`, "backup");
    }
  } catch (err: any) {
    log(`Backup cleanup error: ${err.message}`, "backup");
  }

  return deleted;
}

export async function runBackupCycle(): Promise<void> {
  try {
    await createBackup();
    await cleanupOldBackups();
  } catch (err: any) {
    log(`Backup cycle failed: ${err.message}`, "backup");
  }
}

export function startBackupSchedule(): void {
  if (backupInterval) return;

  // Run first backup 2 minutes after startup
  setTimeout(runBackupCycle, 2 * 60 * 1000);

  // Then run daily
  backupInterval = setInterval(runBackupCycle, BACKUP_INTERVAL_MS);
  log(`Database backup scheduled every ${BACKUP_INTERVAL_MS / 3600000}h with ${RETENTION_DAYS}-day retention`, "backup");
}

export function stopBackupSchedule(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
}

// Table ordering for restore: parents before children to respect foreign keys
const RESTORE_ORDER = [
  "session", "users", "employees",
  "spaces", "shoots", "gallery_folders",
  "gallery_images", "image_favorites",
  "portfolio_photos", "featured_professionals", "team_members",
  "space_bookings", "space_reviews", "space_favorites",
  "space_messages", "shoot_messages", "shoot_reviews",
  "edit_tokens", "token_transactions", "edit_requests", "edit_request_photos", "edit_request_messages",
  "admin_conversations", "admin_messages",
  "direct_conversations", "direct_messages",
  "nominations", "newsletter_subscribers", "leads",
  "page_views", "analytics_events",
  "referral_links", "fee_audit_log",
  "arrival_guides", "arrival_guide_sections",
  "wishlist_collections", "wishlist_items",
  "push_subscriptions",
];

function getRestoreOrder(tables: string[]): string[] {
  const ordered: string[] = [];
  // Add known tables in dependency order
  for (const t of RESTORE_ORDER) {
    if (tables.includes(t)) ordered.push(t);
  }
  // Add any remaining tables not in the known list
  for (const t of tables) {
    if (!ordered.includes(t)) ordered.push(t);
  }
  return ordered;
}

export async function restoreBackup(backupKey: string): Promise<{ tables: number; rows: number; errors: string[] }> {
  log(`Starting restore from: ${backupKey}`, "backup");

  const s3 = getS3Client();
  const obj = await s3.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: backupKey,
  }));

  const chunks: Buffer[] = [];
  const stream = obj.Body as any;
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const compressed = Buffer.concat(chunks);
  const json = gunzipSync(compressed).toString("utf-8");
  const backup = JSON.parse(json);

  if (!backup.data || typeof backup.data !== "object") {
    throw new Error("Invalid backup format: missing data field");
  }

  const tableNames = Object.keys(backup.data);
  const ordered = getRestoreOrder(tableNames);
  let totalRows = 0;
  const errors: string[] = [];

  // Disable triggers during restore for speed and to avoid side effects
  await db.execute(sql`SET session_replication_role = 'replica'`);

  try {
    // Clear existing data in reverse order (children first)
    for (const table of [...ordered].reverse()) {
      try {
        await db.execute(sql.raw(`DELETE FROM "${table}"`));
      } catch (err: any) {
        errors.push(`Clear ${table}: ${err.message}`);
      }
    }

    // Insert data in dependency order
    for (const table of ordered) {
      const rows = backup.data[table];
      if (!rows || rows.length === 0) continue;

      try {
        // Insert in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const columns = Object.keys(batch[0]);
          const colList = columns.map((c) => `"${c}"`).join(", ");

          for (const row of batch) {
            const values = columns.map((c) => {
              const v = row[c];
              if (v === null || v === undefined) return "NULL";
              if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
              if (typeof v === "number") return String(v);
              if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
              return `'${String(v).replace(/'/g, "''")}'`;
            });
            await db.execute(sql.raw(`INSERT INTO "${table}" (${colList}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING`));
            totalRows++;
          }
        }
        log(`Restored ${rows.length} rows to "${table}"`, "backup");
      } catch (err: any) {
        errors.push(`Restore ${table}: ${err.message}`);
        log(`Error restoring "${table}": ${err.message}`, "backup");
      }
    }
  } finally {
    // Re-enable triggers
    await db.execute(sql`SET session_replication_role = 'origin'`);
  }

  log(`Restore complete: ${ordered.length} tables, ${totalRows} rows, ${errors.length} errors`, "backup");
  return { tables: ordered.length, rows: totalRows, errors };
}
