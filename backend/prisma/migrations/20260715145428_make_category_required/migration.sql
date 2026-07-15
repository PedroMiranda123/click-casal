-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "type",
ALTER COLUMN "categoryId" SET NOT NULL;
