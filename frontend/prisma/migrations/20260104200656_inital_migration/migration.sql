-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'VIMEO', 'OTHER');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'CREATOR', 'PRO', 'AGENCY');

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

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
