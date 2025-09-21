// api/_s3.ts
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const REGION = process.env.AWS_REGION!;
export const BUCKET = process.env.AWS_S3_BUCKET!;
export const CDN_BASE = process.env.PUBLIC_CDN_BASE;       // e.g. https://cdn.example.com
export const KEY_PREFIX = process.env.KEY_PREFIX || "uploads/";

export const s3 = new S3Client({ region: REGION });

export function publicUrl(key: string) {
  if (CDN_BASE) return `${CDN_BASE.replace(/\/$/, "")}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export function guessContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/mp4", mkv: "video/x-matroska"
  };
  return map[ext] || "application/octet-stream";
}

export function parseTags(raw?: string | string[]) {
  if (!raw) return [];
  const s = Array.isArray(raw) ? raw.join(",") : raw;
  return s.split(",").map(t => t.trim()).filter(Boolean);
}

export async function listPage(prefix: string, limit: number, cursor?: string) {
  const cmd = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: Math.min(Math.max(limit, 1), 1000),
    ContinuationToken: cursor || undefined,
  });
  return s3.send(cmd);
}
