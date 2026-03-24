-- CreateTable
CREATE TABLE "CurriculumUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeLevel" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cccReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "scriptureRef" TEXT,
    "cccParagraphs" TEXT,
    "materials" TEXT NOT NULL DEFAULT '[]',
    "activities" TEXT NOT NULL DEFAULT '[]',
    "prayerFocus" TEXT,
    "takeHome" TEXT,
    "notes" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "CurriculumUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceHour_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumUnit_gradeLevel_program_unitNumber_key" ON "CurriculumUnit"("gradeLevel", "program", "unitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_unitId_lessonNumber_key" ON "Lesson"("unitId", "lessonNumber");
