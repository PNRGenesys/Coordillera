CREATE TYPE "public"."custom_design_request_status" AS ENUM('pending', 'delivered', 'changes_requested', 'approved');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('design_delivered', 'changes_requested', 'design_approved');--> statement-breakpoint
ALTER TYPE "public"."customer_role" ADD VALUE 'artist';--> statement-breakpoint
CREATE TABLE "custom_design_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"base_variant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"character_description" text,
	"reference_image_url" text NOT NULL,
	"final_design_image_url" text,
	"estimated_days" integer,
	"revision_note" text,
	"status" "custom_design_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_design_requests_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"related_request_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "accepting_requests" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_design_requests" ADD CONSTRAINT "custom_design_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_design_requests" ADD CONSTRAINT "custom_design_requests_artist_id_customers_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_design_requests" ADD CONSTRAINT "custom_design_requests_base_variant_id_product_variants_id_fk" FOREIGN KEY ("base_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_design_requests" ADD CONSTRAINT "custom_design_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_request_id_custom_design_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."custom_design_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_design_requests_artist_idx" ON "custom_design_requests" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "custom_design_requests_customer_idx" ON "custom_design_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "notifications_customer_idx" ON "notifications" USING btree ("customer_id");