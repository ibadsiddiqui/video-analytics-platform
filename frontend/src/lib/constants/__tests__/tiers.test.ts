import { describe, it, expect } from "vitest";
import {
  TIER_FEATURES,
  TIER_CONFIG,
  hasFeatureAccess,
  getMinimumTier,
  getCommentLimit,
} from "../tiers";
import { UserTier } from "@prisma/client";

describe("Tier Access System", () => {
  describe("TIER_FEATURES", () => {
    it("should define all Phase 1-5 features", () => {
      expect(TIER_FEATURES).toHaveProperty("API_KEY_MANAGEMENT");
      expect(TIER_FEATURES).toHaveProperty("COMPETITOR_TRACKING");
      expect(TIER_FEATURES).toHaveProperty("BENCHMARK_COMPARISONS");
      expect(TIER_FEATURES).toHaveProperty("VIRAL_SCORE");
      expect(TIER_FEATURES).toHaveProperty("POSTING_TIME_OPTIMIZER");
      expect(TIER_FEATURES).toHaveProperty("TITLE_ANALYSIS");
      expect(TIER_FEATURES).toHaveProperty("THUMBNAIL_ANALYSIS");
      expect(TIER_FEATURES).toHaveProperty("AUDIENCE_ANALYTICS");
    });

    it("should have CREATOR tier for API_KEY_MANAGEMENT", () => {
      expect(TIER_FEATURES.API_KEY_MANAGEMENT).toContain("CREATOR");
      expect(TIER_FEATURES.API_KEY_MANAGEMENT).toContain("PRO");
      expect(TIER_FEATURES.API_KEY_MANAGEMENT).toContain("AGENCY");
    });

    it("should have PRO tier for advanced features", () => {
      expect(TIER_FEATURES.VIRAL_SCORE).toContain("PRO");
      expect(TIER_FEATURES.VIRAL_SCORE).toContain("AGENCY");
      expect(TIER_FEATURES.VIRAL_SCORE).not.toContain("FREE");
      expect(TIER_FEATURES.VIRAL_SCORE).not.toContain("CREATOR");
    });
  });

  describe("TIER_CONFIG", () => {
    it("should define all four tiers", () => {
      expect(TIER_CONFIG).toHaveProperty("FREE");
      expect(TIER_CONFIG).toHaveProperty("CREATOR");
      expect(TIER_CONFIG).toHaveProperty("PRO");
      expect(TIER_CONFIG).toHaveProperty("AGENCY");
    });

    it("should have increasing daily limits", () => {
      expect(TIER_CONFIG.FREE.dailyLimit).toBe(100);
      expect(TIER_CONFIG.CREATOR.dailyLimit).toBe(100);
      expect(TIER_CONFIG.PRO.dailyLimit).toBe(500);
      expect(TIER_CONFIG.AGENCY.dailyLimit).toBe(2000);
    });

    it("should have correct comment limits", () => {
      expect(TIER_CONFIG.FREE.commentLimit).toBe(10);
      expect(TIER_CONFIG.CREATOR.commentLimit).toBe(50);
      expect(TIER_CONFIG.PRO.commentLimit).toBe(-1); // Unlimited
      expect(TIER_CONFIG.AGENCY.commentLimit).toBe(-1); // Unlimited
    });

    it("should include features in tier config", () => {
      expect(TIER_CONFIG.FREE.features).toContain("Basic video analysis");
      expect(TIER_CONFIG.PRO.features).toContain("Viral potential score");
      expect(TIER_CONFIG.PRO.features).toContain("Title A/B testing");
      expect(TIER_CONFIG.AGENCY.features).toContain("Unlimited competitors");
    });
  });

  describe("hasFeatureAccess", () => {
    it("should return false for undefined tier", () => {
      expect(hasFeatureAccess(undefined, "API_KEY_MANAGEMENT")).toBe(false);
      expect(hasFeatureAccess(undefined, "VIRAL_SCORE")).toBe(false);
    });

    it("should return false for FREE tier on CREATOR+ features", () => {
      expect(hasFeatureAccess(UserTier.FREE, "API_KEY_MANAGEMENT")).toBe(false);
    });

    it("should return true for CREATOR tier on API_KEY_MANAGEMENT", () => {
      expect(hasFeatureAccess(UserTier.CREATOR, "API_KEY_MANAGEMENT")).toBe(
        true,
      );
    });

    it("should return false for CREATOR tier on PRO features", () => {
      expect(hasFeatureAccess(UserTier.CREATOR, "VIRAL_SCORE")).toBe(false);
      expect(hasFeatureAccess(UserTier.CREATOR, "TITLE_ANALYSIS")).toBe(false);
    });

    it("should return true for PRO tier on all PRO features", () => {
      expect(hasFeatureAccess(UserTier.PRO, "COMPETITOR_TRACKING")).toBe(true);
      expect(hasFeatureAccess(UserTier.PRO, "VIRAL_SCORE")).toBe(true);
      expect(hasFeatureAccess(UserTier.PRO, "TITLE_ANALYSIS")).toBe(true);
      expect(hasFeatureAccess(UserTier.PRO, "AUDIENCE_ANALYTICS")).toBe(true);
    });

    it("should return true for AGENCY tier on all features", () => {
      expect(hasFeatureAccess(UserTier.AGENCY, "API_KEY_MANAGEMENT")).toBe(
        true,
      );
      expect(hasFeatureAccess(UserTier.AGENCY, "VIRAL_SCORE")).toBe(true);
      expect(hasFeatureAccess(UserTier.AGENCY, "AUDIENCE_ANALYTICS")).toBe(
        true,
      );
    });
  });

  describe("getMinimumTier", () => {
    it("should return CREATOR for API_KEY_MANAGEMENT", () => {
      expect(getMinimumTier("API_KEY_MANAGEMENT")).toBe("CREATOR");
    });

    it("should return PRO for advanced features", () => {
      expect(getMinimumTier("VIRAL_SCORE")).toBe("PRO");
      expect(getMinimumTier("TITLE_ANALYSIS")).toBe("PRO");
      expect(getMinimumTier("AUDIENCE_ANALYTICS")).toBe("PRO");
    });
  });

  describe("getCommentLimit", () => {
    it("should return 10 for undefined tier", () => {
      expect(getCommentLimit(undefined)).toBe(10);
    });

    it("should return correct limit for FREE tier", () => {
      expect(getCommentLimit(UserTier.FREE)).toBe(10);
    });

    it("should return correct limit for CREATOR tier", () => {
      expect(getCommentLimit(UserTier.CREATOR)).toBe(50);
    });

    it("should return -1 (unlimited) for PRO tier", () => {
      expect(getCommentLimit(UserTier.PRO)).toBe(-1);
    });

    it("should return -1 (unlimited) for AGENCY tier", () => {
      expect(getCommentLimit(UserTier.AGENCY)).toBe(-1);
    });
  });
});
