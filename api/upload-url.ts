// api/upload-url.ts
import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET, KEY_PREFIX, REGION, publicUrl, guessContentType } from "./_s3";

export const config = { runtime: "nodejs18.x" };

const s3 = new S3Client({ region: REGION });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { filename, contentType, tags, isPublic } = req.body || {};
    const ct = contentType || guessContentType(filename || "file.bin");
    const safeName = (filename || "file.bin").replace(/[^\w.\-]+/g, "_");
    const ts = Date.now();
    const key = `${KEY_PREFIX}${ts}-${safeName}`;

    const putCmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: ct,
      // ACL: isPublic ? "public-read" : undefined, // 버킷 정책/퍼블릭 액세스 설정에 따라 필요시 사용
      Metadata: {
        tags: Array.isArray(tags) ? tags.join(",") : (tags || ""),
        ts: String(ts),
      }
    });

    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 }); // 60초 유효
    const url = publicUrl(key);

    return res.status(200).json({
      uploadUrl,
      publicUrl: url,
      storageKey: key,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "failed to create upload url" });
  }
}
