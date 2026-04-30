import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { recordAudit } from "@/lib/audit";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const generateTempPassword = () => randomBytes(9).toString("base64url");

// Map common grade strings to our enum values
function parseGradeLevel(raw: string): string | null {
  if (!raw) return null;
  const s = raw.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  const map: Record<string, string> = {
    prek: "PRE_K", preK: "PRE_K", "pre-k": "PRE_K", preschool: "PRE_K",
    pk: "PRE_K", "pre k": "PRE_K",
    k: "KINDERGARTEN", kinder: "KINDERGARTEN", kindergarten: "KINDERGARTEN",
    "1": "GRADE_1", "1st": "GRADE_1", first: "GRADE_1", grade1: "GRADE_1", "1stgrade": "GRADE_1",
    "2": "GRADE_2", "2nd": "GRADE_2", second: "GRADE_2", grade2: "GRADE_2", "2ndgrade": "GRADE_2",
    "3": "GRADE_3", "3rd": "GRADE_3", third: "GRADE_3", grade3: "GRADE_3", "3rdgrade": "GRADE_3",
    "4": "GRADE_4", "4th": "GRADE_4", fourth: "GRADE_4", grade4: "GRADE_4", "4thgrade": "GRADE_4",
    "5": "GRADE_5", "5th": "GRADE_5", fifth: "GRADE_5", grade5: "GRADE_5", "5thgrade": "GRADE_5",
    "6": "GRADE_6", "6th": "GRADE_6", sixth: "GRADE_6", grade6: "GRADE_6", "6thgrade": "GRADE_6",
    "7": "GRADE_7", "7th": "GRADE_7", seventh: "GRADE_7", grade7: "GRADE_7", "7thgrade": "GRADE_7",
    "8": "GRADE_8", "8th": "GRADE_8", eighth: "GRADE_8", grade8: "GRADE_8", "8thgrade": "GRADE_8",
    adult: "ADULT",
  };

  return map[s] ?? null;
}

