import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { gzipSync } from "zlib";
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
