// api/metadata.ts
import { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs18.x" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  // 여기에 KV/DB 저장을 붙이면 됩니다. (예: Vercel KV, Supabase 등)
  return res.status(200).json({ ok: true });
}
