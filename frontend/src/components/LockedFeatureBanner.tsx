"use client";

import React from "react";
import { Lock, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/config/routes";

interface LockedFeatureBannerProps {
  feature: string;
  requiredTier: "CREATOR" | "PRO" | "AGENCY";
  description?: string;
}

export default function LockedFeatureBanner({
  feature,
  requiredTier,
  description,
}: LockedFeatureBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">{feature}</h2>

      <p className="text-slate-600 mb-4">
        {description || `This feature requires ${requiredTier} tier or higher`}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={ROUTES.PRO_FEATURES}>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl">
            <Sparkles className="w-5 h-5" />
            Upgrade to {requiredTier}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
