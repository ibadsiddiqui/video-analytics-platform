import { NextRequest, NextResponse } from "next/server";

/**
 * Image Proxy API Route
 * Proxies external images to bypass CORS restrictions (especially for Instagram)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL parameter" },
        { status: 400 },
      );
    }

    // Validate that it's a valid URL
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Only allow specific domains for security
    const allowedDomains = [
      "cdninstagram.com",
      "instagram.com",
      "ytimg.com",
      "youtube.com",
    ];

    const isAllowed = allowedDomains.some((domain) =>
      url.hostname.includes(domain),
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 },
      );
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        // Don't send referrer to bypass Instagram's referrer checks
        Referer: "",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: imageResponse.status },
      );
    }

    // Get the image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Get content type from the response
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
