import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "align-uploads";

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function resolveKey(objectPath: string): string {
  return objectPath
    .replace(/^\/objects\//, "")
    .replace(/^uploads\//, "");
}

function getMimeType(objectPath: string): string {
  const ext = path.extname(objectPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export async function uploadBuffer(buffer: Buffer, contentType: string): Promise<string> {
  const objectId = randomUUID();
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectId,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  }));
  return `/objects/uploads/${objectId}`;
}

export async function uploadFile(filePath: string, contentType: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  const url = await uploadBuffer(buffer, contentType);
  await fs.promises.unlink(filePath).catch(() => {});
  return url;
}

export async function deleteObject(objectPath: string): Promise<void> {
  try {
    const key = resolveKey(objectPath);
    await s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
  } catch (err) {
    console.error("Failed to delete from R2:", objectPath, err);
  }
}

export async function getObjectStream(objectPath: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  try {
    const key = resolveKey(objectPath);
    const response = await s3.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
    if (!response.Body) return null;
    return {
      stream: response.Body as NodeJS.ReadableStream,
      contentType: response.ContentType || getMimeType(objectPath),
    };
  } catch {
    return null;
  }
}

export function objectExists(_objectPath: string): boolean {
  // Cannot synchronously check R2 — callers should handle missing objects at serve time
  return true;
}

export async function serveObject(objectPath: string, res: import("express").Response): Promise<void> {
  const key = resolveKey(objectPath);
  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
    if (!response.Body) throw new ObjectNotFoundError();
    res.setHeader("Content-Type", response.ContentType || getMimeType(objectPath));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (response.ContentLength) res.setHeader("Content-Length", response.ContentLength);
    (response.Body as NodeJS.ReadableStream).pipe(res);
  } catch (err: any) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      throw new ObjectNotFoundError();
    }
    throw err;
  }
}
