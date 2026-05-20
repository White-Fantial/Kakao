-- Add new staff roles for ad and partner management
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AD_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARTNER_MANAGER';
