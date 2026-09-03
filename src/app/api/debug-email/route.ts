import { NextResponse } from "next/server";
import { sendFormWaitingApprovalEmail } from "@/lib/email";

export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  const parentUrl = process.env.NEXT_PUBLIC_PARENT_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return NextResponse.json({
    env: {
      RESEND_API_KEY: resendKey ? `SET (starts: ${resendKey.substring(0, 8)}...)` : "NOT SET",
      NEXT_PUBLIC_PARENT_URL: parentUrl || "NOT SET",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "SET" : "NOT SET",
    },
  });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
    const result = await sendFormWaitingApprovalEmail({
      parentName: "Test Orang Tua",
      parentEmail: email,
      studentName: "Test Siswa",
      registrationNo: "JCS-2026-TEST",
      program: "Primary School",
    });
    return NextResponse.json({ result, resend_key_set: !!process.env.RESEND_API_KEY });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
