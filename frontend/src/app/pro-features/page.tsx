"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Crown,
  Building2,
  UserPlus,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { ROUTES } from "@/config/routes";

interface TierFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  icon: React.ReactNode;
  price: string;
  period: string;
  description: string;
  dailyRequests: number;
  features: TierFeature[];
  cta: string;
  popular?: boolean;
  gradient: string;
  iconBg: string;
}

export default function ProFeaturesPage(): React.JSX.Element {
  const tiers: PricingTier[] = [
    {
      name: "FREE",
      icon: <Sparkles className="w-6 h-6" />,
      price: "$0",
      period: "forever",
      description: "Perfect for trying out the platform",
      dailyRequests: 5,
      gradient: "from-slate-500 to-slate-600",
      iconBg: "bg-slate-100",
      cta: "Get Started",
      features: [
        { name: "5 video analyses per day", included: true },
        { name: "Basic sentiment analysis", included: true },
        { name: "Top 10 comments display", included: true },
        { name: "Engagement metrics", included: true },
        { name: "YouTube support", included: true },
        { name: "Instagram support", included: false },
        { name: "API key management", included: false },
        { name: "Historical analytics", included: false },
        { name: "Priority support", included: false },
      ],
    },
    {
      name: "CREATOR",
      icon: <Zap className="w-6 h-6" />,
      price: "$9",
      period: "per month",
      description: "For content creators analyzing their videos",
      dailyRequests: 100,
      gradient: "from-primary-500 to-primary-600",
      iconBg: "bg-primary-100",
      cta: "Start Creating",
      popular: true,
      features: [
        { name: "100 video analyses per day", included: true },
        { name: "Advanced sentiment analysis", included: true },
        { name: "Top 50 comments display", included: true },
        { name: "Detailed engagement metrics", included: true },
        { name: "YouTube support", included: true },
        { name: "Instagram support", included: true },
        { name: "API key management", included: true },
        { name: "7-day historical analytics", included: true },
        { name: "Email support", included: true },
      ],
    },
    {
      name: "PRO",
      icon: <Crown className="w-6 h-6" />,
      price: "$29",
      period: "per month",
      description: "For professionals and small teams",
      dailyRequests: 500,
      gradient: "from-amber-500 to-amber-600",
      iconBg: "bg-amber-100",
      cta: "Go Pro",
      features: [
        { name: "500 video analyses per day", included: true },
        { name: "Advanced sentiment analysis", included: true },
        { name: "Unlimited comments display", included: true },
        { name: "Comprehensive analytics dashboard", included: true },
        { name: "YouTube support", included: true },
        { name: "Instagram support", included: true },
        { name: "API key management", included: true },
        { name: "30-day historical analytics", included: true },
        { name: "Priority email support", included: true },
        { name: "Competitor analysis", included: true },
        { name: "Export to CSV/PDF", included: true },
      ],
    },
    {
      name: "AGENCY",
      icon: <Building2 className="w-6 h-6" />,
      price: "$99",
      period: "per month",
      description: "For agencies managing multiple clients",
      dailyRequests: 2000,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      cta: "Contact Sales",
      features: [
        { name: "2,000 video analyses per day", included: true },
        { name: "Advanced sentiment analysis", included: true },
        { name: "Unlimited comments display", included: true },
        { name: "Custom analytics dashboard", included: true },
        { name: "YouTube support", included: true },
        { name: "Instagram support", included: true },
        { name: "Unlimited API key management", included: true },
        { name: "Unlimited historical analytics", included: true },
        { name: "24/7 priority support", included: true },
        { name: "Competitor analysis", included: true },
        { name: "Export to CSV/PDF", included: true },
        { name: "White-label reports", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom integrations", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-amber-100 rounded-xl">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
                Pro <span className="gradient-text">Features</span>
              </h1>
            </div>

            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the perfect plan for your video analytics needs. All plans
              include core features with increasing limits and advanced
              capabilities.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`
                  relative bg-white rounded-2xl shadow-soft border-2 p-6 hover:shadow-lg transition-all duration-300
                  ${tier.popular ? "border-primary-500 scale-105" : "border-slate-100"}
                `}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 ${tier.iconBg} rounded-xl mb-3`}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-600">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      {tier.price}
                    </span>
                    <span className="text-slate-600">/{tier.period}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-primary-600">
                    {tier.dailyRequests.toLocaleString()} requests/day
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.included ? "text-green-500" : "text-slate-300"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`
                    w-full py-3 rounded-xl font-semibold text-white transition-all duration-300
                    bg-gradient-to-r ${tier.gradient} hover:shadow-lg
                    ${tier.popular ? "shadow-md" : ""}
                  `}
                >
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-soft border-2 border-slate-100 p-6 overflow-x-auto"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Detailed Feature Comparison
            </h2>

            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">
                    FREE
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-primary-600">
                    CREATOR
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-amber-600">
                    PRO
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600">
                    AGENCY
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Daily Requests</td>
                  <td className="text-center py-4 px-4 text-slate-600">5</td>
                  <td className="text-center py-4 px-4 text-slate-600">100</td>
                  <td className="text-center py-4 px-4 text-slate-600">500</td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    2,000
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">YouTube Support</td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">
                    Instagram Support
                  </td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">
                    API Key Management
                  </td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    Unlimited
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">
                    Historical Analytics
                  </td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    7 days
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    30 days
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    Unlimited
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">
                    Competitor Analysis
                  </td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Export Reports</td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4 text-slate-400">—</td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    CSV/PDF
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    CSV/PDF + White-label
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Support</td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    Community
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    Email
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    Priority Email
                  </td>
                  <td className="text-center py-4 px-4 text-slate-600">
                    24/7 + Manager
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          {/* FAQ or Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-primary-50 to-amber-50 border-2 border-primary-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Not sure which plan is right for you?
              </h3>
              <p className="text-slate-600 mb-6">
                Start with our FREE tier and upgrade anytime as your needs grow.
                All plans can be changed or cancelled at any time.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href={ROUTES.SIGN_UP}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </Link>
                <Link
                  href={ROUTES.HOME}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 rounded-xl font-semibold transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Contact Sales
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
