CREATE TYPE "public"."attendance_decision" AS ENUM('ATTENDING', 'NOT_ATTENDING');--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"guest_key" text NOT NULL,
	"guest_name" text NOT NULL,
	"decision" "attendance_decision" NOT NULL,
	"responded_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rsvps_guest_key_unique" UNIQUE("guest_key")
);
