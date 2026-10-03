import { Request, Response, sql } from "@elements/app";

const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export default function serveImage(req: Request, res: Response) {
  let img = sql<{ contentType: string; hash: string; data: Buffer }>(`
    select contentType, hash, data from images where id = ${req.params.id}
  `).firstOrThrow();

  if (req.params.hash !== img.hash) {
    res.status(404);
    return res.end();
  }

  if (INLINE.has(img.contentType)) {
    res.setHeader("Content-Type", img.contentType);
  } else {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment");
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  return img.data;
}
