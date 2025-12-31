'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Key, Shield } from 'lucide-react';
import Link from 'next/link';

interface Step {
  title: string;
  description: string;
  action?: string;
  link?: string;
  substeps?: string[];
}

export default function YouTubeApiKeyGuide(): React.JSX.Element {
  const steps: Step[] = [
    {
      title: 'Go to Google Cloud Console',
      description: 'Visit the Google Cloud Console to create a new project or select an existing one.',
      action: 'Visit Console',
      link: 'https://console.cloud.google.com/',
      substeps: [
        'Sign in with your Google account',
        'If you don\'t have a Google Cloud account, you\'ll need to create one (free tier available)',
      ],
    },
    {
      title: 'Create a New Project',
      description: 'Create a dedicated project for your YouTube API usage.',
      substeps: [
        'Click on the project dropdown at the top of the page',
        'Click "NEW PROJECT" button',
        'Enter a project name (e.g., "Video Analytics")',
        'Click "CREATE"',
        'Wait for the project to be created (usually takes a few seconds)',
      ],
    },
    {
      title: 'Enable YouTube Data API v3',
      description: 'Enable the YouTube Data API v3 for your project.',
      action: 'Go to API Library',
      link: 'https://console.cloud.google.com/apis/library',
      substeps: [
        'Make sure your new project is selected in the project dropdown',
        'In the API Library, search for "YouTube Data API v3"',
        'Click on "YouTube Data API v3" from the search results',
        'Click the "ENABLE" button',
        'Wait for the API to be enabled',
      ],
    },
    {
      title: 'Create API Credentials',
      description: 'Create an API key to authenticate your requests.',
      action: 'Go to Credentials',
      link: 'https://console.cloud.google.com/apis/credentials',
      substeps: [
        'Click "CREATE CREDENTIALS" at the top',
        'Select "API key" from the dropdown',
        'Your API key will be created and displayed',
        'Click "Copy" to copy the API key',
        'IMPORTANT: Keep this key secure and never share it publicly',
      ],
    },
    {
      title: 'Restrict Your API Key (Recommended)',
      description: 'Add restrictions to your API key for better security.',
      substeps: [
        'In the API key dialog, click "EDIT API KEY" or find your key in the credentials list',
        'Under "API restrictions", select "Restrict key"',
        'Check only "YouTube Data API v3"',
        'Under "Application restrictions", you can optionally add:',
        '  - HTTP referrers (for website usage)',
        '  - IP addresses (for server usage)',
        'Click "SAVE" to apply the restrictions',
      ],
    },
    {
      title: 'Use Your API Key',
      description: 'Paste your API key in the Video Analytics Platform.',
      substeps: [
        'Go back to the Video Analytics Platform home page',
        'Click "Use your own YouTube API key (optional)"',
        'Paste your API key in the input field',
        'Your key will be saved in your browser for future use',
        'You\'re all set! Start analyzing videos with your own quota.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Key className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              How to Get a YouTube API Key
            </h1>
          </div>

          <p className="text-lg text-slate-600">
            Follow these step-by-step instructions to get your own YouTube Data API v3 key from Google Cloud Platform.
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important Information</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• The YouTube Data API has a quota limit of 10,000 units per day (free tier)</li>
                <li>• Each video analysis uses approximately 10-15 quota units</li>
                <li>• Keep your API key secure and never share it publicly</li>
                <li>• You can monitor your quota usage in the Google Cloud Console</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Security Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Security Best Practices</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Always restrict your API key to only the YouTube Data API v3</li>
                <li>• Add HTTP referrer restrictions if using in a web application</li>
                <li>• Regularly rotate your API keys for better security</li>
                <li>• Monitor API usage to detect any unauthorized access</li>
                <li>• Never commit API keys to version control (Git)</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
              className="bg-white rounded-2xl shadow-soft border-2 border-slate-100 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Step Number */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                <div className="flex-1">
                  {/* Step Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-slate-600 mb-4">{step.description}</p>

                  {/* Action Button */}
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors mb-4"
                    >
                      {step.action}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Substeps */}
                  {step.substeps && step.substeps.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {step.substeps.map((substep, subIndex) => (
                        <li key={subIndex} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{substep}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quota Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 mt-8"
        >
          <h3 className="font-semibold text-slate-900 mb-4 text-lg">
            Understanding YouTube API Quota
          </h3>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              The YouTube Data API v3 uses a quota system to limit API usage. Each request consumes a certain number of quota units:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Video details:</strong> ~3 units per request</li>
              <li><strong>Channel details:</strong> ~3 units per request</li>
              <li><strong>Comments:</strong> ~1 unit per request</li>
              <li><strong>Total per analysis:</strong> ~10-15 units (depending on features used)</li>
            </ul>
            <p className="mt-4">
              With the free tier quota of 10,000 units per day, you can analyze approximately <strong>600-1000 videos per day</strong>.
            </p>
            <p className="mt-2">
              You can monitor your quota usage in the{' '}
              <a
                href="https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Google Cloud Console Quotas page
              </a>
              .
            </p>
          </div>
        </motion.div>

        {/* Troubleshooting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white border-2 border-slate-200 rounded-2xl p-6 mt-6"
        >
          <h3 className="font-semibold text-slate-900 mb-4 text-lg">
            Common Issues & Troubleshooting
          </h3>
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                "API has not been used in project before or it is disabled"
              </h4>
              <p>
                Make sure you've enabled the YouTube Data API v3 in your Google Cloud project (Step 3). Wait a few minutes after enabling for the changes to propagate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                "The request cannot be completed because you have exceeded your quota"
              </h4>
              <p>
                You've reached your daily quota limit. You can either wait until the quota resets (midnight Pacific Time) or request a quota increase in the Google Cloud Console.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                "API key not valid. Please pass a valid API key"
              </h4>
              <p>
                Double-check that you've copied the entire API key correctly. Make sure there are no extra spaces or characters.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                "Requests to this API method are blocked"
              </h4>
              <p>
                Your API key restrictions might be too restrictive. Check your API key restrictions in the credentials page and ensure YouTube Data API v3 is allowed.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Video Analytics
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
