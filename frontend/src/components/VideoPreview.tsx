"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Clock,
  Calendar,
  ExternalLink,
  Youtube,
  Instagram,
} from "lucide-react";

function VideoPreview({ video, channel }) {
  if (!video) return null;

  const getPlatformIcon = () => {
    switch (video.platform) {
      case "YOUTUBE":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "INSTAGRAM":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      default:
        return <Play className="w-4 h-4 text-primary-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100"
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative md:w-80 flex-shrink-0">
          <div className="aspect-video md:aspect-auto md:h-full bg-slate-100">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <Play className="w-12 h-12 text-slate-400" />
              </div>
            )}
          </div>

          {/* Duration badge */}
          {video.durationFormatted && (
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
              {video.durationFormatted}
            </div>
          )}

          {/* Platform badge */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              {getPlatformIcon()}
              <span className="text-xs font-medium text-slate-700">
                {video.platform}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* Title */}
            <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
              {video.title || "Untitled Video"}
            </h2>

            {/* Channel info */}
            {channel && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {channel.thumbnail ? (
                    <img
                      src={channel.thumbnail}
                      alt={channel.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    channel.name?.[0]?.toUpperCase() || "C"
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {channel.name || "Unknown Channel"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {channel.subscribersFormatted || "0"} subscribers
                  </p>
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-auto">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(video.publishedAt)}</span>
              </div>

              {video.durationFormatted && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{video.durationFormatted}</span>
                </div>
              )}
            </div>

            {/* Watch link */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on{" "}
                {video.platform === "YOUTUBE"
                  ? "YouTube"
                  : video.platform === "INSTAGRAM"
                    ? "Instagram"
                    : "Source"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default VideoPreview;
