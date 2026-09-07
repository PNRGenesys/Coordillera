CREATE TYPE "public"."customer_role" AS ENUM('customer', 'admin');--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "role" "customer_role" DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "carrier" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(120);