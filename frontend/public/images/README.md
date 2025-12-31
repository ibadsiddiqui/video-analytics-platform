# Static Images Directory

This directory contains all static images and assets for the Video Analytics Platform.

## Required Assets

The following assets are referenced in the application and need to be added:

### Favicon and Icons

- **favicon.ico** (32x32 or 16x16) - Browser tab icon
- **icon.svg** - Scalable vector icon for modern browsers
- **apple-touch-icon.png** (180x180) - iOS home screen icon

### Open Graph / Social Sharing

- **og-image.png** (1200x630) - Open Graph image for social media sharing
  - Used when sharing links on Facebook, Twitter, LinkedIn, etc.
  - Should include app branding and descriptive text

### PWA Icons

Progressive Web App icons in various sizes:

- **icon-192x192.png** (192x192) - Android home screen icon
- **icon-512x512.png** (512x512) - Android splash screen
- **icon-maskable-192x192.png** (192x192) - Maskable icon for Android
- **icon-maskable-512x512.png** (512x512) - Maskable icon for Android

### Screenshots

PWA screenshots for app store listings:

- **screenshot-desktop.png** (1280x720) - Desktop/wide format screenshot
- **screenshot-mobile.png** (750x1334) - Mobile/narrow format screenshot

## Design Guidelines

### Favicon & Icons
- Use the app's primary color scheme (primary-500: #6366f1, accent-purple: #8b5cf6)
- Include the BarChart3 icon or similar analytics symbol
- Maintain clarity at small sizes

### Open Graph Image
- Dimensions: 1200x630 pixels
- Include:
  - App name: "Video Analytics Platform"
  - Tagline: "AI-Powered Video Insights"
  - Visual elements: Charts, analytics symbols
  - Keep text readable at smaller sizes

### PWA Icons
- Follow [Progressive Web App icon guidelines](https://web.dev/maskable-icon/)
- Use solid background colors
- Ensure icon is centered and has proper padding
- Test maskable icons with safe zone (40px from edges on 192x192)

## Tools for Creating Assets

- **Favicon Generator**: [RealFaviconGenerator](https://realfavicongenerator.net/)
- **OG Image Generator**: [Cloudinary OG Image Generator](https://www.bannerbear.com/tools/open-graph-image-generator/)
- **PWA Icon Generator**: [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- **Design Tools**: Figma, Adobe Illustrator, Canva

## Current Status

⚠️ **Assets Pending**: All image assets are currently missing and need to be created.

The application will function without these assets, but they are important for:
- Professional appearance
- SEO optimization
- Social media sharing
- Mobile home screen installation
- Brand consistency

## Adding Assets

Simply place the generated assets in this directory (`/public/images/`) with the exact filenames listed above.
