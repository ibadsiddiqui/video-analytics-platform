"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Key,
  Plus,
  Settings,
  Youtube,
  Instagram,
} from "lucide-react";
import Link from "next/link";
import type { ApiKey, ApiKeyPlatform } from "@/types/apiKey";
import { ROUTES } from "@/config/routes";

interface ApiKeySelectorProps {
  platform: ApiKeyPlatform;
  selectedKeyId: string | null;
  onSelect: (keyId: string | null) => void;
  userKeys: ApiKey[];
  loading?: boolean;
  disabled?: boolean;
}

function ApiKeySelector({
  platform,
  selectedKeyId,
  onSelect,
  userKeys,
  loading = false,
  disabled = false,
}: ApiKeySelectorProps): React.JSX.Element {
  // Filter keys for this platform
  const platformKeys = userKeys.filter(
    (key) => key.platform === platform && key.isActive,
  );

  // Get platform icon and color
  const getPlatformIcon = () => {
    switch (platform) {
      case "YOUTUBE":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "INSTAGRAM":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      default:
        return <Key className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case "YOUTUBE":
        return "red";
      case "INSTAGRAM":
        return "pink";
      default:
        return "slate";
    }
  };

  const platformColor = getPlatformColor();
  const platformName = platform === "YOUTUBE" ? "YouTube" : "Instagram";

  // Get selected key label
  const getSelectedLabel = () => {
    if (!selectedKeyId) {
      return "Use system key (default)";
    }
    const selectedKey = platformKeys.find((key) => key.id === selectedKeyId);
    return selectedKey
      ? selectedKey.label || `Key ending in ${selectedKey.maskedKey.slice(-4)}`
      : "Use system key (default)";
  };

  return (
    <div className="space-y-2">
      <label
        className={`flex items-center gap-2 text-sm font-medium text-slate-700`}
      >
        {getPlatformIcon()}
        {platformName} API Key
      </label>

      <div className="relative">
        <select
          value={selectedKeyId || ""}
          onChange={(e) => onSelect(e.target.value || null)}
          disabled={loading || disabled}
          className={`
            w-full px-4 py-2.5 pr-10 border border-${platformColor}-300 rounded-lg
            focus:ring-2 focus:ring-${platformColor}-500 focus:border-transparent
            outline-none transition-all appearance-none cursor-pointer
            bg-white text-slate-900
            ${loading || disabled ? "opacity-50 cursor-not-allowed" : "hover:border-${platformColor}-400"}
          `}
        >
          {/* Default option: Use system key */}
          <option value="">Use system key (default)</option>

          {/* User's keys */}
          {platformKeys.length > 0 && (
            <optgroup label="Your API Keys">
              {platformKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.label || `Key ending in ${key.maskedKey.slice(-4)}`}
                  {key.lastUsedAt &&
                    ` - Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Helper text and actions */}
      <div className="flex items-center justify-between text-xs">
        {platformKeys.length === 0 ? (
          <p className="text-slate-500">
            No {platformName} keys yet.{" "}
            <Link
              href={ROUTES.SETTINGS.HOME}
              className={`underline font-medium`}
            >
              Add your first key
            </Link>
          </p>
        ) : (
          <p className="text-slate-500">
            {platformKeys.length} key{platformKeys.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        )}

        <Link
          href={ROUTES.SETTINGS.HOME}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Manage</span>
        </Link>
      </div>

      {/* Selected key info */}
      {selectedKeyId && platformKeys.find((k) => k.id === selectedKeyId) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`p-3 bg-${platformColor}-50 border border-${platformColor}-200 rounded-lg`}
        >
          <p className={`text-xs text-${platformColor}-800`}>
            <strong>Using your API key:</strong>{" "}
            {platformKeys.find((k) => k.id === selectedKeyId)?.maskedKey}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ApiKeySelector;
