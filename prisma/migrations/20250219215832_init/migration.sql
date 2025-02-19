-- DropForeignKey
ALTER TABLE "Reports" DROP CONSTRAINT "Reports_reportedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Reports" DROP CONSTRAINT "Reports_userId_fkey";

-- AlterTable
ALTER TABLE "Reports" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "reportedUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
