CREATE TABLE "boost_checkouts" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"pack_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"provider" text DEFAULT 'polar' NOT NULL,
	"provider_checkout_id" text,
	"provider_order_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "boost_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"pack_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"previous_total_cents" integer NOT NULL,
	"new_total_cents" integer NOT NULL,
	"previous_rank" integer,
	"resulting_rank" integer,
	"checkout_id" text,
	"order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer DEFAULT 1 NOT NULL,
	"claim_number" integer NOT NULL,
	"slug" text NOT NULL,
	"product_name" text NOT NULL,
	"tagline" text NOT NULL,
	"category" text NOT NULL,
	"website_url" text NOT NULL,
	"normalized_domain" text NOT NULL,
	"x_handle" text,
	"logo_url" text,
	"accent" text DEFAULT 'amber' NOT NULL,
	"founder_email" text,
	"owner_token" text NOT NULL,
	"total_bid_cents" integer DEFAULT 0 NOT NULL,
	"bid_reached_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_boost_at" timestamp with time zone,
	"state" text DEFAULT 'live' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'polar' NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "checkout_card_idx" ON "boost_checkouts" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "boost_card_idx" ON "boost_events" USING btree ("card_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "boost_created_idx" ON "boost_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "cards_slug_uq" ON "cards" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_claim_number_uq" ON "cards" USING btree ("season_id","claim_number");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_domain_uq" ON "cards" USING btree ("season_id","normalized_domain");--> statement-breakpoint
CREATE INDEX "cards_rank_idx" ON "cards" USING btree ("total_bid_cents" DESC NULLS LAST,"bid_reached_at");--> statement-breakpoint
CREATE INDEX "cards_claimed_idx" ON "cards" USING btree ("claimed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cards_boost_idx" ON "cards" USING btree ("last_boost_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_event_uq" ON "webhook_events" USING btree ("provider","provider_event_id");