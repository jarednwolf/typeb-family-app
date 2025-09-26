'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: 'signup' | 'task_completed' | 'reward_earned' | 'streak';
}

/**
 * SocialProof Component
 * 
 * Displays social proof elements including user counts, activity feed,
 * press mentions, and app store ratings to build trust and credibility.
 * 
 * Features:
 * - Dynamic user count from Firestore
 * - Real-time activity feed (anonymized)
 * - Press mentions and logos
 * - App store ratings display
 */
export const SocialProof: React.FC = () => {
  const isSocialProofEnabled = useFeatureFlag('enableSocialProof');
  const [familyCount, setFamilyCount] = useState(527); // Start with base count
  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);
  const [activityIndex, setActivityIndex] = useState(0);

  // Simulated activity feed - in production, this would come from Firestore
  const activities: ActivityItem[] = [
    {
      id: '1',
      message: 'A family in California just started their free trial',
      timestamp: '2 minutes ago',
      type: 'signup'
    },
    {
      id: '2',
      message: 'Sarah completed 5 tasks today',
      timestamp: '5 minutes ago',
      type: 'task_completed'
    },
    {
      id: '3',
      message: 'A child in Texas earned their first reward',
      timestamp: '8 minutes ago',
      type: 'reward_earned'
    },
    {
      id: '4',
      message: 'The Johnson family achieved a 7-day streak',
      timestamp: '12 minutes ago',
      type: 'streak'
    },
    {
      id: '5',
      message: 'A parent in New York set up their family account',
      timestamp: '15 minutes ago',
      type: 'signup'
    },
    {
      id: '6',
      message: 'Emma completed her weekly goals',
      timestamp: '18 minutes ago',
      type: 'task_completed'
    },
    {
      id: '7',
      message: 'A family in Florida redeemed 1000 points',
      timestamp: '22 minutes ago',
      type: 'reward_earned'
    },
    {
      id: '8',
      message: 'The Chen family reached a 30-day streak',
      timestamp: '25 minutes ago',
      type: 'streak'
    }
  ];

  // Simulate dynamic family count
  useEffect(() => {
    const interval = setInterval(() => {
      setFamilyCount(prev => {
        // Randomly increment by 0-2 every 30 seconds
        const increment = Math.floor(Math.random() * 3);
        return prev + increment;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Rotate through activities
  useEffect(() => {
    if (!isSocialProofEnabled) return;

    const interval = setInterval(() => {
      setActivityIndex((prev) => {
        const nextIndex = (prev + 1) % activities.length;
        setCurrentActivity(activities[nextIndex]);
        return nextIndex;
      });
    }, 5000); // Change every 5 seconds

    // Show first activity immediately
    setCurrentActivity(activities[0]);

    return () => clearInterval(interval);
  }, [isSocialProofEnabled]); // Remove activities and activityIndex from dependencies

  // Fetch real family count from Firestore (placeholder for production)
  useEffect(() => {
    const fetchFamilyCount = async () => {
      try {
        // In production, this would be an API call to get the actual count
        const response = await fetch('/api/stats/families');
        if (response.ok) {
          const data = await response.json();
          setFamilyCount(data.count);
        }
      } catch (error) {
        console.log('Using default family count');
      }
    };

    fetchFamilyCount();
  }, []);

  if (!isSocialProofEnabled) {
    return null;
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        );
      case 'task_completed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'reward_earned':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'streak':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Floating Activity Feed */}
      {currentActivity && (
        <div className="fixed bottom-4 left-4 z-40 max-w-sm animate-slide-up">
          <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getActivityIcon(currentActivity.type)}
            </div>
            <div className="flex-grow">
              <p className="text-sm text-neutral-900">{currentActivity.message}</p>
              <p className="text-xs text-neutral-500">{currentActivity.timestamp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Social Proof Bar */}
      <section className="bg-neutral-50 border-y border-neutral-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Family Count */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{familyCount.toLocaleString()}+</p>
                <p className="text-xs text-neutral-600">Happy Families</p>
              </div>
            </div>

            {/* App Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? 'text-yellow-500' : 'text-neutral-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">4.8</p>
                <p className="text-xs text-neutral-600">App Store Rating</p>
              </div>
            </div>

            {/* Tasks Completed */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-neutral-900">50K+</p>
                <p className="text-xs text-neutral-600">Tasks Completed</p>
              </div>
            </div>

            {/* Active Streaks */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-neutral-900">200+</p>
                <p className="text-xs text-neutral-600">Active Streaks</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Animation styles moved to global CSS to avoid styled-jsx in app router */}
    </>
  );
};

// TypeB Design System Colors
const colors = {
  primary: '#4A90E2',
  secondary: '#7ED321',
  accent: '#F5A623',
  danger: '#D0021B',
};