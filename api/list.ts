// api/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { listPage, publicUrl, parseTags, BUCKET, KEY_PREFIX } from "./_s3";

export const config = { runtime: "nodejs18.x" };

function typeFromKey(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","webp","gif","avif"].includes(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (["mp4","webm","mov","m4v","mkv"].includes(ext)) {
    if (ext === "m4v") return "video/mp4";
    if (ext === "mov") return "video/quicktime";
    if (ext === "mkv") return "video/x-matroska";
    return `video/${ext}`;
  }
  return "application/octet-stream";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt((req.query.limit as string) || "24", 10);
    const cursor = (req.query.cursor as string) || undefined;
    const query = (req.query.query as string)?.trim()?.toLowerCase() || "";
    const tags = parseTags(req.query.tags);
    const sort = (req.query.sort as string) || "createdAt:desc";

    const data = await listPage(KEY_PREFIX, limit, cursor);
    const nextCursor = data.IsTruncated ? data.NextContinuationToken : null;

    let items = (data.Contents || [])
      .filter(obj => !!obj.Key && !obj.Key!.endsWith("/"))
      .map(obj => {
        const key = obj.Key!;
        return {
          key,
          url: publicUrl(key),
          size: obj.Size || 0,
          createdAt: obj.LastModified ? new Date(obj.LastModified).getTime() : undefined,
          type: typeFromKey(key),
          // width/height/duration/tags는 별도 메타 저장을 붙이면 반환 가능 (여기선 생략)
        };
      });

    if (query) {
      items = items.filter(i => i.key.toLowerCase().includes(query));
    }
    if (tags.length) {
      // 간단 태그 필터: 키에 [tag] 포함하는 전략을 쓰는 경우 (예: uploads/[tag1,tag2]-filename.jpg)
      items = items.filter(i => tags.every(t => i.key.toLowerCase().includes(t.toLowerCase())));
    }

    const [field, dir] = (sort || "createdAt:desc").split(":");
    items.sort((a: any, b: any) => {
      const av = a[field] ?? 0, bv = b[field] ?? 0;
      return dir === "asc" ? (av - bv) : (bv - av);
    });

    return res.status(200).json({ items, nextCursor });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "list failed" });
  }
}
