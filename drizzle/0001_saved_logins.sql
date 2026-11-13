CREATE TABLE "saved_login" (
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"username" text NOT NULL,
	"password_enc" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_login_user_id_app_id_pk" PRIMARY KEY("user_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "saved_login" ADD CONSTRAINT "saved_login_user_id_user_account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account_user"("id") ON DELETE cascade ON UPDATE no action;