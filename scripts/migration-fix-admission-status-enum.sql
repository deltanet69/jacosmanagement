-- ==============================================================================
-- MIGRATION STEP 2: FIX PAYMENT_STATUS ENUM
-- ==============================================================================
-- payment_status saat ini hanya: UNPAID, PARTIAL, PAID
-- Kode kita butuh: PENDING_VERIFICATION, REJECTED

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- Verifikasi:
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status')
ORDER BY enumsortorder;
