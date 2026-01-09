"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, CheckCircle, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ROUTES } from "@/config/routes";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  requestsLimit: number;
  resetAt: Date | null;
}

function UpgradePrompt({
  isOpen,
  onClose,
  requestsLimit,
  resetAt,
}: UpgradePromptProps): React.JSX.Element {
  const [isClosing, setIsClosing] = useState(false);
  const { isSignedIn, user } = useUser();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150);
  };

  const formatResetTime = (date: Date): string => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    if (date.toDateString() === midnight.toDateString()) {
      return "tomorrow at midnight";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const features = [
    {
      icon: Zap,
      title: "Unlimited Requests",
      description: "Analyze unlimited videos without daily limits",
    },
    {
      icon: Clock,
      title: "Save History",
      description: "Keep track of all your analyzed videos",
    },
    {
      icon: Crown,
      title: "Pro Features",
      description: "Access advanced analytics and insights",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-purple/5 pointer-events-none" />

              {/* Content */}
              <div className="relative p-8 sm:p-10">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-pink/50 rounded-full blur-lg opacity-50" />
                      <Crown className="w-12 h-12 text-primary-600 relative" />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    You&apos;ve reached your daily limit
                  </h2>

                  <p className="text-slate-600 text-sm sm:text-base">
                    {isSignedIn
                      ? `Your FREE plan allows ${requestsLimit} analyses per day. Upgrade to get unlimited access and pro features.`
                      : `You have ${requestsLimit} free analyses per day. Create a free account to continue.`}
                  </p>
                </div>

                {/* Reset time info */}
                {resetAt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <p className="text-sm text-amber-800">
                      Your limit resets{" "}
                      <span className="font-semibold">
                        {formatResetTime(resetAt)}
                      </span>
                    </p>
                  </motion.div>
                )}

                {/* Features list */}
                <div className="space-y-3 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 pt-1">
                          <Icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">
                            {feature.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {feature.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-3"
                >
                  {isSignedIn ? (
                    <>
                      {/* Upgrade button for logged-in users */}
                      <Link href={ROUTES.PRO_FEATURES} className="block w-full">
                        <button
                          className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-600/30 active:scale-95"
                          aria-label="Upgrade to pro plan"
                        >
                          Upgrade Plan
                        </button>
                      </Link>

                      {/* Dismiss button */}
                      <button
                        onClick={handleClose}
                        className="w-full px-6 py-2 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        aria-label="Close dialog and continue"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Sign up button for anonymous users */}
                      <Link href={ROUTES.SIGN_UP} className="block w-full">
                        <button
                          className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-600/30 active:scale-95"
                          aria-label="Create a free account"
                        >
                          Create Free Account
                        </button>
                      </Link>

                      {/* Sign in link */}
                      <div className="text-center">
                        <p className="text-sm text-slate-600 mb-2">
                          Already have an account?{" "}
                        </p>
                        <Link
                          href={ROUTES.SIGN_IN}
                          className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
                          aria-label="Sign in to your account"
                        >
                          Sign In
                        </Link>
                      </div>

                      {/* Continue as guest button */}
                      <button
                        onClick={handleClose}
                        className="w-full px-6 py-2 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        aria-label="Continue using the app as a guest"
                      >
                        Continue as Guest
                      </button>
                    </>
                  )}
                </motion.div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
                  {isSignedIn
                    ? "Upgrade your plan to analyze unlimited videos and unlock pro features."
                    : "No credit card required. Create an account to unlock unlimited video analytics."}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpgradePrompt;
