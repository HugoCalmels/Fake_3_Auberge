-- CreateEnum
CREATE TYPE "SystemLogLevel" AS ENUM ('info', 'warn', 'error');

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" "SystemLogLevel" NOT NULL DEFAULT 'info',
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "bookingId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);
