-- CreateTable
CREATE TABLE "InstagramToken" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "accessToken" TEXT NOT NULL,
    "igAccountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramToken_pkey" PRIMARY KEY ("id")
);
