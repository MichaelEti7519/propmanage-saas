CREATE TABLE "EmailDeliveryEvent" (
    "providerEventId" TEXT NOT NULL,
    "emailId" TEXT,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryEvent_pkey" PRIMARY KEY ("providerEventId")
);

CREATE INDEX "EmailDeliveryEvent_occurredAt_idx" ON "EmailDeliveryEvent"("occurredAt");
CREATE INDEX "EmailDeliveryEvent_emailId_occurredAt_idx" ON "EmailDeliveryEvent"("emailId", "occurredAt");
CREATE INDEX "EmailDeliveryEvent_eventType_occurredAt_idx" ON "EmailDeliveryEvent"("eventType", "occurredAt");
