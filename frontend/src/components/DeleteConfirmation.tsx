"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, AlertCircle } from "lucide-react";

interface DeleteConfirmationProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemPreview?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

export default function DeleteConfirmation({
  isOpen,
  title,
  description,
  itemPreview,
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = true,
}: DeleteConfirmationProps): React.JSX.Element {
  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-red-100/50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-slate-600 text-sm mb-4">{description}</p>

                {/* Item Preview */}
                {itemPreview && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      Will be deleted:
                    </p>
                    <p className="text-sm font-mono text-slate-700 break-all">
                      {itemPreview}
                    </p>
                  </div>
                )}

                {/* Warning message */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium">
                    This action cannot be undone. Please be certain.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
