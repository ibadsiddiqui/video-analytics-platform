/**
 * Detect Platform Use Case
 * Detects which platform a URL belongs to
 */

export interface DetectPlatformResult {
  url: string;
  platform: string | null;
  supported: boolean;
  supportedPlatforms: string[];
}

export class DetectPlatformUseCase {
  private readonly supportedPlatforms = ["youtube", "instagram"];

  /**
   * Execute - detect platform from URL
   */
  execute(url: string): DetectPlatformResult {
    if (!url || typeof url !== "string") {
      throw new Error("Valid URL is required");
    }

    const platform = this.detectPlatform(url);
    const supported =
      platform !== null && this.supportedPlatforms.includes(platform);

    return {
      url,
      platform,
      supported,
      supportedPlatforms: this.supportedPlatforms,
    };
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string | null {
    const normalized = url.toLowerCase();

    if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
      return "youtube";
    }
    if (normalized.includes("instagram.com")) {
      return "instagram";
    }
    if (normalized.includes("vimeo.com")) {
      return "vimeo";
    }

    return null;
  }

  /**
   * Check if platform is supported
   */
  isPlatformSupported(platform: string): boolean {
    return this.supportedPlatforms.includes(platform.toLowerCase());
  }
}

export const detectPlatformUseCase = new DetectPlatformUseCase();
