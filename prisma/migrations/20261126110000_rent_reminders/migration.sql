CREATE TYPE "RentReminderKind" AS ENUM (
    'six_months_before',
    'three_months_before',
    'three_months_overdue',
    'six_months_overdue'
);

CREATE TYPE "RentReminderStatus" AS ENUM ('pending', 'processing', 'sent', 'failed', 'skipped');

CREATE TABLE "RentReminder" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "kind" "RentReminderKind" NOT NULL,
    "status" "RentReminderStatus" NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "processingAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentReminder_paymentId_kind_key" ON "RentReminder"("paymentId", "kind");
CREATE INDEX "RentReminder_status_scheduledAt_idx" ON "RentReminder"("status", "scheduledAt");
CREATE INDEX "RentReminder_paymentId_scheduledAt_idx" ON "RentReminder"("paymentId", "scheduledAt");

ALTER TABLE "RentReminder" ADD CONSTRAINT "RentReminder_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
