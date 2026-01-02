'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Youtube, Instagram, AlertCircle, Check } from 'lucide-react';
import type { ApiKeyPlatform, ApiKey, AddKeyRequest, UpdateKeyRequest } from '@/types/apiKey';

interface ApiKeyModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  apiKey?: ApiKey;
  onClose: () => void;
  onSubmit: (data: AddKeyRequest | UpdateKeyRequest) => void | Promise<void>;
  isLoading?: boolean;
}

const PLATFORM_CONFIG = {
  YOUTUBE: {
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    pattern: 'AIza',
    description: 'Get your key from Google Cloud Console',
  },
  INSTAGRAM: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    pattern: 'RapidAPI',
    description: 'Use your RapidAPI key for Instagram API',
  },
} as const;

export default function ApiKeyModal({
  isOpen,
  mode,
  apiKey,
  onClose,
  onSubmit,
  isLoading = false,
}: ApiKeyModalProps): React.JSX.Element {
  const [platform, setPlatform] = useState<ApiKeyPlatform>('YOUTUBE');
  const [keyValue, setKeyValue] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});

  // Initialize form with edit data
  useEffect(() => {
    if (mode === 'edit' && apiKey) {
      setPlatform(apiKey.platform);
      setLabel(apiKey.label || '');
      setKeyValue('');
      setShowKey(false);
    } else {
      setPlatform('YOUTUBE');
      setKeyValue('');
      setLabel('');
      setShowKey(false);
      setErrors({});
      setValidationState({});
    }
  }, [mode, apiKey, isOpen]);

  // Validate key format
  const validateKey = (key: string, plat: ApiKeyPlatform): boolean => {
    if (mode === 'edit') return true; // Skip validation for edit mode
    if (!key) return false;
    const config = PLATFORM_CONFIG[plat];
    return key.startsWith(config.pattern);
  };

  // Handle key change with validation
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setKeyValue(value);

    if (value) {
      const isValid = validateKey(value, platform);
      setValidationState((prev) => ({
        ...prev,
        key: isValid,
      }));

      if (!isValid) {
        const config = PLATFORM_CONFIG[platform];
        setErrors((prev) => ({
          ...prev,
          key: `${platform} keys should start with "${config.pattern}"`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.key;
          return newErrors;
        });
      }
    } else {
      setValidationState((prev) => {
        const newState = { ...prev };
        delete newState.key;
        return newState;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (mode === 'add' && !keyValue.trim()) {
      newErrors.key = 'API key is required';
    } else if (mode === 'add' && !validateKey(keyValue, platform)) {
      const config = PLATFORM_CONFIG[platform];
      newErrors.key = `${platform} keys should start with "${config.pattern}"`;
    }

    if (newErrors.key) {
      setErrors(newErrors);
      return;
    }

    try {
      const submitData: AddKeyRequest | UpdateKeyRequest =
        mode === 'add'
          ? {
              platform,
              apiKey: keyValue,
              label: label || undefined,
            }
          : {
              label: label || undefined,
            };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const config = PLATFORM_CONFIG[platform];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {mode === 'add' ? 'Add API Key' : 'Edit API Key'}
                </h2>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                {/* Platform Selection */}
                {mode === 'add' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3">
                      Platform
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.entries(PLATFORM_CONFIG) as Array<[ApiKeyPlatform, any]>).map(
                        ([key, plat]) => {
                          const PlatIcon = plat.icon;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setPlatform(key)}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                                ${
                                  platform === key
                                    ? `${plat.bgColor} border-slate-900`
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }
                              `}
                            >
                              <PlatIcon className={`w-6 h-6 ${plat.color}`} />
                              <span className="text-sm font-semibold text-slate-900">
                                {plat.name}
                              </span>
                              {platform === key && (
                                <Check className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full p-1" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{config.description}</p>
                  </div>
                )}

                {/* API Key Field */}
                {mode === 'add' && (
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-semibold text-slate-900 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        id="api-key"
                        type={showKey ? 'text' : 'password'}
                        value={keyValue}
                        onChange={handleKeyChange}
                        placeholder={`Paste your ${platform} API key...`}
                        disabled={isLoading}
                        className={`
                          w-full px-4 py-3 bg-white border-2 rounded-xl
                          text-slate-900 placeholder-slate-400
                          transition-all duration-200 font-mono text-sm
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${
                            errors.key
                              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                              : validationState.key
                                ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'
                                : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 disabled:opacity-50"
                        aria-label={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Validation Messages */}
                    {errors.key && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-start gap-2 text-red-600"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-medium">{errors.key}</p>
                      </motion.div>
                    )}

                    {validationState.key && !errors.key && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-start gap-2 text-green-600"
                      >
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-medium">Key format looks valid</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Label Field */}
                <div>
                  <label htmlFor="label" className="block text-sm font-semibold text-slate-900 mb-2">
                    Label <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="label"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={`e.g., "My Personal Key" or "Project ${platform}"`}
                    disabled={isLoading}
                    maxLength={50}
                    className="
                      w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl
                      text-slate-900 placeholder-slate-400
                      focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  />
                  <p className="text-xs text-slate-500 mt-1">{label.length}/50 characters</p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    Your API keys are encrypted and stored securely. Never share your keys with anyone.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || (mode === 'add' && !keyValue.trim())}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{mode === 'add' ? 'Adding...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{mode === 'add' ? 'Add Key' : 'Save Changes'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
