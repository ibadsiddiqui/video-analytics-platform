"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

const COLORS = [
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fb923c",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-primary-600">
          {payload[0].value.toLocaleString()} engagements
        </p>
      </div>
    );
  }
  return null;
}

interface EngagementChartProps {
  data: {
    byDay: Array<{ day: string; engagement: number; views: number }>;
    peakDay: { day: string; engagement: number; views: number } | null;
  };
}

function EngagementChart({ data }: EngagementChartProps) {
  if (!data || !data.byDay) {
    return null;
  }

  const chartData = data.byDay;
  const peakDay = data.peakDay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary-50">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Engagement Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Daily engagement distribution
            </p>
          </div>
        </div>

        {peakDay && (
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 rounded-full self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-700">
              Peak: {peakDay.day}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="engagement" radius={[8, 8, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  opacity={entry.day === peakDay?.day ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-primary-500 to-accent-purple" />
          <span className="text-xs sm:text-sm text-slate-600">
            Engagement (likes + comments)
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default EngagementChart;
