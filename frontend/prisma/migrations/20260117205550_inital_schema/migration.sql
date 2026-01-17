-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'VIMEO', 'OTHER');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'CREATOR', 'PRO', 'AGENCY');

-- CreateEnum
CREATE TYPE "VideoNiche" AS ENUM ('GAMING', 'TECH', 'BEAUTY', 'VLOGS', 'EDUCATION', 'MUSIC', 'SPORTS', 'ENTERTAINMENT', 'COOKING', 'TRAVEL', 'BUSINESS', 'HEALTH', 'OTHER');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformVideoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "channelName" TEXT,
    "channelId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "likeCount" BIGINT NOT NULL DEFAULT 0,
    "commentCount" BIGINT NOT NULL DEFAULT 0,
    "shareCount" BIGINT NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "likeCount" BIGINT NOT NULL DEFAULT 0,
    "commentCount" BIGINT NOT NULL DEFAULT 0,
    "engagementByDay" JSONB,
    "sentimentScore" DOUBLE PRECISION,
    "positivePercent" DOUBLE PRECISION,
    "neutralPercent" DOUBLE PRECISION,
    "negativePercent" DOUBLE PRECISION,
    "demographics" JSONB,
    "topKeywords" JSONB,
    "topHashtags" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "platformCommentId" TEXT,
    "authorName" TEXT,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "sentimentScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "endpoint" TEXT NOT NULL,
    "videoUrl" TEXT,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "dailyRequests" INTEGER NOT NULL DEFAULT 0,
    "lastRequestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorTrack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "niche" "VideoNiche" NOT NULL,
    "subscriberCount" BIGINT NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "totalViews" BIGINT NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstTrackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSnapshot" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "subscriberCount" BIGINT NOT NULL,
    "videoCount" INTEGER NOT NULL,
    "totalViews" BIGINT NOT NULL,
    "recentVideos" JSONB,
    "avgEngagement" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "niche" "VideoNiche" NOT NULL,
    "avgViewCount" BIGINT NOT NULL DEFAULT 0,
    "avgLikeCount" BIGINT NOT NULL DEFAULT 0,
    "avgCommentCount" BIGINT NOT NULL DEFAULT 0,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewPercentiles" JSONB,
    "engagementPercentiles" JSONB,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_platformVideoId_key" ON "Video"("platformVideoId");

-- CreateIndex
CREATE INDEX "Video_platform_platformVideoId_idx" ON "Video"("platform", "platformVideoId");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");

-- CreateIndex
CREATE INDEX "Analytics_videoId_recordedAt_idx" ON "Analytics"("videoId", "recordedAt");

-- CreateIndex
CREATE INDEX "Comment_videoId_idx" ON "Comment"("videoId");

-- CreateIndex
CREATE INDEX "Comment_sentiment_idx" ON "Comment"("sentiment");

-- CreateIndex
CREATE INDEX "ApiRequest_ipAddress_createdAt_idx" ON "ApiRequest"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRequest_createdAt_idx" ON "ApiRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserApiKey_userId_idx" ON "UserApiKey"("userId");

-- CreateIndex
CREATE INDEX "UserApiKey_platform_idx" ON "UserApiKey"("platform");

-- CreateIndex
CREATE INDEX "CompetitorTrack_userId_idx" ON "CompetitorTrack"("userId");

-- CreateIndex
CREATE INDEX "CompetitorTrack_userId_isActive_idx" ON "CompetitorTrack"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorTrack_userId_platform_channelId_key" ON "CompetitorTrack"("userId", "platform", "channelId");

-- CreateIndex
CREATE INDEX "CompetitorSnapshot_competitorId_recordedAt_idx" ON "CompetitorSnapshot"("competitorId", "recordedAt");

-- CreateIndex
CREATE INDEX "CompetitorSnapshot_recordedAt_idx" ON "CompetitorSnapshot"("recordedAt");

-- CreateIndex
CREATE INDEX "Benchmark_platform_idx" ON "Benchmark"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_platform_niche_key" ON "Benchmark"("platform", "niche");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorTrack" ADD CONSTRAINT "CompetitorTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "CompetitorTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
