-- Fixed Atlas Platform Database Seeding Script for Supabase
-- Run this script in Supabase SQL Editor or via CLI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert Branches
INSERT INTO branches (id, name, code, created_at, updated_at) VALUES
(uuid_generate_v4(), '4 Seasons', '4SEASONS', NOW(), NOW()),
(uuid_generate_v4(), 'Amazonn', 'AMAZONN', NOW(), NOW()),
(uuid_generate_v4(), 'Fantastic', 'FANTASTIC', NOW(), NOW()),
(uuid_generate_v4(), 'Skyline', 'SKYLINE', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert Destination Countries
INSERT INTO destination_countries (id, name, code, created_at) VALUES
(uuid_generate_v4(), 'Armenia', 'AM', NOW()),
(uuid_generate_v4(), 'Azerbaijan', 'AZ', NOW()),
(uuid_generate_v4(), 'Georgia', 'GE', NOW()),
(uuid_generate_v4(), 'Kazakhstan', 'KZ', NOW()),
(uuid_generate_v4(), 'Kyrgyzstan', 'KG', NOW()),
(uuid_generate_v4(), 'Russia', 'RU', NOW()),
(uuid_generate_v4(), 'Tajikistan', 'TJ', NOW()),
(uuid_generate_v4(), 'Turkey', 'TR', NOW()),
(uuid_generate_v4(), 'Turkmenistan', 'TM', NOW()),
(uuid_generate_v4(), 'Uzbekistan', 'UZ', NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert Target Countries
INSERT INTO target_countries (id, name, code, created_at) VALUES
(uuid_generate_v4(), 'United Arab Emirates', 'UAE', NOW()),
(uuid_generate_v4(), 'Saudi Arabia', 'KSA', NOW()),
(uuid_generate_v4(), 'Kuwait', 'KWT', NOW()),
(uuid_generate_v4(), 'Qatar', 'QAT', NOW()),
(uuid_generate_v4(), 'Bahrain', 'BHR', NOW()),
(uuid_generate_v4(), 'Oman', 'OMN', NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert Advertising Platforms
INSERT INTO advertising_platforms (id, name, created_at) VALUES
(uuid_generate_v4(), 'Meta', NOW()),
(uuid_generate_v4(), 'Google', NOW()),
(uuid_generate_v4(), 'TikTok', NOW()),
(uuid_generate_v4(), 'Snapchat', NOW()),
(uuid_generate_v4(), 'Twitter', NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Sales Agents using bulk insert with CTE
WITH agent_data AS (
  SELECT 
    uuid_generate_v4() as id,
    unnest(ARRAY['21','22','23','24','25','26','27','28','29','30']) as agent_number,
    (SELECT id FROM branches WHERE name = '4 Seasons') as branch_id
  UNION ALL
  SELECT 
    uuid_generate_v4() as id,
    unnest(ARRAY['31','32','33','34','35','36','37','38','39','40']) as agent_number,
    (SELECT id FROM branches WHERE name = 'Amazonn') as branch_id
  UNION ALL
  SELECT 
    uuid_generate_v4() as id,
    unnest(ARRAY['41','42','43','44','45','46','47','48','49','50']) as agent_number,
    (SELECT id FROM branches WHERE name = 'Fantastic') as branch_id
  UNION ALL
  SELECT 
    uuid_generate_v4() as id,
    unnest(ARRAY['51','52','53','54','55','56','57','58','59','60','61','62']) as agent_number,
    (SELECT id FROM branches WHERE name = 'Skyline') as branch_id
)
INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at)
SELECT id, agent_number, 'Agent ' || agent_number, branch_id, true, NOW()
FROM agent_data
ON CONFLICT (agent_number) DO NOTHING;

-- Create System User (for internal operations)
INSERT INTO users (id, email, password_hash, role, name, is_active, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'system@atlas.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'SUPER_ADMIN',
    'System User',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create Admin User
INSERT INTO users (id, email, password_hash, role, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'admin@atlas.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'ADMIN',
    'Atlas Administrator',
    b.id,
    true,
    NOW(),
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (email) DO NOTHING;

-- Create Media Buyer Users for each branch
INSERT INTO users (id, email, password_hash, role, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'media.buyer@4seasons.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'MEDIA_BUYER',
    'Media Buyer - 4 Seasons',
    b.id,
    true,
    NOW(),
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, role, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'media.buyer@amazonn.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'MEDIA_BUYER',
    'Media Buyer - Amazonn',
    b.id,
    true,
    NOW(),
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, role, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'media.buyer@fantastic.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'MEDIA_BUYER',
    'Media Buyer - Fantastic',
    b.id,
    true,
    NOW(),
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, role, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'media.buyer@skyline.com',
    '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', -- password123
    'MEDIA_BUYER',
    'Media Buyer - Skyline',
    b.id,
    true,
    NOW(),
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (email) DO NOTHING;

-- Verify the seeding results
SELECT 
    'Database Seeding Complete!' as status,
    (SELECT COUNT(*) FROM branches) as branches_count,
    (SELECT COUNT(*) FROM destination_countries) as destination_countries_count,
    (SELECT COUNT(*) FROM target_countries) as target_countries_count,
    (SELECT COUNT(*) FROM advertising_platforms) as platforms_count,
    (SELECT COUNT(*) FROM sales_agents) as agents_count,
    (SELECT COUNT(*) FROM users) as users_count;

-- Show admin user details
SELECT 
    'Admin User Created:' as info,
    email,
    name,
    role,
    (SELECT name FROM branches WHERE id = users.branch_id) as branch
FROM users 
WHERE email = 'admin@atlas.com';

-- Show admin credentials
SELECT 'ADMIN LOGIN:' as info, 'admin@atlas.com' as email, 'password123' as password;