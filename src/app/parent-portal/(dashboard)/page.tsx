import { createParentServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getParentDashboardData, getParentAnnouncements } from '@/app/parent-portal/actions';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const supabase = await createParentServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // No session — layout's useEffect will redirect; render empty for now
  if (!session) {
    return null;
  }

  const user = session.user;
  const userEmail = user.email;
  const studentIdFromMeta = user.user_metadata?.student_id;
  const applicantIdFromMeta = user.user_metadata?.applicant_id;
  const parentName = user.user_metadata?.full_name || 'Orang Tua';

  // Fetch dashboard data + announcements in parallel — server side, zero client latency
  const [dashboardRes, annRes] = await Promise.all([
    getParentDashboardData(
      applicantIdFromMeta || null,
      userEmail || null,
      studentIdFromMeta || null
    ),
    getParentAnnouncements(),
  ]);

  const announcements = annRes.success && annRes.data ? annRes.data : [];
  const { applicantData, applicantId, studentId } = dashboardRes;

  // Resolve agreement doc
  let agreementDoc: any = null;
  if (applicantData?.doc_jacos_agreement) {
    agreementDoc = {
      file_path: applicantData.doc_jacos_agreement,
      status: applicantData.doc_jacos_agreement_status || 'PENDING',
      verification: applicantData.doc_jacos_agreement_status || 'PENDING',
      review_note: applicantData.doc_jacos_agreement_note || null,
    };
  } else if (applicantData?.documents) {
    agreementDoc = applicantData.documents.find((d: any) => d.type === 'JACOS_AGREEMENT') || null;
  }

  // Resolve admission status
  let status = 'Approved';
  if (applicantData) {
    if (applicantData.status === 'ENROLLED' || applicantData.student_record_id) {
      status = 'Approved';
    } else if (applicantData.status === 'REJECTED') {
      status = 'Rejected';
    } else {
      status = 'Waiting for approval';
    }
  } else if (studentIdFromMeta) {
    status = 'Approved';
  }

  // Resolve student record
  const adminClient = createAdminClient();
  let student: any = null;
  const resolvedStudentId = studentId || applicantData?.student_record_id;

  if (resolvedStudentId) {
    const { data } = await adminClient
      .from('students')
      .select('id, full_name, nis, nisn, school_classes(name, grade)')
      .eq('id', resolvedStudentId)
      .maybeSingle();
    if (data) student = data;
  }

  // Fallback: guardians by email
  if (!student && userEmail) {
    const { data: guardians } = await adminClient
      .from('guardians')
      .select('applicant_id, applicants(student_record_id)')
      .eq('email', userEmail.toLowerCase())
      .limit(1);

    const studentRecordId = (guardians?.[0] as any)?.applicants?.student_record_id;
    if (studentRecordId) {
      const { data } = await adminClient
        .from('students')
        .select('id, full_name, nis, nisn, school_classes(name, grade)')
        .eq('id', studentRecordId)
        .maybeSingle();
      if (data) student = data;
    }
  }

  return (
    <DashboardClient
      student={student}
      parentName={parentName}
      applicantId={applicantId}
      agreementDoc={agreementDoc}
      announcements={announcements}
      status={status}
    />
  );
}
