/*
  Warnings:

  - You are about to drop the column `level` on the `SystemLog` table. All the data in the column will be lost.
  - Changed the type of `type` on the `SystemLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SystemLogType" AS ENUM ('website_booking_validated', 'website_booking_failed', 'admin_booking_created', 'admin_booking_deleted', 'booking_check_in', 'booking_check_out');

-- AlterTable
ALTER TABLE "SystemLog" DROP COLUMN "level",
ADD COLUMN     "bookingGroupId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "SystemLogType" NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;

-- DropEnum
DROP TYPE "SystemLogLevel";
