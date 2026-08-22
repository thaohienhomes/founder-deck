ALTER TABLE "cards" ADD COLUMN "claim_ip" text;--> statement-breakpoint
CREATE INDEX "cards_claim_ip_idx" ON "cards" USING btree ("claim_ip","claimed_at" DESC NULLS LAST);