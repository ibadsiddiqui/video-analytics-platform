"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Key,
  Shield,
  Instagram,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { ROUTES, EXTERNAL_LINKS } from "@/config/routes";

interface Step {
  title: string;
  description: string;
  action?: string;
  link?: string;
  substeps?: string[];
}

export default function RapidApiKeyGuide(): React.JSX.Element {
  const steps: Step[] = [
    {
      title: "Create a RapidAPI Account",
      description:
        "Sign up for a free RapidAPI account to access thousands of APIs, including Instagram data.",
      action: "Go to RapidAPI",
      link: EXTERNAL_LINKS.RAPIDAPI,
      substeps: [
        "Click 'Sign Up' in the top right corner",
        "Sign up with Google, GitHub, or email",
        "Verify your email address if required",
        "Complete your profile setup",
      ],
    },
    {
      title: "Find Instagram Scraper Stable API",
      description:
        "Navigate to the Instagram Scraper Stable API to get Instagram post and reel analytics.",
      action: "Visit Instagram API",
      link: "https://rapidapi.com/thetechguy32744/api/instagram-scraper-stable-api",
      substeps: [
        "Search for 'Instagram Scraper Stable API' in the RapidAPI search bar",
        "Click on 'Instagram Scraper Stable API' by thetechguy32744",
        "You'll see the API documentation and pricing plans",
      ],
    },
    {
      title: "Subscribe to the API",
      description:
        "Choose a pricing plan that fits your needs. Free tier is available with limited requests.",
      substeps: [
        "Click the 'Subscribe to Test' or 'Pricing' button",
        "Select a plan (Basic plan is free with 500 requests/month)",
        "Review the pricing and request limits",
        "Click 'Subscribe' to activate your subscription",
        "You may need to add a payment method even for the free tier",
      ],
    },
    {
      title: "Get Your API Key",
      description:
        "Copy your RapidAPI key to use with the Video Analytics Platform.",
      substeps: [
        "After subscribing, you'll see the API endpoints page",
        "Look for 'x-rapidapi-key' in the code snippets section",
        "Your API key will be automatically shown in the header examples",
        "Click 'Copy' next to your API key or select and copy it",
        "IMPORTANT: Keep this key secure and never share it publicly",
      ],
    },
    {
      title: "Test the API (Optional)",
      description: "Verify your API key works by testing it on RapidAPI.",
      substeps: [
        "On the Instagram Scraper API 2 page, go to the 'Endpoints' tab",
        "Select an endpoint like 'Post Info'",
        "Enter a test Instagram post shortcode (e.g., 'C9dXHYJPQZr')",
        "Click 'Test Endpoint'",
        "You should see a successful response with Instagram data",
      ],
    },
    {
      title: "Use Your API Key",
      description:
        "Add your RapidAPI key to the Video Analytics Platform to analyze Instagram content.",
      substeps: [
        "Go back to the Video Analytics Platform home page",
        "Click 'Use your own API keys (optional)'",
        "Paste your RapidAPI key in the 'RapidAPI Key (for Instagram)' field",
        "Your key will be saved in your browser for future use",
        "You're all set! Start analyzing Instagram posts and reels.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">
                How to Get a RapidAPI Key for Instagram
              </h1>
            </div>

            <p className="text-lg text-slate-600">
              Follow these step-by-step instructions to get your own RapidAPI
              key for accessing Instagram analytics data.
            </p>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">
                  Important Information
                </h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>
                    • RapidAPI offers a free tier with 500 requests per month
                  </li>
                  <li>
                    • Instagram data is accessed through third-party APIs
                    (Instagram&apos;s official API has restrictions)
                  </li>
                  <li>
                    • Keep your API key secure and never share it publicly
                  </li>
                  <li>
                    • You can monitor your usage in the RapidAPI dashboard
                  </li>
                  <li>
                    • Upgrade to higher tiers for more requests and faster rate
                    limits
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Security Best Practices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Security Best Practices
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Your RapidAPI key grants access to all subscribed APIs
                  </li>
                  <li>
                    • Never expose your API key in client-side code or public
                    repositories
                  </li>
                  <li>
                    • Regularly monitor your API usage to detect unauthorized
                    access
                  </li>
                  <li>
                    • You can regenerate your API key in RapidAPI settings if
                    compromised
                  </li>
                  <li>
                    • Set up usage alerts to be notified when approaching your
                    quota limit
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                className="bg-white rounded-2xl shadow-soft border-2 border-slate-100 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    {/* Step Title */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="text-slate-600 mb-4">{step.description}</p>

                    {/* Action Button */}
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors mb-4"
                      >
                        {step.action}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Substeps */}
                    {step.substeps && step.substeps.length > 0 && (
                      <ul className="space-y-2 mt-4">
                        {step.substeps.map((substep, subIndex) => (
                          <li
                            key={subIndex}
                            className="flex items-start gap-2 text-slate-700"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{substep}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 mt-8"
          >
            <h3 className="font-semibold text-slate-900 mb-4 text-lg">
              Understanding RapidAPI Pricing for Instagram
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p>
                The Instagram Scraper API 2 offers several pricing tiers to fit
                different usage needs:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Basic (Free):</strong> 500 requests/month - Perfect
                  for testing and personal use
                </li>
                <li>
                  <strong>Pro:</strong> 10,000 requests/month - Suitable for
                  small businesses and content creators
                </li>
                <li>
                  <strong>Ultra:</strong> 100,000 requests/month - For agencies
                  and high-volume users
                </li>
                <li>
                  <strong>Mega:</strong> Unlimited requests - Enterprise-level
                  access
                </li>
              </ul>
              <p className="mt-4">
                You can monitor your usage and upgrade your plan anytime in the{" "}
                <a
                  href="https://rapidapi.com/developer/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  RapidAPI Dashboard
                </a>
                .
              </p>
            </div>
          </motion.div>

          {/* Troubleshooting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white border-2 border-slate-200 rounded-2xl p-6 mt-6"
          >
            <h3 className="font-semibold text-slate-900 mb-4 text-lg">
              Common Issues & Troubleshooting
            </h3>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  &quot;403 Forbidden&quot; or &quot;401 Unauthorized&quot; error
                </h4>
                <p>
                  This usually means your API key is invalid or you haven&apos;t
                  subscribed to the Instagram Scraper API 2. Make sure you&apos;ve
                  completed the subscription process and copied the correct API
                  key.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  &quot;You have exceeded the rate limit&quot;
                </h4>
                <p>
                  You&apos;ve used all your monthly requests for your current plan.
                  You can either wait until next month or upgrade to a higher
                  tier plan in the RapidAPI dashboard.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  &quot;Invalid shortcode&quot; error
                </h4>
                <p>
                  The Instagram post URL might be incorrectly formatted. Make
                  sure you&apos;re using a valid Instagram post, reel, or TV URL
                  (e.g., instagram.com/p/ABC123 or instagram.com/reel/XYZ789).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  API returns limited data
                </h4>
                <p>
                  Some Instagram accounts may have privacy settings that limit
                  the data available through the API. Public accounts generally
                  provide more complete data.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-12 text-center"
          >
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/25 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Video Analytics
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
