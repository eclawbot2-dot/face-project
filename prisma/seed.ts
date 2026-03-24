import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const rawUrl = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user - Sheila Schneider
  const sheilaPass = await bcrypt.hash("HolyFace2024!", 12);
  const sheila = await prisma.user.upsert({
    where: { email: "sheila@holyfacechurch.org" },
    update: {},
    create: {
      name: "Sheila Schneider",
      email: "sheila@holyfacechurch.org",
      password: sheilaPass,
      role: "ADMIN",
      phone: "301-555-0101",
    },
  });
  console.log("✅ Created admin: Sheila Schneider");

  // Create director - Susan Beall
  const susanPass = await bcrypt.hash("HolyFace2024!", 12);
  const susan = await prisma.user.upsert({
    where: { email: "susan@holyfacechurch.org" },
    update: {},
    create: {
      name: "Susan Beall",
      email: "susan@holyfacechurch.org",
      password: susanPass,
      role: "DIRECTOR",
      phone: "301-555-0102",
    },
  });
  console.log("✅ Created director: Susan Beall");

  // Create catechists
  const catechistData = [
    { name: "Mary Johnson", email: "mary.johnson@holyfacechurch.org", phone: "301-555-0201" },
    { name: "Robert Smith", email: "robert.smith@holyfacechurch.org", phone: "301-555-0202" },
    { name: "Patricia Williams", email: "patricia.williams@holyfacechurch.org", phone: "301-555-0203" },
    { name: "James Brown", email: "james.brown@holyfacechurch.org", phone: "301-555-0204" },
    { name: "Linda Davis", email: "linda.davis@holyfacechurch.org", phone: "301-555-0205" },
    { name: "Michael Wilson", email: "michael.wilson@holyfacechurch.org", phone: "301-555-0206" },
    { name: "Barbara Martinez", email: "barbara.martinez@holyfacechurch.org", phone: "301-555-0207" },
    { name: "David Anderson", email: "david.anderson@holyfacechurch.org", phone: "301-555-0208" },
    { name: "Jennifer Taylor", email: "jennifer.taylor@holyfacechurch.org", phone: "301-555-0209" },
    { name: "Thomas Thomas", email: "thomas.thomas@holyfacechurch.org", phone: "301-555-0210" },
  ];

  const catechistUsers = [];
  for (const c of catechistData) {
    const pass = await bcrypt.hash("HolyFace2024!", 12);
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        ...c,
        password: pass,
        role: "CATECHIST",
        catechist: {
          create: {
            certifications: JSON.stringify(["Safe Environment Training", "Called to Protect"]),
            backgroundCheckDate: new Date("2023-08-01"),
            backgroundCheckExp: new Date("2025-08-01"),
          },
        },
      },
      include: { catechist: true },
    });
    catechistUsers.push(user);
  }
  console.log(`✅ Created ${catechistData.length} catechists`);

  // Create classes for each grade level
  const classData = [
    { name: "Pre-K Faith Formation", gradeLevel: "PRE_K", program: "Pre-K Faith Formation", room: "Room 101", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:00" },
    { name: "Kindergarten Faith Formation", gradeLevel: "KINDERGARTEN", program: "Elementary Faith Formation", room: "Room 102", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:00" },
    { name: "1st Grade Faith Formation", gradeLevel: "GRADE_1", program: "Elementary Faith Formation", room: "Room 103", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "2nd Grade - First Communion Prep", gradeLevel: "GRADE_2", program: "First Communion Prep", room: "Room 104", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:30" },
    { name: "3rd Grade Faith Formation", gradeLevel: "GRADE_3", program: "Elementary Faith Formation", room: "Room 105", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "4th Grade Faith Formation", gradeLevel: "GRADE_4", program: "Elementary Faith Formation", room: "Room 106", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "5th Grade Faith Formation", gradeLevel: "GRADE_5", program: "Elementary Faith Formation", room: "Room 107", dayOfWeek: "Sunday", startTime: "09:00", endTime: "10:15" },
    { name: "6th Grade Faith Formation", gradeLevel: "GRADE_6", program: "Middle School Faith Formation", room: "Room 201", dayOfWeek: "Wednesday", startTime: "18:30", endTime: "20:00" },
    { name: "7th Grade Faith Formation", gradeLevel: "GRADE_7", program: "Middle School Faith Formation", room: "Room 202", dayOfWeek: "Wednesday", startTime: "18:30", endTime: "20:00" },
    { name: "8th Grade - Confirmation Prep", gradeLevel: "GRADE_8", program: "Confirmation Prep", room: "Room 203", dayOfWeek: "Wednesday", startTime: "18:30", endTime: "20:00" },
    { name: "Adult Faith Formation", gradeLevel: "ADULT", program: "Adult Faith Formation", room: "Parish Hall", dayOfWeek: "Tuesday", startTime: "19:00", endTime: "20:30" },
    { name: "RCIA - Rite of Christian Initiation", gradeLevel: "ADULT", program: "RCIA", room: "Meeting Room A", dayOfWeek: "Thursday", startTime: "19:00", endTime: "20:30" },
  ];

  const classes = [];
  for (let i = 0; i < classData.length; i++) {
    const cls = await prisma.class.upsert({
      where: { id: `class-${i}` },
      update: {},
      create: {
        id: `class-${i}`,
        ...classData[i],
        gradeLevel: classData[i].gradeLevel as any,
        academicYear: "2024-2025",
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Created ${classData.length} classes`);

  // Assign catechists to classes
  const catechists = await prisma.catechist.findMany();
  for (let i = 0; i < classes.length; i++) {
    const catechistIdx = i % catechists.length;
    await prisma.classCatechist.upsert({
      where: { classId_catechistId: { classId: classes[i].id, catechistId: catechists[catechistIdx].id } },
      update: {},
      create: {
        classId: classes[i].id,
        catechistId: catechists[catechistIdx].id,
        isPrimary: true,
      },
    });
  }
  console.log("✅ Assigned catechists to classes");

  // Create sample students
  const studentData = [
    // 2nd grade (First Communion)
    { firstName: "Emma", lastName: "Collins", gradeLevel: "GRADE_2", dateOfBirth: "2016-03-15" },
    { firstName: "Noah", lastName: "Peterson", gradeLevel: "GRADE_2", dateOfBirth: "2016-07-22" },
    { firstName: "Olivia", lastName: "Garcia", gradeLevel: "GRADE_2", dateOfBirth: "2016-11-08" },
    // 8th grade (Confirmation)
    { firstName: "Liam", lastName: "Thompson", gradeLevel: "GRADE_8", dateOfBirth: "2010-01-14" },
    { firstName: "Sophia", lastName: "White", gradeLevel: "GRADE_8", dateOfBirth: "2010-05-30" },
    { firstName: "Mason", lastName: "Harris", gradeLevel: "GRADE_8", dateOfBirth: "2010-09-18" },
    // 1st grade
    { firstName: "Isabella", lastName: "Clark", gradeLevel: "GRADE_1", dateOfBirth: "2017-04-11" },
    { firstName: "Ethan", lastName: "Lewis", gradeLevel: "GRADE_1", dateOfBirth: "2017-08-25" },
    // 5th grade
    { firstName: "Ava", lastName: "Robinson", gradeLevel: "GRADE_5", dateOfBirth: "2013-02-19" },
    { firstName: "James", lastName: "Walker", gradeLevel: "GRADE_5", dateOfBirth: "2013-06-07" },
    // 6th grade
    { firstName: "Charlotte", lastName: "Hall", gradeLevel: "GRADE_6", dateOfBirth: "2012-10-03" },
    { firstName: "Benjamin", lastName: "Young", gradeLevel: "GRADE_6", dateOfBirth: "2012-12-27" },
    // Kindergarten
    { firstName: "Amelia", lastName: "Allen", gradeLevel: "KINDERGARTEN", dateOfBirth: "2018-06-14" },
    { firstName: "Lucas", lastName: "King", gradeLevel: "KINDERGARTEN", dateOfBirth: "2018-09-01" },
    // Pre-K
    { firstName: "Mia", lastName: "Wright", gradeLevel: "PRE_K", dateOfBirth: "2019-03-22" },
    { firstName: "Henry", lastName: "Scott", gradeLevel: "PRE_K", dateOfBirth: "2019-07-16" },
  ];

  const students = [];
  for (const s of studentData) {
    const student = await prisma.student.create({
      data: {
        ...s,
        gradeLevel: s.gradeLevel as any,
        dateOfBirth: new Date(s.dateOfBirth),
      },
    });
    students.push(student);
  }
  console.log(`✅ Created ${studentData.length} students`);

  // Create parent users and link to students
  const parentData = [
    { name: "Thomas Collins", email: "thomas.collins@example.com", studentIdx: 0 },
    { name: "Maria Peterson", email: "maria.peterson@example.com", studentIdx: 1 },
    { name: "Carlos Garcia", email: "carlos.garcia@example.com", studentIdx: 2 },
    { name: "Karen Thompson", email: "karen.thompson@example.com", studentIdx: 3 },
    { name: "David White", email: "david.white@example.com", studentIdx: 4 },
  ];

  for (const p of parentData) {
    const pass = await bcrypt.hash("parent123", 12);
    const parent = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        password: pass,
        role: "PARENT",
        phone: "301-555-0300",
      },
    });
    await prisma.studentParent.upsert({
      where: { studentId_userId: { studentId: students[p.studentIdx].id, userId: parent.id } },
      update: {},
      create: {
        studentId: students[p.studentIdx].id,
        userId: parent.id,
        relationship: "Parent",
        isPrimary: true,
      },
    });
  }
  console.log("✅ Created parent accounts");

  // Enroll students in their grade-level classes
  const gradeClassMap: Record<string, string> = {
    PRE_K: "class-0",
    KINDERGARTEN: "class-1",
    GRADE_1: "class-2",
    GRADE_2: "class-3",
    GRADE_3: "class-4",
    GRADE_4: "class-5",
    GRADE_5: "class-6",
    GRADE_6: "class-7",
    GRADE_7: "class-8",
    GRADE_8: "class-9",
    ADULT: "class-10",
  };

  for (const student of students) {
    const classId = gradeClassMap[student.gradeLevel];
    if (classId) {
      await prisma.enrollment.upsert({
        where: { studentId_classId: { studentId: student.id, classId } },
        update: {},
        create: { studentId: student.id, classId, active: true },
      });
    }
  }
  console.log("✅ Enrolled students in classes");

  // Create sacrament records
  for (const student of students) {
    // Baptism - all students
    await prisma.sacramentRecord.upsert({
      where: { studentId_sacramentType: { studentId: student.id, sacramentType: "Baptism" } },
      update: {},
      create: {
        studentId: student.id,
        sacramentType: "Baptism",
        status: "COMPLETED",
        completionDate: new Date(student.dateOfBirth!.getTime() + 30 * 24 * 60 * 60 * 1000),
        notes: "Received at Holy Face Church",
      },
    });

    // 2nd graders - First Communion prep
    if (student.gradeLevel === "GRADE_2") {
      await prisma.sacramentRecord.upsert({
        where: { studentId_sacramentType: { studentId: student.id, sacramentType: "First Reconciliation" } },
        update: {},
        create: {
          studentId: student.id,
          sacramentType: "First Reconciliation",
          status: "IN_PROGRESS",
          startDate: new Date("2024-09-01"),
          notes: "Preparing for First Reconciliation",
        },
      });
      await prisma.sacramentRecord.upsert({
        where: { studentId_sacramentType: { studentId: student.id, sacramentType: "First Communion" } },
        update: {},
        create: {
          studentId: student.id,
          sacramentType: "First Communion",
          status: "IN_PROGRESS",
          startDate: new Date("2024-09-01"),
          notes: "Preparing for First Communion - Spring 2025",
        },
      });
    }

    // 8th graders - Confirmation prep
    if (student.gradeLevel === "GRADE_8") {
      await prisma.sacramentRecord.upsert({
        where: { studentId_sacramentType: { studentId: student.id, sacramentType: "Confirmation" } },
        update: {},
        create: {
          studentId: student.id,
          sacramentType: "Confirmation",
          status: "IN_PROGRESS",
          startDate: new Date("2024-09-01"),
          notes: "Confirmation Spring 2025",
          milestones: JSON.stringify([
            { name: "Sponsor selected", completed: true },
            { name: "Saint name chosen", completed: true },
            { name: "Service hours (20 hrs)", completed: false },
            { name: "Retreat attendance", completed: false },
            { name: "Letter to bishop", completed: false },
          ]),
        },
      });
    }
  }
  console.log("✅ Created sacrament records");

  // Create class sessions with attendance
  const now = new Date();
  const grade2Class = classes[3]; // 2nd grade
  const grade8Class = classes[9]; // 8th grade
  const grade2Students = students.filter((s) => s.gradeLevel === "GRADE_2");
  const grade8Students = students.filter((s) => s.gradeLevel === "GRADE_8");

  for (let weekBack = 8; weekBack >= 1; weekBack--) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - weekBack * 7);

    // 2nd grade session
    const session2 = await prisma.classSession.create({
      data: {
        classId: grade2Class.id,
        date: sessionDate,
        topic: ["Introduction to the Sacraments", "The Story of Jesus", "Prayer and Mass", "The Ten Commandments", "God's Love", "The Holy Spirit", "First Reconciliation Prep", "First Communion Prep"][weekBack - 1],
      },
    });

    for (const student of grade2Students) {
      await prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session2.id, studentId: student.id } },
        update: {},
        create: {
          sessionId: session2.id,
          studentId: student.id,
          status: weekBack === 3 ? "ABSENT" : "PRESENT",
        },
      });
    }

    // 8th grade session
    const session8 = await prisma.classSession.create({
      data: {
        classId: grade8Class.id,
        date: sessionDate,
        topic: ["Confirmation Overview", "Who is the Holy Spirit?", "Gifts of the Spirit", "Service & Discipleship", "Prayer Life", "The Church and Sacraments", "Sponsor Relationship", "Preparing Your Heart"][weekBack - 1],
      },
    });

    for (const student of grade8Students) {
      await prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session8.id, studentId: student.id } },
        update: {},
        create: {
          sessionId: session8.id,
          studentId: student.id,
          status: weekBack === 5 ? "EXCUSED" : "PRESENT",
        },
      });
    }
  }
  console.log("✅ Created class sessions and attendance records");

  // Create upcoming events
  const eventData = [
    {
      title: "First Reconciliation",
      description: "2nd Grade First Reconciliation Ceremony",
      eventType: "SACRAMENT",
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 10, 0),
      location: "Holy Face Church",
    },
    {
      title: "Confirmation Retreat",
      description: "8th Grade Confirmation Retreat at Camp Maria",
      eventType: "RETREAT",
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 22, 8, 0),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 23, 17, 0),
      location: "Camp Maria, Leonardtown MD",
    },
    {
      title: "First Communion",
      description: "2nd Grade First Holy Communion Mass",
      eventType: "SACRAMENT",
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 10, 11, 0),
      location: "Holy Face Church",
    },
    {
      title: "Confirmation",
      description: "8th Grade Confirmation Mass — Bishop Burbidge presiding",
      eventType: "SACRAMENT",
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 18, 19, 0),
      location: "Holy Face Church",
    },
    {
      title: "End of Year Family Picnic",
      description: "Annual Faith Formation End-of-Year Celebration",
      eventType: "PARISH",
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 25, 12, 0),
      location: "Parish Grounds",
      allDay: false,
    },
    {
      title: "Catechist Training Day",
      description: "Fall 2025 Catechist Training and Formation Day",
      eventType: "OTHER",
      startDate: new Date(now.getFullYear(), now.getMonth() + 3, 5, 9, 0),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 5, 16, 0),
      location: "Parish Hall",
    },
  ];

  for (const event of eventData) {
    await prisma.event.create({ data: event as any });
  }
  console.log("✅ Created upcoming events");

  // Create announcements
  const announcements = [
    {
      title: "Welcome to Faith Formation 2024-2025!",
      body: "We are so excited to welcome all our students and families to another wonderful year of Faith Formation at Holy Face Church. Our classes begin September 8th. Please ensure all registration forms are complete.",
      targetGroup: "ALL",
      authorId: sheila.id,
    },
    {
      title: "First Communion Preparation Beginning",
      body: "2nd Grade families: Preparation for First Holy Communion officially begins this Sunday. Please make sure your child has their Baptismal certificate on file. Contact Susan Beall with questions.",
      targetGroup: "GRADE_2",
      authorId: susan.id,
    },
    {
      title: "Confirmation Retreat Registration Open",
      body: "8th Grade students: Registration for the Confirmation Retreat at Camp Maria is now open. This is a required retreat for Confirmation. Forms due by end of next week.",
      targetGroup: "GRADE_8",
      authorId: sheila.id,
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: { ...a, sentAt: new Date() },
    });
  }
  console.log("✅ Created announcements");

  console.log("\n🎉 Seed complete!");
  console.log("\n📧 Login credentials:");
  console.log("   Admin:    sheila@holyfacechurch.org / HolyFace2024!");
  console.log("   Director: susan@holyfacechurch.org / HolyFace2024!");
  console.log("   Catechist: mary.johnson@holyfacechurch.org / HolyFace2024!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
