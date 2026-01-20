-- CreateTable
CREATE TABLE "Superfan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "channelId" TEXT NOT NULL,
    "fanUsername" TEXT NOT NULL,
    "fanProfileUrl" TEXT,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "avgSentiment" DOUBLE PRECISION,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Superfan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Superfan_userId_channelId_idx" ON "Superfan"("userId", "channelId");

-- CreateIndex
CREATE INDEX "Superfan_channelId_idx" ON "Superfan"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Superfan_userId_platform_channelId_fanUsername_key" ON "Superfan"("userId", "platform", "channelId", "fanUsername");

-- AddForeignKey
ALTER TABLE "Superfan" ADD CONSTRAINT "Superfan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
