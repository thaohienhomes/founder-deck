import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { eq } from "drizzle-orm";

import { db, webhookEvents, boostCheckouts } from "@/lib/db";
import { applyBoost } from "@/lib/rank";
import { getPack } from "@/lib/packs";
import { fulfillClaim } from "@/lib/claim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The only place a bid may increase.
 *
 * A redirect back from Polar changes nothing — only a signed webhook does.
 * Every event id is written to webhook_events with a unique constraint before
 * any money logic runs, so a redelivery cannot double-credit a card.
 */
export async function POST(req: Request) {
  const raw = await req.text();

  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not set — refusing webhook");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const headers: Record<string, string> = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
  };

  let payload: Record<string, unknown>;
  try {
    // Polar's secret is passed base64-encoded, per the Standard Webhooks spec
    const wh = new Webhook(Buffer.from(secret).toString("base64"));
    payload = wh.verify(raw, headers) as Record<string, unknown>;
  } catch (e) {
    console.error("webhook signature rejected", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const eventId = headers["webhook-id"];
  const eventType = String(payload.type ?? "unknown");

  // idempotency gate — unique(provider, provider_event_id)
  try {
    await db.insert(webhookEvents).values({
      provider: "polar",
      providerEventId: eventId,
      eventType,
      payload: payload as unknown as object,
    });
  } catch {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    if (eventType === "order.paid") {
      await handleOrderPaid(payload);
    }
    await db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.providerEventId, eventId));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("webhook processing failed", message);
    await db
      .update(webhookEvents)
      .set({ processingError: message })
      .where(eq(webhookEvents.providerEventId, eventId));
    // 500 so Polar retries; the idempotency row is already written, so on retry
    // the dedupe branch returns ok. Clear processing_error to allow a real replay.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleOrderPaid(payload: Record<string, unknown>) {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, string>;

  const ourCheckoutId = metadata.fd_checkout_id;
  if (!ourCheckoutId) return; // not one of ours

  const orderId = String(data.id ?? "");

  // fd_kind distinguishes a claim checkout from a boost checkout. Older
  // checkouts created before this field existed have no other purpose than
  // boosting, so default there.
  if (metadata.fd_kind === "claim") {
    await fulfillClaim(ourCheckoutId, orderId);
    return;
  }

  const [intent] = await db
    .select()
    .from(boostCheckouts)
    .where(eq(boostCheckouts.id, ourCheckoutId))
    .limit(1);

  if (!intent) throw new Error(`unknown checkout ${ourCheckoutId}`);
  if (intent.status === "paid") return; // already credited

  // never trust the metadata card/pack over our own stored intent
  const pack = getPack(intent.packId);
  if (!pack) throw new Error(`unknown pack ${intent.packId}`);
  if (pack.cents !== intent.amountCents) {
    throw new Error(`pack price drift for ${intent.packId}`);
  }

  await applyBoost({
    cardId: intent.cardId,
    packId: intent.packId,
    amountCents: intent.amountCents,
    checkoutId: intent.id,
    orderId,
  });
}
