-- CreateTable
CREATE TABLE "City" (
    "name" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "lng" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "admin1" TEXT NOT NULL,
    "admin2" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_country_idx" ON "City"("country");
