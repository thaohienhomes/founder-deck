import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

import { db, boostCheckouts, boostEvents } from "@/lib/db";
import { getCardBySlug, applyBoost } from "@/lib/rank";
import { getPack, polarProductId } from "@/lib/packs";
import { createBoostCheckout, PAYMENTS_SIMULATED } from "@/lib/polar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  slug: z.string().min(1).max(120),
  packId: z.string().min(1).max(40),
  k: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const card = await getCardBySlug(parsed.slug);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  // owner-only boosts in v1
  if (parsed.k !== card.ownerToken) {
    return NextResponse.json({ error: "Only the owner of a card can boost it" }, { status: 403 });
  }

  // the client names a pack, never an amount
  const pack = getPack(parsed.packId);
  if (!pack) return NextResponse.json({ error: "Unknown boost pack" }, { status: 400 });

  const checkoutId = nanoid(21);
  await db.insert(boostCheckouts).values({
    id: checkoutId,
    cardId: card.id,
    packId: pack.id,
    amountCents: pack.cents,
    provider: PAYMENTS_SIMULATED ? "simulated" : "polar",
  });

  // ── prototype mode: no money moves, every other code path is identical ──
  if (PAYMENTS_SIMULATED) {
    const result = await applyBoost({
      cardId: card.id,
      packId: pack.id,
      amountCents: pack.cents,
      checkoutId,
      orderId: `sim_${checkoutId}`,
    });
    const [ev] = await db
      .select({ id: boostEvents.id })
      .from(boostEvents)
      .where(eq(boostEvents.checkoutId, checkoutId))
      .orderBy(desc(boostEvents.id))
      .limit(1);
    return NextResponse.json({ simulated: true, eventId: ev?.id ?? null, ...result });
  }

  // ── live mode ──
  const productId = polarProductId(pack.id);
  if (!productId) {
    return NextResponse.json(
      { error: `No Polar product configured for the ${pack.name} pack` },
      { status: 500 },
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const { url, providerCheckoutId } = await createBoostCheckout({
      productId,
      checkoutId,
      cardId: card.id,
      packId: pack.id,
      successUrl: `${site}/c/${card.slug}?k=${card.ownerToken}&paid=1`,
      customerEmail: card.founderEmail,
    });
    await db
      .update(boostCheckouts)
      .set({ providerCheckoutId })
      .where(eq(boostCheckouts.id, checkoutId));
    return NextResponse.json({ checkoutUrl: url });
  } catch (e) {
    console.error("polar checkout failed", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
