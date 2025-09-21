// api/metadata.ts
import { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  // 여기서 DB/KV에 저장 로직을 붙이세요.
  return res.status(200).json({ ok: true });
}

