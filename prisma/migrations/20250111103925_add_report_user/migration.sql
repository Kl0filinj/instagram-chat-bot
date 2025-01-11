/*
  Warnings:

  - Added the required column `reportedUserId` to the `Reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Reports_id_topic_userId_idx";

-- DropIndex
DROP INDEX "User_id_name_city_idx";

-- AlterTable
ALTER TABLE "Reports" ADD COLUMN "reportedUserId" TEXT;

-- Step 2: Update existing rows with a default value
UPDATE "Reports" SET "reportedUserId" = 'default_user_id';

-- Step 3: Make the column non-nullable
ALTER TABLE "Reports" ALTER COLUMN "reportedUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Reports_topic_userId_reportedUserId_idx" ON "Reports"("topic", "userId", "reportedUserId");

-- CreateIndex
CREATE INDEX "User_name_city_idx" ON "User"("name", "city");

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
