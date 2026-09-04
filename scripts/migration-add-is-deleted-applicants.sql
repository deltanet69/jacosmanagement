-- Migration: Add is_deleted column to applicants table
-- This supports soft-deleting dummy data and rejected registrations.

ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create an index to optimize queries filtering out deleted records
CREATE INDEX IF NOT EXISTS idx_applicants_is_deleted ON public.applicants(is_deleted);
