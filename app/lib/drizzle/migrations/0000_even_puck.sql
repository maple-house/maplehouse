CREATE TABLE "user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" varchar(200) NOT NULL,
	"last_name" varchar(200) NOT NULL,
	"email" varchar(250),
	"contact" varchar(10) NOT NULL,
	"gender" varchar(10) NOT NULL,
	"address" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_contact_unique" UNIQUE("contact")
);
