/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
ADD COLUMN     "avatarFileId" TEXT;

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_s3Key_key" ON "File"("s3Key");

-- CreateIndex
CREATE INDEX "File_s3Key_idx" ON "File"("s3Key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
