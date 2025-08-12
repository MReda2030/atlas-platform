-- Performance optimization indexes for Atlas platform
-- Migration created: 2025-08-12T12:30:00.000Z

-- Critical indexes for media reports and analytics
CREATE INDEX IF NOT EXISTS "idx_media_reports_date_media_buyer_branch" 
ON "media_reports"("date", "media_buyer_id", "branch_id");

CREATE INDEX IF NOT EXISTS "idx_media_reports_created_at_desc" 
ON "media_reports"("created_at" DESC);

-- Campaign details optimization for aggregations
CREATE INDEX IF NOT EXISTS "idx_campaign_details_created_at_amount" 
ON "campaign_details"("created_at", "amount");

CREATE INDEX IF NOT EXISTS "idx_campaign_details_agent_data_platform" 
ON "campaign_details"("agent_data_id", "platform_id", "amount");

-- Sales performance indexes
CREATE INDEX IF NOT EXISTS "idx_sales_reports_date_media_buyer_agent" 
ON "sales_reports"("date", "media_buyer_id", "sales_agent_id");

CREATE INDEX IF NOT EXISTS "idx_sales_reports_created_at_desc" 
ON "sales_reports"("created_at" DESC);

-- Sales country data for dashboard stats
CREATE INDEX IF NOT EXISTS "idx_sales_country_data_created_at_deals" 
ON "sales_country_data"("created_at", "deals_closed");

CREATE INDEX IF NOT EXISTS "idx_sales_country_data_report_target_country" 
ON "sales_country_data"("report_id", "target_country_id");

-- Master data lookup optimization (for convertCodesToUUIDs)
CREATE INDEX IF NOT EXISTS "idx_target_countries_code" 
ON "target_countries"("code");

CREATE INDEX IF NOT EXISTS "idx_destination_countries_code" 
ON "destination_countries"("code");

CREATE INDEX IF NOT EXISTS "idx_sales_agents_agent_number" 
ON "sales_agents"("agent_number");

CREATE INDEX IF NOT EXISTS "idx_branches_code" 
ON "branches"("code");

-- Relationship indexes for joins
CREATE INDEX IF NOT EXISTS "idx_media_country_data_report_target" 
ON "media_country_data"("report_id", "target_country_id");

CREATE INDEX IF NOT EXISTS "idx_media_agent_data_country_sales_agent" 
ON "media_agent_data"("country_data_id", "sales_agent_id");

CREATE INDEX IF NOT EXISTS "idx_deal_destinations_country_destination" 
ON "deal_destinations"("country_data_id", "destination_country_id");