ALTER TABLE "RefreshToken" ADD COLUMN "accessJti" TEXT;
CREATE UNIQUE INDEX "RefreshToken_accessJti_key" ON "RefreshToken"("accessJti");

CREATE TABLE "RateLimitCounter" (
    "key" TEXT NOT NULL,
    "totalHits" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitCounter_resetAt_idx" ON "RateLimitCounter"("resetAt");
