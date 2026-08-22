import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, asRows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Minimal moderation hook. A hidden card leaves every deck view and every
 * ranking immediately — its bid history stays, so nothing is destroyed.
 *
 *   curl -X POST https://your-site/api/admin/hide \
 *     -H "authorization: Bearer $ADMIN_TOKEN" \
 *     -H "content-type: application/json" \
 *     -d '{"slug":"bad-actor","state":"hidden"}'
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let slug: string;
  let state: string;
  try {
    const body = (await req.json()) as { slug?: string; state?: string };
    slug = String(body.slug ?? "");
    state = String(body.state ?? "hidden");
    if (!slug) throw new Error("no slug");
    if (!["live", "hidden", "flagged"].includes(state)) throw new Error("bad state");
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const rows = asRows(
    await db.execute(
      sql`update cards set state = ${state} where slug = ${slug} returning slug, state`,
    ),
  );
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
