/*
  Warnings:

  - The values [phone,walk_in] on the enum `BookingSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [partial,refunded] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingSource_new" AS ENUM ('website', 'admin_manual');
ALTER TABLE "public"."Booking" ALTER COLUMN "bookingSource" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "bookingSource" TYPE "BookingSource_new" USING ("bookingSource"::text::"BookingSource_new");
ALTER TYPE "BookingSource" RENAME TO "BookingSource_old";
ALTER TYPE "BookingSource_new" RENAME TO "BookingSource";
DROP TYPE "public"."BookingSource_old";
ALTER TABLE "Booking" ALTER COLUMN "bookingSource" SET DEFAULT 'admin_manual';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('unpaid', 'paid');
ALTER TABLE "public"."Booking" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" SET DEFAULT 'unpaid';
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestPhone" TEXT;