// Try to find the right column name from headers
function findColumn(headers: string[], ...candidates: string[]): string | null {
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().replace(/[^a-z]/g, "") === c.toLowerCase().replace(/[^a-z]/g, ""));
    if (found) return found;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const userId = (session.user as { id?: string })?.id;
  if (!["ADMIN", "DIRECTOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Bulk imports are expensive; cap to a small handful per hour per actor.
  const limit = rateLimit({
    key: clientKey(req, "students-import", userId),
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) return rateLimitResponse(limit);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, any>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Spreadsheet is empty" }, { status: 400 });
    }

    const headers = Object.keys(rows[0]);

    // Find columns flexibly
    const firstNameCol = findColumn(headers, "firstname", "first name", "first", "fname", "student first name");
    const lastNameCol = findColumn(headers, "lastname", "last name", "last", "lname", "student last name");
    const fullNameCol = findColumn(headers, "name", "student name", "full name", "student", "child name", "childs name", "child");
    const gradeCol = findColumn(headers, "grade", "grade level", "gradelevel", "class", "level");
    const dobCol = findColumn(headers, "dob", "date of birth", "dateofbirth", "birthday", "birthdate", "birth date");
    const addressCol = findColumn(headers, "address", "home address", "street address");
    const parentCol = findColumn(headers, "parent", "parent name", "guardian", "parent guardian", "parentguardian", "mother", "father");
    const phoneCol = findColumn(headers, "phone", "phone number", "parent phone", "contact", "contact number");
    const emailCol = findColumn(headers, "email", "parent email", "contact email");

    const hasNameParts = firstNameCol && lastNameCol;
    const hasFullName = fullNameCol;

    if (!hasNameParts && !hasFullName) {
      return NextResponse.json({
        error: `Could not find name columns. Found: ${headers.join(", ")}. Need "First Name" + "Last Name" or "Student Name"`,
      }, { status: 400 });
    }

    // Get existing classes for auto-enrollment
    const allClasses = await prisma.class.findMany({ where: { active: true } });

    const results = {
      imported: 0,
      skipped: 0,
      parentsCreated: 0,
      parentsLinked: 0,
      errors: [] as string[],
      students: [] as Array<{ name: string; grade: string; enrolled: string; parentAdded?: string }>,
      tempPasswords: [] as Array<{ email: string; password: string }>,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      let firstName = "";
      let lastName = "";

      if (hasNameParts) {
        firstName = String(row[firstNameCol!] ?? "").trim();
        lastName = String(row[lastNameCol!] ?? "").trim();
      } else if (hasFullName) {
        const fullName = String(row[fullNameCol!] ?? "").trim();
        if (!fullName) { results.skipped++; continue; }
        // Handle "Last, First" or "First Last"
        if (fullName.includes(",")) {
          const parts = fullName.split(",").map(s => s.trim());
          lastName = parts[0] || "";
          firstName = parts[1] || "";
        } else {
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }
      }

      if (!firstName && !lastName) { results.skipped++; continue; }
      if (!firstName) firstName = "—";
      if (!lastName) lastName = "—";

      // Parse grade
      const rawGrade = gradeCol ? String(row[gradeCol] ?? "") : "";
      const gradeLevel = parseGradeLevel(rawGrade) || "GRADE_1"; // Default to 1st if not specified

      // Parse DOB
      let dateOfBirth: Date | null = null;
      if (dobCol && row[dobCol]) {
        const raw = row[dobCol];
        if (typeof raw === "number") {
          // Excel serial date
          dateOfBirth = new Date((raw - 25569) * 86400 * 1000);
        } else {
          const parsed = new Date(String(raw));
          if (!isNaN(parsed.getTime())) dateOfBirth = parsed;
        }
      }

      const address = addressCol ? String(row[addressCol] ?? "").trim() : undefined;

      // Parent info from spreadsheet
      const parentName = parentCol ? String(row[parentCol] ?? "").trim() : "";
      const parentEmail = emailCol ? String(row[emailCol] ?? "").trim() : "";
      const parentPhone = phoneCol ? String(row[phoneCol] ?? "").trim() : "";

      try {
        // Create student
        const student = await prisma.student.create({
          data: {
            firstName,
            lastName,
            gradeLevel: gradeLevel as any,
            dateOfBirth,
            address: address || undefined,
          },
        });

        // Auto-enroll in matching class
        let enrolledIn = "—";
        const matchingClass = allClasses.find(c => c.gradeLevel === gradeLevel && c.program === "Faith Formation");
        const anyMatch = matchingClass || allClasses.find(c => c.gradeLevel === gradeLevel);
        if (anyMatch) {
          await prisma.enrollment.create({
            data: { studentId: student.id, classId: anyMatch.id, active: true },
          });
          enrolledIn = anyMatch.name;
        }

        // Handle parent info: create or link parent user if email is provided
        let parentAdded: string | undefined;
        if (parentEmail) {
          try {
            let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
            if (!parentUser) {
              // Random temp password — surfaced in the response so the
              // importing admin can communicate it through a side-channel.
              // Predictable patterns (e.g. lastName + year) let anyone who
              // knows a student's last name take over the parent account.
              const tempPassword = generateTempPassword();
              const hashed = await bcrypt.hash(tempPassword, 12);
              parentUser = await prisma.user.create({
                data: {
                  name: parentName || parentEmail.split("@")[0],
                  email: parentEmail,
                  phone: parentPhone || undefined,
                  password: hashed,
                  role: "PARENT",
                },
              });
              results.parentsCreated++;
              results.tempPasswords.push({ email: parentEmail, password: tempPassword });
            } else {
              results.parentsLinked++;
            }
            // Link parent to student (upsert to avoid duplicates)
            await prisma.studentParent.upsert({
              where: { studentId_userId: { studentId: student.id, userId: parentUser.id } },
              create: { studentId: student.id, userId: parentUser.id, relationship: "Parent" },
              update: {},
            });
            parentAdded = parentUser.name;
          } catch (parentErr: any) {
            results.errors.push(`Row ${rowNum} parent (${parentEmail}): ${parentErr.message}`);
          }
        } else if (parentName && !parentEmail) {
          // Name but no email — note it but can't create account without email
          parentAdded = `${parentName} (no email — not created)`;
        }

        results.imported++;
        results.students.push({
          name: `${firstName} ${lastName}`,
          grade: rawGrade || gradeLevel,
          enrolled: enrolledIn,
          ...(parentAdded ? { parentAdded } : {}),
        });
      } catch (err: any) {
        results.errors.push(`Row ${rowNum} (${firstName} ${lastName}): ${err.message}`);
      }
    }

    await recordAudit({
      actorId: userId,
      action: "students.import",
      entityType: "Student",
      metadata: {
        imported: results.imported,
        skipped: results.skipped,
        parentsCreated: results.parentsCreated,
        parentsLinked: results.parentsLinked,
        errorCount: results.errors.length,
      },
    });

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to process file: ${err.message}` }, { status: 500 });
  }
}
