-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "body" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;

-- Then drop defaults to make them truly required going forward
ALTER TABLE "NotificationLog" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "NotificationLog" ALTER COLUMN "body" DROP DEFAULT;
