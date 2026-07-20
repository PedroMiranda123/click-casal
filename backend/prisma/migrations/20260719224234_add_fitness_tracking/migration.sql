-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('MUSCULACAO', 'CORRIDA', 'NATACAO', 'YOGA', 'CAMINHADA', 'FUTEBOL', 'OUTRO');

-- CreateEnum
CREATE TYPE "WorkoutIntensity" AS ENUM ('LEVE', 'MODERADO', 'INTENSO');

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "WorkoutType" NOT NULL,
    "durationMinutes" INTEGER,
    "intensity" "WorkoutIntensity",
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyResult" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "countPedro" INTEGER NOT NULL,
    "countAna" INTEGER NOT NULL,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyResult_weekStart_key" ON "WeeklyResult"("weekStart");

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyResult" ADD CONSTRAINT "WeeklyResult_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
