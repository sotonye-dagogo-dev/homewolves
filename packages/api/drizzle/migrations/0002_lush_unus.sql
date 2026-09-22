CREATE TYPE "public"."BugReportStatus" AS ENUM('OPEN', 'UNDER_REVIEW', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."BugReportType" AS ENUM('BUG', 'FEATURE_REQUEST', 'UI_ISSUE', 'PERFORMANCE', 'OTHER');--> statement-breakpoint
CREATE TABLE "BugReport" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "BugReportType" NOT NULL,
	"description" text NOT NULL,
	"screenshots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "BugReportStatus" DEFAULT 'OPEN' NOT NULL,
	"adminNote" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "BugReport_userId_idx" ON "BugReport" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "BugReport_status_idx" ON "BugReport" USING btree ("status");--> statement-breakpoint
CREATE INDEX "BugReport_type_idx" ON "BugReport" USING btree ("type");--> statement-breakpoint
CREATE INDEX "BugReport_createdAt_idx" ON "BugReport" USING btree ("createdAt");