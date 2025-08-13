-- SQL Syntax Test Script for Atlas Platform Seeding
-- This script validates the syntax without executing inserts

-- Test 1: Check if all tables exist (this will help identify missing tables)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') 
        THEN '✅ branches table exists'
        ELSE '❌ branches table missing'
    END as branches_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'destination_countries') 
        THEN '✅ destination_countries table exists'
        ELSE '❌ destination_countries table missing'
    END as destination_countries_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_countries') 
        THEN '✅ target_countries table exists'
        ELSE '❌ target_countries table missing'
    END as target_countries_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advertising_platforms') 
        THEN '✅ advertising_platforms table exists'
        ELSE '❌ advertising_platforms table missing'
    END as platforms_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_agents') 
        THEN '✅ sales_agents table exists'
        ELSE '❌ sales_agents table missing'
    END as agents_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ users table exists'
        ELSE '❌ users table missing'
    END as users_check;

-- Test 2: Check column existence for sales_agents (the problematic table)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_agents' 
ORDER BY ordinal_position;

-- Test 3: Check UserRole enum values
SELECT 
    enumlabel as user_role_values
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
);

-- Test 4: Validate the CTE syntax (dry run without insert)
WITH agent_data AS (
  SELECT 
    'test-uuid' as id,
    unnest(ARRAY['21','22','23']) as agent_number,
    'test-branch-id' as branch_id
)
SELECT 
    id, 
    agent_number, 
    'Agent ' || agent_number as name, 
    branch_id, 
    true as is_active, 
    NOW() as created_at
FROM agent_data
LIMIT 3;

-- Test 5: Check if uuid_generate_v4() function exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4') 
        THEN '✅ uuid_generate_v4() function available'
        ELSE '❌ uuid_generate_v4() function missing - need CREATE EXTENSION "uuid-ossp"'
    END as uuid_function_check;

-- Test 6: Validate branch names exist (for foreign key references)
SELECT 
    'Branch validation test' as test_name,
    COUNT(*) as existing_branches
FROM branches 
WHERE name IN ('4 Seasons', 'Amazonn', 'Fantastic', 'Skyline');

-- Test 7: Show current table counts (before seeding)
SELECT 
    'Current Data Count' as info,
    (SELECT COUNT(*) FROM branches) as current_branches,
    (SELECT COUNT(*) FROM destination_countries) as current_destinations,
    (SELECT COUNT(*) FROM target_countries) as current_targets,
    (SELECT COUNT(*) FROM advertising_platforms) as current_platforms,
    (SELECT COUNT(*) FROM sales_agents) as current_agents,
    (SELECT COUNT(*) FROM users) as current_users;