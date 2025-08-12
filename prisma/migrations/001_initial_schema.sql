-- Atlas Platform Database Schema
-- This file creates all tables and initial structure for the Atlas Travel Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE "user_role" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN', 
  'BRANCH_MANAGER',
  'MEDIA_BUYER',
  'SALES_AGENT',
  'ANALYST',
  'VIEWER'
);

CREATE TYPE "quality_rating" AS ENUM (
  'below_standard',
  'standard',
  'good',
  'excellent',
  'best_quality'
);

-- Branches table
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "code" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- Users table
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR NOT NULL,
    "password_hash" VARCHAR NOT NULL,
    "role" "user_role" NOT NULL,
    "name" VARCHAR NOT NULL,
    "branch_id" UUID,
    "agent_number" VARCHAR,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "email_verified_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- User Sessions table
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR,
    "user_agent" VARCHAR,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- Audit Logs table
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "user_email" VARCHAR NOT NULL,
    "action" VARCHAR NOT NULL,
    "resource" VARCHAR NOT NULL,
    "resource_id" VARCHAR,
    "details" JSONB NOT NULL,
    "ip_address" VARCHAR NOT NULL,
    "user_agent" VARCHAR NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" UUID,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Sales Agents table
CREATE TABLE "sales_agents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_number" VARCHAR NOT NULL,
    "name" VARCHAR,
    "branch_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_agents_pkey" PRIMARY KEY ("id")
);

-- Destination Countries table
CREATE TABLE "destination_countries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "code" VARCHAR NOT NULL,

    CONSTRAINT "destination_countries_pkey" PRIMARY KEY ("id")
);

-- Target Countries table
CREATE TABLE "target_countries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "code" VARCHAR NOT NULL,

    CONSTRAINT "target_countries_pkey" PRIMARY KEY ("id")
);

-- Advertising Platforms table
CREATE TABLE "advertising_platforms" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "advertising_platforms_pkey" PRIMARY KEY ("id")
);

-- Media Reports table
CREATE TABLE "media_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "branch_id" UUID NOT NULL,
    "media_buyer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "media_reports_pkey" PRIMARY KEY ("id")
);

-- Media Country Data table
CREATE TABLE "media_country_data" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "target_country_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_country_data_pkey" PRIMARY KEY ("id")
);

-- Media Agent Data table
CREATE TABLE "media_agent_data" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "country_data_id" UUID NOT NULL,
    "sales_agent_id" UUID NOT NULL,
    "campaign_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_agent_data_pkey" PRIMARY KEY ("id")
);

-- Campaign Details table
CREATE TABLE "campaign_details" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agent_data_id" UUID NOT NULL,
    "destination_country_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "platform_id" UUID NOT NULL,
    "campaign_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_details_pkey" PRIMARY KEY ("id")
);

-- Sales Reports table
CREATE TABLE "sales_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "branch_id" UUID NOT NULL,
    "sales_agent_id" UUID NOT NULL,
    "media_buyer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "sales_reports_pkey" PRIMARY KEY ("id")
);

-- Sales Country Data table
CREATE TABLE "sales_country_data" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "target_country_id" UUID NOT NULL,
    "deals_closed" INTEGER NOT NULL,
    "whatsapp_messages" INTEGER NOT NULL,
    "quality_rating" "quality_rating" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_country_data_pkey" PRIMARY KEY ("id")
);

-- Deal Destinations table
CREATE TABLE "deal_destinations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "country_data_id" UUID NOT NULL,
    "destination_country_id" UUID NOT NULL,
    "deal_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_destinations_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");
CREATE UNIQUE INDEX "sales_agents_agent_number_key" ON "sales_agents"("agent_number");
CREATE UNIQUE INDEX "destination_countries_code_key" ON "destination_countries"("code");
CREATE UNIQUE INDEX "target_countries_code_key" ON "target_countries"("code");
CREATE UNIQUE INDEX "campaign_details_agent_data_id_campaign_number_key" ON "campaign_details"("agent_data_id", "campaign_number");
CREATE UNIQUE INDEX "deal_destinations_country_data_id_deal_number_key" ON "deal_destinations"("country_data_id", "deal_number");

-- Create foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_agents" ADD CONSTRAINT "sales_agents_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_reports" ADD CONSTRAINT "media_reports_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_reports" ADD CONSTRAINT "media_reports_media_buyer_id_fkey" FOREIGN KEY ("media_buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_country_data" ADD CONSTRAINT "media_country_data_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "media_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_country_data" ADD CONSTRAINT "media_country_data_target_country_id_fkey" FOREIGN KEY ("target_country_id") REFERENCES "target_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_agent_data" ADD CONSTRAINT "media_agent_data_country_data_id_fkey" FOREIGN KEY ("country_data_id") REFERENCES "media_country_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_agent_data" ADD CONSTRAINT "media_agent_data_sales_agent_id_fkey" FOREIGN KEY ("sales_agent_id") REFERENCES "sales_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign_details" ADD CONSTRAINT "campaign_details_agent_data_id_fkey" FOREIGN KEY ("agent_data_id") REFERENCES "media_agent_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_details" ADD CONSTRAINT "campaign_details_destination_country_id_fkey" FOREIGN KEY ("destination_country_id") REFERENCES "destination_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign_details" ADD CONSTRAINT "campaign_details_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "advertising_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_reports" ADD CONSTRAINT "sales_reports_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_reports" ADD CONSTRAINT "sales_reports_sales_agent_id_fkey" FOREIGN KEY ("sales_agent_id") REFERENCES "sales_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_reports" ADD CONSTRAINT "sales_reports_media_buyer_id_fkey" FOREIGN KEY ("media_buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_country_data" ADD CONSTRAINT "sales_country_data_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "sales_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_country_data" ADD CONSTRAINT "sales_country_data_target_country_id_fkey" FOREIGN KEY ("target_country_id") REFERENCES "target_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_destinations" ADD CONSTRAINT "deal_destinations_country_data_id_fkey" FOREIGN KEY ("country_data_id") REFERENCES "sales_country_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_destinations" ADD CONSTRAINT "deal_destinations_destination_country_id_fkey" FOREIGN KEY ("destination_country_id") REFERENCES "destination_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add check constraints
ALTER TABLE "campaign_details" ADD CONSTRAINT "campaign_details_campaign_count_check" CHECK ("campaign_number" > 0);
ALTER TABLE "campaign_details" ADD CONSTRAINT "campaign_details_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "media_agent_data" ADD CONSTRAINT "media_agent_data_campaign_count_check" CHECK ("campaign_count" > 0);
ALTER TABLE "sales_country_data" ADD CONSTRAINT "sales_country_data_deals_closed_check" CHECK ("deals_closed" >= 0);
ALTER TABLE "sales_country_data" ADD CONSTRAINT "sales_country_data_whatsapp_messages_check" CHECK ("whatsapp_messages" >= 0);