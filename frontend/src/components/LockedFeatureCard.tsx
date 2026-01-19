'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

interface LockedFeatureCardProps {
  feature: string;
  requiredTier: 'CREATOR' | 'PRO' | 'AGENCY';
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
        <button className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Upgrade to Unlock
        </button>
      </Link>
    </div>
  );
}
