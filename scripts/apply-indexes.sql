-- Atlas Platform Production Performance Indexes
-- Run this script against your production database as a database administrator

-- Performance optimization indexes for Atlas platform
-- These indexes will dramatically improve query performance for dashboard and navigation

BEGIN;

-- Critical indexes for media reports and analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_reports_date_media_buyer_branch 
ON media_reports(date, media_buyer_id, branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_reports_created_at_desc 
ON media_reports(created_at DESC);

-- Campaign details optimization for aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_details_created_at_amount 
ON campaign_details(created_at, amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_details_agent_data_platform 
ON campaign_details(agent_data_id, platform_id, amount);

-- Sales performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_reports_date_media_buyer_agent 
ON sales_reports(date, media_buyer_id, sales_agent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_reports_created_at_desc 
ON sales_reports(created_at DESC);

-- Sales country data for dashboard stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_country_data_created_at_deals 
ON sales_country_data(created_at, deals_closed);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_country_data_report_target_country 
ON sales_country_data(report_id, target_country_id);

-- Master data lookup optimization (for convertCodesToUUIDs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_target_countries_code 
ON target_countries(code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_destination_countries_code 
ON destination_countries(code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_agents_agent_number 
ON sales_agents(agent_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_code 
ON branches(code);

-- Relationship indexes for joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_country_data_report_target 
ON media_country_data(report_id, target_country_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_agent_data_country_sales_agent 
ON media_agent_data(country_data_id, sales_agent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_destinations_country_destination 
ON deal_destinations(country_data_id, destination_country_id);

-- Audit and monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_reports_user_date 
ON media_reports(created_by, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_reports_user_date 
ON sales_reports(created_by, created_at);

COMMIT;

-- Performance monitoring queries to run after applying indexes
-- Run these to verify index effectiveness:

/*
-- Query to check index usage:
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Query to check table sizes and index sizes:
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to identify slow queries (enable pg_stat_statements first):
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
*/