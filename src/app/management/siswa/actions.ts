"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      school_classes (name),
      student_parents (*),
      student_guardians (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data || [];
}

export async function importStudents(rows: any[]) {
  const supabase = createAdminClient();

  let successCount = 0;
  let errorCount = 0;

  const { data: existingClasses } = await supabase.from("school_classes").select("id, name");
  const classMap = new Map((existingClasses || []).map(c => [c.name.toLowerCase(), c.id]));

  const studentsToInsert = [];
  const parentsToInsert = [];
  const guardiansToInsert = [];
  
  const validRows = [];

  for (const rawRow of rows) {
    try {
      const row: Record<string, any> = {};
      for (const key in rawRow) {
        if (Object.prototype.hasOwnProperty.call(rawRow, key)) {
          const normalizedKey = key.trim().toUpperCase();
          row[normalizedKey] = rawRow[key];
        }
      }

      const namaLengkap = row["NAMA LENGKAP"] || row["NAMA"] || row["FULL_NAME"] || row["FULL NAME"];
      if (!namaLengkap) {
        errorCount++;
        continue;
      }

      let classId = null;
      const kelasRaw = row["KELAS"] || row["CLASS"];
      const classNameStr = kelasRaw ? String(kelasRaw).trim() : null;
      
      if (classNameStr) {
        const lowerName = classNameStr.toLowerCase();
        if (classMap.has(lowerName)) {
          classId = classMap.get(lowerName);
        } else {
          const gradeMatch = classNameStr.match(/\d+/);
          const grade = gradeMatch ? gradeMatch[0] : "1";
          
          const { data: newClass, error: classError } = await supabase
            .from("school_classes")
            .insert({
              name: classNameStr,
              grade: grade,
              capacity: 25
            })
            .select()
            .single();
            
          if (!classError && newClass) {
            classId = newClass.id;
            classMap.set(lowerName, newClass.id);
          }
        }
      }

      const studentData = {
        nisn: row["NISN (OPSIONAL)"] || row["NISN"] || null,
        nis: row["NIS"] || null,
        full_name: namaLengkap,
        gender: row["GENDER"] || row["JENIS KELAMIN"] || null,
        program: row["JENJANG (JENJANG PENDIDIKAN)"] || row["JENJANG"] || row["PROGRAM"] || null,
        is_active: (row["STATUS"] || "").toUpperCase() === "TIDAK AKTIF" ? false : true,
        profile_picture: row["FOTO PROFIL"] || null,
        birth_place: row["TEMPAT LAHIR"] || null,
        birth_date: row["TANGGAL LAHIR"] ? new Date(row["TANGGAL LAHIR"]).toISOString() : null,
        address: row["ALAMAT"] || null,
        religion: row["AGAMA"] || null,
        family_status: row["STATUS DALAM KELUARGA"] || null,
        rf_id: row["NO RF ID"] || row["RFID"] || row["RF ID"] || null,
        class_id: classId
      };

      studentsToInsert.push(studentData);
      validRows.push(row);
      
    } catch (e) {
      console.error("Error formatting row:", e);
      errorCount++;
    }
  }

  if (studentsToInsert.length > 0) {
    const { data: insertedStudents, error: studentsError } = await supabase
      .from("students")
      .insert(studentsToInsert)
      .select();

    if (studentsError) {
      console.error("Batch insert students failed:", studentsError);
      return { success: false, successCount: 0, errorCount: rows.length, message: studentsError.message };
    }

    if (insertedStudents) {
      for (const student of insertedStudents) {
        const row = validRows.find(r => 
          (r["NAMA LENGKAP"] || r["NAMA"] || r["FULL_NAME"] || r["FULL NAME"]) === student.full_name && 
          ((r["NIS"] || null) === student.nis)
        );

        if (row) {
          successCount++;
          
          const namaAyah = row["NAMA AYAH"];
          const namaIbu = row["NAMA IBU"];
          
          if (namaAyah || namaIbu) {
            parentsToInsert.push({
              student_id: student.id,
              father_name: namaAyah || null,
              mother_name: namaIbu || null,
              father_occupation: row["PEKERJAAN AYAH"] || null,
              mother_occupation: row["PEKERJAAN IBU"] || null,
              father_education: row["PENDIDIKAN AYAH"] || null,
              mother_education: row["PENDIDIKAN IBU"] || null,
              phone_number: row["NOMOR TELEPON ORANG TUA"] || row["NOMOR TELEPON"] || row["NO HP"] || null,
              father_status: row["STATUS AYAH"] || null,
              mother_status: row["STATUS IBU"] || null,
              kip_number: row["NOMOR KIP"] || row["KIP"] || null,
              kip_status: row["STATUS KIP"] || null,
              kks_number: row["NOMOR KKS"] || row["KKS"] || null,
              kis_number: row["NOMOR KIS"] || row["KIS"] || null,
              kps_number: row["NOMOR KPS"] || row["KPS"] || null
            });
          }

          const namaWali = row["NAMA WALI"];
          if (namaWali) {
            guardiansToInsert.push({
              student_id: student.id,
              guardian_name: namaWali,
              occupation: row["PEKERJAAN WALI"] || null,
              education: row["PENDIDIKAN WALI"] || null,
              phone_number: row["NOMOR TELEPON WALI"] || null,
              relation: row["HUBUNGAN KELUARGA"] || null,
              notes: row["KETERANGAN"] || null
            });
          }
        }
      }

      if (parentsToInsert.length > 0) {
        await supabase.from("student_parents").insert(parentsToInsert);
      }
      if (guardiansToInsert.length > 0) {
        await supabase.from("student_guardians").insert(guardiansToInsert);
      }
    }
  }

  revalidatePath("/management/siswa");

  return { success: true, successCount, errorCount };
}
