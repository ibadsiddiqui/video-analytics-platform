'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Users, User } from 'lucide-react';

const AGE_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];

function DemographicsChart({ demographics }) {
  if (!demographics) return null;

  const { ageDistribution, genderSplit } = demographics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-rose-50">
          <Users className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Audience Demographics</h3>
          <p className="text-sm text-slate-500">Estimated audience breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-4">Age Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="range" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  width={45}
                />
                <Bar dataKey="percentage" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AGE_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Split */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-4">Gender Split</h4>
          <div className="space-y-4 pt-2">
            {/* Male */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Male</span>
                </div>
                <span className="text-lg font-bold text-blue-500">{genderSplit.male}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${genderSplit.male}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* Female */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-50">
                    <User className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Female</span>
                </div>
                <span className="text-lg font-bold text-pink-500">{genderSplit.female}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${genderSplit.female}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Visual representation */}
          <div className="mt-6 flex items-center justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className={`w-4 h-4 rounded-full ${
                  i < Math.round(genderSplit.male / 10) 
                    ? 'bg-blue-400' 
                    : 'bg-pink-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        * Demographics are estimated based on typical audience patterns
      </p>
    </motion.div>
  );
}

export default DemographicsChart;
