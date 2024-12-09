/*
  Warnings:

  - The values [male,female,none] on the enum `UserSex` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserSex_new" AS ENUM ('male', 'female', 'none');
ALTER TABLE "User" ALTER COLUMN "sex" TYPE "UserSex_new" USING ("sex"::text::"UserSex_new");
ALTER TABLE "User" ALTER COLUMN "sexInterest" TYPE "UserSex_new" USING ("sexInterest"::text::"UserSex_new");
ALTER TYPE "UserSex" RENAME TO "UserSex_old";
ALTER TYPE "UserSex_new" RENAME TO "UserSex";
DROP TYPE "UserSex_old";
COMMIT;
