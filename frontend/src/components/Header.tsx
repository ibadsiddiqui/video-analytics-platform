"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Sparkles,
  Settings,
  Users,
  Lock,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AuthButton from "@/components/AuthButton";
import { ROUTES } from "@/config/routes";
import { useTierAccess } from "@/hooks/useTierAccess";

function Header() {
  const { isSignedIn } = useUser();
  const { canTrackCompetitors, loading: tierLoading } = useTierAccess();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            {/* Competitors Link (authenticated users only) */}
            {isSignedIn && (
              <Link
                href={
                  canTrackCompetitors ? ROUTES.COMPETITORS : ROUTES.PRO_FEATURES
                }
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                  canTrackCompetitors
                    ? "bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                    : "bg-slate-50 border border-slate-200 hover:bg-slate-100 opacity-60"
                }`}
                title={
                  canTrackCompetitors
                    ? "Track competitors"
                    : "Upgrade to PRO to unlock"
                }
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span
                  className={`text-sm font-medium ${canTrackCompetitors ? "text-blue-700" : "text-slate-700"}`}
                >
                  Competitors
                </span>
                {!tierLoading && !canTrackCompetitors && (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
              </Link>
            )}

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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>

            <div className="border-l border-slate-200/80 pl-4">
              <AuthButton />
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden border-t border-slate-200/80 py-3"
            >
              <div className="flex flex-col gap-2">
                <Link
                  href={ROUTES.PRO_FEATURES}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    {isSignedIn ? "Upgrade" : "Pro Features"}
                  </span>
                </Link>

                {isSignedIn && (
                  <>
                    <Link
                      href={
                        canTrackCompetitors
                          ? ROUTES.COMPETITORS
                          : ROUTES.PRO_FEATURES
                      }
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                        canTrackCompetitors
                          ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                          : "bg-slate-50 border border-slate-200 hover:bg-slate-100 opacity-60"
                      }`}
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span
                        className={`text-sm font-medium ${canTrackCompetitors ? "text-blue-700" : "text-slate-700"}`}
                      >
                        Competitors
                      </span>
                      {!tierLoading && !canTrackCompetitors && (
                        <Lock className="w-3 h-3 text-slate-400 ml-auto" />
                      )}
                    </Link>

                    <Link
                      href={ROUTES.SETTINGS.HOME}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-all duration-300"
                    >
                      <Settings className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Settings
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Header;
