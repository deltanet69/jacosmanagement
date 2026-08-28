import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const tables = ['applicants', 'guardians', 'students', 'student_parents', 'student_guardians'];
  for (const t of tables) {
    const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` }
    });
    const data = await res.json();
    console.log(`TABLE ${t}:`, data && data[0] ? Object.keys(data[0]) : data);
  }
}

test();

