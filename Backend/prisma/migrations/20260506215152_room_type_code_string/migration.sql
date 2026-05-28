/*
  Warnings:

  - Changed the type of `code` on the `RoomType` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "code",
ADD COLUMN     "code" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RoomTypeCode";

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_code_key" ON "RoomType"("code");
