-- Atlas Platform Database Seeding Script for Supabase
-- Run this script in Supabase SQL Editor or via CLI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert Branches
INSERT INTO branches (id, name, code, created_at) VALUES
(uuid_generate_v4(), '4 Seasons', '4SEASONS', NOW()),
(uuid_generate_v4(), 'Amazonn', 'AMAZONN', NOW()),
(uuid_generate_v4(), 'Fantastic', 'FANTASTIC', NOW()),
(uuid_generate_v4(), 'Skyline', 'SKYLINE', NOW())
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

-- Insert Sales Agents
-- 4 Seasons agents (21-30)
INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at)
SELECT 
    uuid_generate_v4(), 
    '21', 
    'Agent 21', 
    b.id, 
    true, 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '22', 
    'Agent 22', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '23', 
    'Agent 23', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '24', 
    'Agent 24', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '25', 
    'Agent 25', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '26', 
    'Agent 26', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '27', 
    'Agent 27', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '28', 
    'Agent 28', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '29', 
    'Agent 29', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '30', 
    'Agent 30', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = '4 Seasons'
ON CONFLICT (agent_number) DO NOTHING;

-- Amazonn agents (31-40)
INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '31', 
    'Agent 31', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '32', 
    'Agent 32', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '33', 
    'Agent 33', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '34', 
    'Agent 34', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '35', 
    'Agent 35', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '36', 
    'Agent 36', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '37', 
    'Agent 37', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '38', 
    'Agent 38', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '39', 
    'Agent 39', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '40', 
    'Agent 40', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Amazonn'
ON CONFLICT (agent_number) DO NOTHING;

-- Fantastic agents (41-50)
INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '41', 
    'Agent 41', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '42', 
    'Agent 42', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '43', 
    'Agent 43', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '44', 
    'Agent 44', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '45', 
    'Agent 45', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '46', 
    'Agent 46', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '47', 
    'Agent 47', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '48', 
    'Agent 48', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '49', 
    'Agent 49', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '50', 
    'Agent 50', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Fantastic'
ON CONFLICT (agent_number) DO NOTHING;

-- Skyline agents (51-62)
INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '51', 
    'Agent 51', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '52', 
    'Agent 52', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '53', 
    'Agent 53', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '54', 
    'Agent 54', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '55', 
    'Agent 55', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '56', 
    'Agent 56', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '57', 
    'Agent 57', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '58', 
    'Agent 58', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '59', 
    'Agent 59', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '60', 
    'Agent 60', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '61', 
    'Agent 61', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
ON CONFLICT (agent_number) DO NOTHING;

INSERT INTO sales_agents (id, agent_number, name, branch_id, is_active, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    '62', 
    'Agent 62', 
    b.id, 
    true, 
    NOW(), 
    NOW()
FROM branches b WHERE b.name = 'Skyline'
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