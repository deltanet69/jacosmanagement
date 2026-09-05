-- =========================================================================
-- DATABASE PERFORMANCE OPTIMIZATION INDEXES FOR JACOS MANAGEMENT SYSTEM
-- =========================================================================

-- 1. Applicants Table Indexes
CREATE INDEX IF NOT EXISTS idx_applicants_status_is_deleted 
  ON applicants(status, is_deleted) 
  WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_applicants_submitted_at 
  ON applicants(submitted_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_applicants_reg_token 
  ON applicants(registration_token) 
  WHERE registration_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applicants_reg_no 
  ON applicants(registration_no);

CREATE INDEX IF NOT EXISTS idx_applicants_payment_status 
  ON applicants(payment_status);

-- 2. Guardians Table Indexes
CREATE INDEX IF NOT EXISTS idx_guardians_applicant_id 
  ON guardians(applicant_id);

CREATE INDEX IF NOT EXISTS idx_guardians_email 
  ON guardians(email);

CREATE INDEX IF NOT EXISTS idx_guardians_phone 
  ON guardians(phone);

-- 3. Students Table Indexes
CREATE INDEX IF NOT EXISTS idx_students_active_program 
  ON students(is_active, program);

CREATE INDEX IF NOT EXISTS idx_students_class_id 
  ON students(class_id);

CREATE INDEX IF NOT EXISTS idx_students_nis 
  ON students(nis);

CREATE INDEX IF NOT EXISTS idx_students_nisn 
  ON students(nisn);

CREATE INDEX IF NOT EXISTS idx_students_applicant_id 
  ON students(applicant_id);

CREATE INDEX IF NOT EXISTS idx_students_created_at 
  ON students(created_at DESC);

-- 4. Open House Registrations Table Indexes
CREATE INDEX IF NOT EXISTS idx_open_house_created_at 
  ON open_house_registrations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_open_house_lead_status 
  ON open_house_registrations(lead_status);

CREATE INDEX IF NOT EXISTS idx_open_house_target_prog 
  ON open_house_registrations(target_program);

CREATE INDEX IF NOT EXISTS idx_open_house_ticket_code 
  ON open_house_registrations(ticket_code);

-- 5. Staff Attendance Table Indexes
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date 
  ON staff_attendance(date, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_status 
  ON staff_attendance(status);

-- 6. Student Attendance Table Indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_date 
  ON student_attendance(date, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_student_attendance_student_date 
  ON student_attendance(student_id, date);

-- 7. Pickup Queue Table Indexes
CREATE INDEX IF NOT EXISTS idx_pickup_queue_date_status 
  ON pickup_queue(pickup_date, status);

CREATE INDEX IF NOT EXISTS idx_pickup_queue_student 
  ON pickup_queue(student_id);

-- 8. School Classes Table Indexes
CREATE INDEX IF NOT EXISTS idx_school_classes_grade 
  ON school_classes(grade);

-- Verification: Menampilkan seluruh indeks yang terpasang
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY
    tablename,
    indexname;
