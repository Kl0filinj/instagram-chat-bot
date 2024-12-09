-- CreateEnum
CREATE TYPE "UserSex" AS ENUM ('male', 'female', 'none');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "UserSex" NOT NULL,
    "sexInterest" "UserSex" NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "rejectedUsers" TEXT[],
    "likedUsers" TEXT[],
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reports" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE INDEX "User_id_name_city_idx" ON "User"("id", "name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Reports_id_key" ON "Reports"("id");

-- CreateIndex
CREATE INDEX "Reports_id_topic_userId_idx" ON "Reports"("id", "topic", "userId");

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
