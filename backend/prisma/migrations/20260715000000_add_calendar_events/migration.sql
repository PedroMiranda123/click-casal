-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTHDAY', 'PAYMENT_DUE', 'SPORTS', 'EXERCISE', 'GENERAL');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'YEARLY', 'WEEKLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personEvents" TEXT;

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "personId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
