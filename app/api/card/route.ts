import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCardBySlug, cards, eq } from "@/lib/rank";
import { CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z
  .object({
    slug: z.string().min(1).max(120),
    k: z.string().min(1).max(80),
    productName: z.string().trim().min(1).max(60).optional(),
    tagline: z.string().trim().max(90).optional(),
    category: z.string().refine((c) => CATEGORIES.includes(c), "Unknown category").optional(),
    logoUrl: z
      .string()
      .trim()
      .url()
      .max(500)
      .refine((u) => /^https?:\/\//i.test(u), "Logo must be http(s)")
      .optional()
      .or(z.literal("")),
    xHandle: z.string().trim().max(32).optional().or(z.literal("")),
  })
  .refine(
    (b) =>
      b.productName !== undefined ||
      b.tagline !== undefined ||
      b.category !== undefined ||
      b.logoUrl !== undefined ||
      b.xHandle !== undefined,
    "Nothing to update",
  );

/**
 * Owner-only enrichment after a claim. The claim itself no longer collects
 * product name / tagline / category / logo — this is where the owner sets or
 * corrects what og-fetch guessed. Same owner_token mechanism as /api/boost;
 * no new auth.
 */
export async function PATCH(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const card = await getCardBySlug(parsed.slug);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  if (parsed.k !== card.ownerToken) {
    return NextResponse.json({ error: "Only the owner of a card can edit it" }, { status: 403 });
  }

  const updates: Record<string, string | null> = {};
  if (parsed.productName !== undefined) updates.productName = parsed.productName;
  if (parsed.tagline !== undefined) updates.tagline = parsed.tagline;
  if (parsed.category !== undefined) updates.category = parsed.category;
  if (parsed.logoUrl !== undefined) updates.logoUrl = parsed.logoUrl || null;
  if (parsed.xHandle !== undefined) {
    updates.xHandle = parsed.xHandle ? `@${parsed.xHandle.replace(/^@/, "")}` : null;
  }

  await db.update(cards).set(updates).where(eq(cards.id, card.id));

  return NextResponse.json({ ok: true, ...updates });
}
