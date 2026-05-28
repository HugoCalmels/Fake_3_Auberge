/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `RoomType` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `RoomType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "code" "RoomTypeCode" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_code_key" ON "RoomType"("code");
