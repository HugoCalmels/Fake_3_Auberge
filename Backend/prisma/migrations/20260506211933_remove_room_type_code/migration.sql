/*
  Warnings:

  - You are about to drop the column `code` on the `RoomType` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "RoomType_code_key";

-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "code";
