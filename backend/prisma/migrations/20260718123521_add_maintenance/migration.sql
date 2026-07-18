-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_categoryId_fkey";

-- DropEnum
DROP TYPE "EventType";

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CalendarCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
