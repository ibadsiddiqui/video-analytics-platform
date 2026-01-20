"use client";

import React from "react";
import { Lock } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

interface LockedFeatureCardProps {
  feature: string;
  requiredTier: "CREATOR" | "PRO" | "AGENCY";
}

export default function LockedFeatureCard({
  feature,
  requiredTier,
}: LockedFeatureCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-6 text-center">
      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-700 mb-2">
        {feature} - {requiredTier} Feature
      </p>
      <Link href={ROUTES.PRO_FEATURES}>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/30">
          Upgrade to Unlock
        </button>
      </Link>
    </div>
  );
}
