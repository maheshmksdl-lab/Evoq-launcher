CREATE TABLE "access_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_account_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'manager' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admin_account_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "admin_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_setting" (
	"app_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_event" (
	"id" text PRIMARY KEY NOT NULL,
	"realm" text NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"success" boolean NOT NULL,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "role_permission_role_permission_pk" PRIMARY KEY("role","permission")
);
--> statement-breakpoint
CREATE TABLE "system_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_account_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"title" text,
	"phone" text,
	"notify_new_sign_in" boolean DEFAULT true NOT NULL,
	"notify_access" boolean DEFAULT true NOT NULL,
	"notify_security" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "user_account_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_app_access" (
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_app_access_user_id_app_id_pk" PRIMARY KEY("user_id","app_id")
);
--> statement-breakpoint
CREATE TABLE "user_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "user_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_credential" ADD CONSTRAINT "admin_credential_user_id_admin_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_user_id_admin_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_two_factor" ADD CONSTRAINT "admin_two_factor_user_id_admin_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credential" ADD CONSTRAINT "user_credential_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_request_status_idx" ON "access_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_credential_user_idx" ON "admin_credential" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_session_user_idx" ON "admin_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_two_factor_user_idx" ON "admin_two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_two_factor_secret_idx" ON "admin_two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_event_email_idx" ON "login_event" USING btree ("realm","email","created_at");--> statement-breakpoint
CREATE INDEX "login_event_created_idx" ON "login_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_credential_user_idx" ON "user_credential" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_session_user_idx" ON "user_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_two_factor_user_idx" ON "user_two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_two_factor_secret_idx" ON "user_two_factor" USING btree ("secret");