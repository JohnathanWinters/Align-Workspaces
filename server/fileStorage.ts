import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = path.join(process.cwd(), ".private");

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveObjectPath(objectPath: string): string {
  // objectPath is like "/objects/uploads/abc-123" → resolve to ".private/abc-123"
  const fileId = objectPath
    .replace(/^\/objects\//, "")
    .replace(/^uploads\//, "");
  return path.join(STORAGE_DIR, fileId);
}

export async function uploadBuffer(buffer: Buffer, _contentType: string): Promise<string> {
  const objectId = randomUUID();
  ensureDir(STORAGE_DIR);
  const filePath = path.join(STORAGE_DIR, objectId);
  await fs.promises.writeFile(filePath, buffer);
  return `/objects/uploads/${objectId}`;
}

export async function uploadFile(filePath: string, _contentType: string): Promise<string> {
  const objectId = randomUUID();
  ensureDir(STORAGE_DIR);
  const destPath = path.join(STORAGE_DIR, objectId);
  await fs.promises.copyFile(filePath, destPath);
  await fs.promises.unlink(filePath).catch(() => {});
  return `/objects/uploads/${objectId}`;
}

export async function deleteObject(objectPath: string): Promise<void> {
  try {
    const filePath = resolveObjectPath(objectPath);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error("Failed to delete file:", objectPath, err);
  }
}

export async function getObjectStream(objectPath: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  try {
    const filePath = resolveObjectPath(objectPath);
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
    };
    return {
      stream: fs.createReadStream(filePath),
      contentType: mimeTypes[ext] || "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export function objectExists(objectPath: string): boolean {
  const filePath = resolveObjectPath(objectPath);
  return fs.existsSync(filePath);
}

export function serveObject(objectPath: string, res: import("express").Response): void {
  const filePath = resolveObjectPath(objectPath);
  if (!fs.existsSync(filePath)) {
    throw new ObjectNotFoundError();
  }
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  };
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  fs.createReadStream(filePath).pipe(res);
}
