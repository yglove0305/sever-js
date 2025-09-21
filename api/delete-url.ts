// api/delete-url.ts
import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET, REGION } from "./_s3";

export const config = { runtime: "nodejs" };

const s3 = new S3Client({ region: REGION });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: "key required" });

    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    const deleteUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 });

    return res.status(200).json({ deleteUrl });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "failed to create delete url" });
  }
}

