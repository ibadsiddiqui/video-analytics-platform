"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Lock, AlertCircle, Loader } from "lucide-react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import ApiKeyCard from "@/components/ApiKeyCard";
import ApiKeyModal from "@/components/ApiKeyModal";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ROUTES } from "@/config/routes";
import type { ApiKey, AddKeyRequest, UpdateKeyRequest } from "@/types/apiKey";

const TIER_CONFIG = {
  FREE: {
    name: "FREE",
    limit: 5,
    color: "slate",
    icon: "Sparkles",
    features: ["5 analyses/day", "Basic sentiment"],
  },
  CREATOR: {
    name: "CREATOR",
    limit: 100,
    color: "primary",
    icon: "Zap",
    features: ["100 analyses/day", "API key management"],
  },
  PRO: {
    name: "PRO",
    limit: 500,
    color: "amber",
    icon: "Crown",
    features: ["500 analyses/day", "Unlimited API keys"],
  },
  AGENCY: {
    name: "AGENCY",
    limit: 2000,
    color: "purple",
    icon: "Building2",
    features: ["2,000 analyses/day", "Unlimited API keys"],
  },
} as const;

export default function SettingsPage(): React.JSX.Element {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const {
    keys,
    loading,
    error,
    addKey,
    updateKey,
    deleteKey,
    testKey,
    refetch,
  } = useApiKeys();
  const { profile, loading: profileLoading } = useUserProfile();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedKey, setSelectedKey] = useState<ApiKey | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(ROUTES.SIGN_IN);
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch API keys on mount
  useEffect(() => {
    if (isSignedIn) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleOpenAddModal = (): void => {
    setModalMode("add");
    setSelectedKey(undefined);
    setModalOpen(true);
  };

  const handleOpenEditModal = (apiKey: ApiKey): void => {
    setModalMode("edit");
    setSelectedKey(apiKey);
    setModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setModalOpen(false);
    setSelectedKey(undefined);
  };

  const handleModalSubmit = async (
    data: AddKeyRequest | UpdateKeyRequest,
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await addKey(data as AddKeyRequest);
      } else if (selectedKey) {
        await updateKey(selectedKey.id, data as UpdateKeyRequest);
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestKey = async (apiKey: ApiKey): Promise<void> => {
    setIsTesting(apiKey.id);
    try {
      await testKey(apiKey.id);
    } finally {
      setIsTesting(null);
    }
  };

  const handleToggleKey = async (apiKey: ApiKey): Promise<void> => {
    setIsSubmitting(true);
    try {
      await updateKey(apiKey.id, { isActive: !apiKey.isActive });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = (apiKey: ApiKey): void => {
    setKeyToDelete(apiKey);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (keyToDelete) {
      setIsSubmitting(true);
      try {
        await deleteKey(keyToDelete.id);
        setDeleteConfirmOpen(false);
        setKeyToDelete(undefined);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get user tier from profile, default to FREE
  const userTier: keyof typeof TIER_CONFIG =
    (profile?.tier as keyof typeof TIER_CONFIG) || "FREE";
  const tierConfig = TIER_CONFIG[userTier];
  const requestsUsedToday = profile?.dailyRequests || 0;
  const requestsLimit = profile?.dailyLimit || tierConfig.limit;

  // Helper to get tier badge color
  const getTierBadgeColor = (tier: string): string => {
    if (tier === "FREE") return "bg-slate-100 text-slate-700";
    if (tier === "CREATOR") return "bg-primary-100 text-primary-700";
    if (tier === "PRO") return "bg-amber-100 text-amber-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
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

            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">
                  Settings
                </h1>
                <p className="text-lg text-slate-600">
                  Manage your account, Tier, and API keys
                </p>
              </div>
            </div>
          </motion.div>

          {/* Account Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft border-2 border-slate-100 p-6 sm:p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Account Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Email
                </p>
                <p className="text-lg text-slate-900 font-medium">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              {/* Tier */}
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Current Plan
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                    ${getTierBadgeColor(userTier)}
                  `}
                  >
                    {tierConfig.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limit Display */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Daily Request Limit
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">
                    Requests used today
                  </span>
                  <span className="text-slate-900 font-bold">
                    {requestsUsedToday} / {requestsLimit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className={`
                      h-full rounded-full transition-all duration-500
                      ${requestsUsedToday >= requestsLimit * 0.9 && "bg-gradient-to-r from-red-500 to-red-600"}
                      ${requestsUsedToday >= requestsLimit * 0.7 && requestsUsedToday < requestsLimit * 0.9 && "bg-gradient-to-r from-amber-500 to-amber-600"}
                      ${requestsUsedToday < requestsLimit * 0.7 && "bg-gradient-to-r from-green-500 to-green-600"}
                    `}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (requestsUsedToday / requestsLimit) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                <p className="text-sm text-slate-600">
                  {requestsLimit - requestsUsedToday} requests remaining
                </p>
              </div>

              {/* Upgrade prompt */}
              {(userTier as string) === "FREE" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary-900 mb-2">
                      Upgrade to Creator Plan
                    </p>
                    <p className="text-sm text-primary-800 mb-3">
                      Get 100 requests per day, API key management, and more!
                    </p>
                    <Link
                      href={ROUTES.PRO_FEATURES}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      View Plans
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* API Keys Section */}
          {(userTier as string) !== "FREE" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-soft border-2 border-slate-100 p-6 sm:p-8 mb-6"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    API Keys
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage your YouTube and Instagram API keys
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenAddModal}
                  disabled={loading || isSubmitting}
                  className="
                    flex items-center gap-2 px-4 py-3
                    bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                    text-white font-semibold rounded-xl
                    shadow-lg shadow-primary-500/25 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add API Key</span>
                </motion.button>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-3" />
                    <p className="text-slate-600 font-medium">
                      Loading API keys...
                    </p>
                  </div>
                </div>
              )}

              {/* API Keys list or empty state */}
              {!loading && keys.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 px-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    No API Keys Added Yet
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                    Add your first API key to start using custom credentials for
                    video analysis.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="
                      inline-flex items-center gap-2 px-6 py-3
                      bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                      text-white font-semibold rounded-xl
                      shadow-lg shadow-primary-500/25 transition-all
                    "
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Key
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence>
                    {keys.map((apiKey) => (
                      <ApiKeyCard
                        key={apiKey.id}
                        apiKey={apiKey}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteKey}
                        onToggle={handleToggleKey}
                        onTest={handleTestKey}
                        isLoading={isSubmitting || isTesting === apiKey.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Security notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3"
              >
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 font-medium">
                  Your API keys are encrypted and stored securely. Never share
                  your keys with anyone.
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={modalOpen}
        mode={modalMode}
        apiKey={selectedKey}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
      />

      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        title="Delete API Key?"
        description="This will permanently delete the API key and you won't be able to use it anymore."
        itemPreview={keyToDelete?.maskedKey}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        isLoading={isSubmitting}
        isDangerous
      />

      <Toaster position="bottom-right" />
    </div>
  );
}
