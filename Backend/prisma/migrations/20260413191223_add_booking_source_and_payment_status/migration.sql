-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('website', 'admin_manual', 'phone', 'walk_in');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'partial', 'paid', 'refunded');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingSource" "BookingSource" NOT NULL DEFAULT 'admin_manual',
ADD COLUMN     "paymentNote" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid';
