CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "clan_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_player_id" uuid NOT NULL,
	"name" "citext" NOT NULL,
	"tag" "citext" NOT NULL,
	"logo_media_id" uuid,
	"description" text NOT NULL,
	"contact_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"clan_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_clan_app_status" CHECK ("clan_applications"."status" IN ('pending', 'approved', 'rejected', 'withdrawn')),
	CONSTRAINT "ck_clan_app_tag" CHECK ("clan_applications"."tag" ~ '^[A-Z0-9]{2,5}$'),
	CONSTRAINT "ck_clan_app_rejection" CHECK (("clan_applications"."status" = 'rejected') = ("clan_applications"."rejection_reason" IS NOT NULL)),
	CONSTRAINT "ck_clan_app_approved_clan" CHECK (("clan_applications"."status" = 'approved') = ("clan_applications"."clan_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "clan_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clan_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"invited_by_player_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "ck_invitation_status" CHECK ("clan_invitations"."status" IN ('pending', 'accepted', 'declined', 'revoked', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "clan_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clan_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by_player_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "ck_join_request_status" CHECK ("clan_join_requests"."status" IN ('pending', 'approved', 'rejected', 'cancelled')),
	CONSTRAINT "ck_join_request_message" CHECK ("clan_join_requests"."message" IS NULL OR char_length("clan_join_requests"."message") <= 280)
);
--> statement-breakpoint
CREATE TABLE "clan_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clan_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"leave_reason" text,
	CONSTRAINT "ck_membership_role" CHECK ("clan_memberships"."role" IN ('leader', 'co_leader', 'member')),
	CONSTRAINT "ck_membership_leave" CHECK (("clan_memberships"."left_at" IS NULL) = ("clan_memberships"."leave_reason" IS NULL)),
	CONSTRAINT "ck_membership_leave_reason" CHECK ("clan_memberships"."leave_reason" IS NULL OR "clan_memberships"."leave_reason" IN ('left', 'kicked'))
);
--> statement-breakpoint
CREATE TABLE "clans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "citext" NOT NULL,
	"tag" "citext" NOT NULL,
	"logo_media_id" uuid,
	"description" text NOT NULL,
	"contact_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_clans_status" CHECK ("clans"."status" IN ('active', 'disbanded')),
	CONSTRAINT "ck_clans_tag" CHECK ("clans"."tag" ~ '^[A-Z0-9]{2,5}$'),
	CONSTRAINT "ck_clans_name" CHECK (char_length("clans"."name") BETWEEN 3 AND 32),
	CONSTRAINT "ck_clans_contact_url" CHECK ("clans"."contact_url" LIKE 'https://%')
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_media_kind" CHECK ("media"."kind" IN ('clan_logo', 'avatar')),
	CONSTRAINT "ck_media_size" CHECK ("media"."byte_size" > 0 AND "media"."width" > 0 AND "media"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" text NOT NULL,
	"game_id_normalized" text NOT NULL,
	"display_name" text NOT NULL,
	"country_code" text NOT NULL,
	"avatar_media_id" uuid,
	"bio" text,
	"game_id_verified_at" timestamp with time zone,
	"game_id_verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_player_country" CHECK ("player_profiles"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "ck_player_display_name" CHECK (char_length("player_profiles"."display_name") BETWEEN 2 AND 24),
	CONSTRAINT "ck_player_bio" CHECK ("player_profiles"."bio" IS NULL OR char_length("player_profiles"."bio") <= 280),
	CONSTRAINT "ck_player_game_id" CHECK ("player_profiles"."game_id_normalized" ~ '^[A-Z0-9]{4,24}$')
);
--> statement-breakpoint
ALTER TABLE "clan_applications" ADD CONSTRAINT "clan_applications_applicant_player_id_player_profiles_id_fk" FOREIGN KEY ("applicant_player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_applications" ADD CONSTRAINT "clan_applications_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_applications" ADD CONSTRAINT "clan_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_applications" ADD CONSTRAINT "clan_applications_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_invitations" ADD CONSTRAINT "clan_invitations_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_invitations" ADD CONSTRAINT "clan_invitations_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_invitations" ADD CONSTRAINT "clan_invitations_invited_by_player_id_player_profiles_id_fk" FOREIGN KEY ("invited_by_player_id") REFERENCES "public"."player_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_join_requests" ADD CONSTRAINT "clan_join_requests_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_join_requests" ADD CONSTRAINT "clan_join_requests_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_join_requests" ADD CONSTRAINT "clan_join_requests_decided_by_player_id_player_profiles_id_fk" FOREIGN KEY ("decided_by_player_id") REFERENCES "public"."player_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_memberships" ADD CONSTRAINT "clan_memberships_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_memberships" ADD CONSTRAINT "clan_memberships_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clans" ADD CONSTRAINT "clans_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_avatar_media_id_media_id_fk" FOREIGN KEY ("avatar_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_game_id_verified_by_users_id_fk" FOREIGN KEY ("game_id_verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clan_app_pending_applicant" ON "clan_applications" USING btree ("applicant_player_id") WHERE "clan_applications"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clan_app_pending_name" ON "clan_applications" USING btree ("name") WHERE "clan_applications"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clan_app_pending_tag" ON "clan_applications" USING btree ("tag") WHERE "clan_applications"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clan_app_clan" ON "clan_applications" USING btree ("clan_id");--> statement-breakpoint
CREATE INDEX "ix_clan_app_status_created" ON "clan_applications" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invitation_pending" ON "clan_invitations" USING btree ("clan_id","player_id") WHERE "clan_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "ix_invitation_player_pending" ON "clan_invitations" USING btree ("player_id") WHERE "clan_invitations"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_join_request_pending" ON "clan_join_requests" USING btree ("clan_id","player_id") WHERE "clan_join_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "ix_join_request_player_pending" ON "clan_join_requests" USING btree ("player_id") WHERE "clan_join_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_one_active_membership" ON "clan_memberships" USING btree ("player_id") WHERE "clan_memberships"."left_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_one_leader" ON "clan_memberships" USING btree ("clan_id") WHERE "clan_memberships"."role" = 'leader' AND "clan_memberships"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ix_memberships_clan_active" ON "clan_memberships" USING btree ("clan_id") WHERE "clan_memberships"."left_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clans_name" ON "clans" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clans_tag" ON "clans" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "ix_clans_name_trgm" ON "clans" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_media_storage_key" ON "media" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "ix_media_owner" ON "media" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_player_user" ON "player_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_player_game_id" ON "player_profiles" USING btree ("game_id_normalized");