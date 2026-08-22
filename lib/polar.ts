import { Polar } from "@polar-sh/sdk";

export const PAYMENTS_SIMULATED = process.env.SIMULATE_PAYMENTS === "1";

let client: Polar | null = null;

export function polar(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not set");
  if (!client) {
    client = new Polar({
      accessToken,
      server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
    });
  }
  return client;
}

/**
 * Create a checkout for a boost.
 *
 * Money integrity rules, all enforced here:
 *  - the product (and therefore the price) is resolved from server env, never the request body
 *  - our own checkout id travels in metadata so the webhook can match it back
 *  - the card id travels in metadata so a tampered success_url cannot credit another card
 */
export async function createBoostCheckout(args: {
  productId: string;
  checkoutId: string;
  cardId: number;
  packId: string;
  successUrl: string;
  customerEmail?: string | null;
}) {
  const checkout = await polar().checkouts.create({
    products: [args.productId],
    successUrl: args.successUrl,
    ...(args.customerEmail ? { customerEmail: args.customerEmail } : {}),
    metadata: {
      fd_kind: "boost",
      fd_checkout_id: args.checkoutId,
      fd_card_id: String(args.cardId),
      fd_pack_id: args.packId,
    },
  });
  return { url: checkout.url, providerCheckoutId: checkout.id };
}

/**
 * Create a checkout for a claim. Same money-integrity rules as boosts: the
 * tier price is resolved server-side from the reserved claim number, and
 * our own checkout id travels in metadata so a tampered success_url can
 * never mint or credit a card directly.
 */
export async function createClaimCheckout(args: {
  productId: string;
  checkoutId: string;
  claimNumber: number;
  successUrl: string;
  customerEmail?: string | null;
}) {
  const checkout = await polar().checkouts.create({
    products: [args.productId],
    successUrl: args.successUrl,
    ...(args.customerEmail ? { customerEmail: args.customerEmail } : {}),
    metadata: {
      fd_kind: "claim",
      fd_checkout_id: args.checkoutId,
      fd_claim_number: String(args.claimNumber),
    },
  });
  return { url: checkout.url, providerCheckoutId: checkout.id };
}
