-- ==============================================================================
-- TNV WORKSHOP — CERTIFICATES FORCE ISSUE ENHANCEMENT
-- Migration: 20240101000008_add_force_issued_to_certificates.sql
-- ==============================================================================

ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS is_force_issued BOOLEAN DEFAULT FALSE;
