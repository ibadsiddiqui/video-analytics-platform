"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AuthButton from "@/components/AuthButton";
import { ROUTES } from "@/config/routes";

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="border-b border-slate-200/80 bg-white/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={ROUTES.HOME}
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-pink opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-pink"></span>
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Video<span className="gradient-text">Analytics</span>
                </h1>
                <p className="text-xs text-slate-500 -mt-0.5">
                  AI-Powered Insights
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Right side */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href={ROUTES.PRO_FEATURES}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {isSignedIn ? "Upgrade" : "Pro Features"}
              </span>
            </Link>

            {/* Settings Link (authenticated users only) */}
            {isSignedIn && (
              <Link
                href={ROUTES.SETTINGS.HOME}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Settings
                </span>
              </Link>
            )}

            <div className="border-l border-slate-200/80 pl-4">
              <AuthButton />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

export default Header;
