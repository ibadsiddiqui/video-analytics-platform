"use client";

/**
 * Browser Fingerprinting Utility
 * Generates a stable, unique fingerprint for anonymous users
 * to track API rate limiting without authentication
 */

let cachedFingerprint: string | null = null;

/**
 * Simple hash function using native crypto API
 * Converts string to hex hash using SubtleCrypto
 */
async function hashString(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback for environments without crypto.subtle
    return simpleHash(str);
  }
}

/**
 * Simple hash fallback for environments without crypto.subtle
 * Not cryptographically secure but sufficient for fingerprinting
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get canvas fingerprint using canvas 2D rendering
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return "canvas-unavailable";

    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Browser Fingerprint", 2, 15);

    try {
      return canvas.toDataURL();
    } catch {
      return "canvas-blocked";
    }
  } catch {
    return "canvas-error";
  }
}

/**
 * Get WebGL fingerprint info
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return "webgl-unavailable";

    const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "webgl-no-debug";

    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(
      debugInfo.UNMASKED_RENDERER_WEBGL,
    );

    return `${vendor}|${renderer}`;
  } catch {
    return "webgl-error";
  }
}

/**
 * Get screen fingerprint info
 */
function getScreenFingerprint(): string {
  const screen = window.screen;
  return `${screen.width}x${screen.height}x${screen.colorDepth}`;
}

/**
 * Get timezone info
 */
function getTimezoneFingerprint(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    return `${timezone}|${offset}`;
  } catch {
    return "timezone-error";
  }
}

/**
 * Get language fingerprint
 */
function getLanguageFingerprint(): string {
  const languages = navigator.languages
    ? Array.from(navigator.languages).join(",")
    : navigator.language || "unknown";
  return languages;
}

/**
 * Get platform fingerprint
 */
function getPlatformFingerprint(): string {
  return navigator.platform || "unknown";
}

/**
 * Parse user agent for useful fingerprint components
 */
function getUserAgentFingerprint(): string {
  const ua = navigator.userAgent;
  // Extract browser/OS info without full user agent (for privacy)
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Version)\/(\d+)/);
  if (match) {
    return `${match[1]}${match[2]}`;
  }
  return "unknown-ua";
}

/**
 * Get hardware concurrency (number of processor cores)
 */
function getHardwareConcurrency(): string {
  return `cpu-${navigator.hardwareConcurrency || "unknown"}`;
}

/**
 * Get device memory if available
 */
function getDeviceMemory(): string {
  const deviceMemory = (navigator as any).deviceMemory;
  return deviceMemory ? `mem-${deviceMemory}gb` : "mem-unknown";
}

/**
 * Main function to generate browser fingerprint
 * Combines multiple data points for stable identification
 */
export async function getBrowserFingerprint(): Promise<string> {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    // Collect fingerprint components
    const components = [
      getCanvasFingerprint(),
      getWebGLFingerprint(),
      getScreenFingerprint(),
      getTimezoneFingerprint(),
      getLanguageFingerprint(),
      getPlatformFingerprint(),
      getUserAgentFingerprint(),
      getHardwareConcurrency(),
      getDeviceMemory(),
    ];

    // Combine all components
    const combined = components.join("|");

    // Hash the combined string
    const fingerprint = await hashString(combined);

    // Cache the fingerprint
    cachedFingerprint = fingerprint;

    return fingerprint;
  } catch (error) {
    console.error("Error generating browser fingerprint:", error);
    // Return a pseudo-random fallback if fingerprinting fails
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Clear the cached fingerprint (useful for testing)
 */
export function clearCachedFingerprint(): void {
  cachedFingerprint = null;
}
