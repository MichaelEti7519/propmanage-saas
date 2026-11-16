-- CreateTable
CREATE TABLE "VerificationReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "fromStatus" "VerificationStatus" NOT NULL,
    "toStatus" "VerificationStatus" NOT NULL,
    "basis" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationReview_userId_createdAt_idx" ON "VerificationReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationReview_reviewerId_createdAt_idx" ON "VerificationReview"("reviewerId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationReview" ADD CONSTRAINT "VerificationReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationReview" ADD CONSTRAINT "VerificationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
