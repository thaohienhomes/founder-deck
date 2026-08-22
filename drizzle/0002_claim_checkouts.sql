ALTER TABLE "cards" ADD COLUMN "claim_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "claim_checkouts" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_number" integer NOT NULL,
	"tier" text NOT NULL,
	"fee_cents" integer NOT NULL,
	"product_name" text NOT NULL,
	"tagline" text NOT NULL,
	"category" text NOT NULL,
	"website_url" text NOT NULL,
	"normalized_domain" text NOT NULL,
	"x_handle" text,
	"founder_email" text,
	"accent" text DEFAULT 'amber' NOT NULL,
	"owner_token" text NOT NULL,
	"claim_ip" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"provider" text DEFAULT 'polar' NOT NULL,
	"provider_checkout_id" text,
	"provider_order_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"card_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "claim_checkout_status_idx" ON "claim_checkouts" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "claim_checkout_domain_idx" ON "claim_checkouts" USING btree ("normalized_domain");
