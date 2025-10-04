'use client';

import React, { useState } from 'react';

interface Screenshot {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  category: 'parent' | 'child';
}

/**
 * AppScreenshots Component
 * 
 * Showcases actual app screenshots to demonstrate the user interface
 * and key features in action.
 */
export const AppScreenshots: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('parent');

  const screenshots: Screenshot[] = [
    {
      id: 'parent-dashboard',
      title: 'Parent Dashboard',
      description: 'Track all family tasks and progress at a glance',
      imagePath: '/images/screenshots/parent-dashboard.png',
      category: 'parent',
    },
    {
      id: 'task-creation',
      title: 'Easy Task Creation',
      description: 'Create age-appropriate tasks in seconds',
      imagePath: '/images/screenshots/task-creation.png',
      category: 'parent',
    },
    {
      id: 'analytics',
      title: 'Insightful Analytics',
      description: 'Monitor progress and celebrate achievements',
      imagePath: '/images/screenshots/analytics.png',
      category: 'parent',
    },
    {
      id: 'child-tasks',
      title: 'Fun Task View',
      description: 'Kids see their tasks in an engaging interface',
      imagePath: '/images/screenshots/child-tasks.png',
      category: 'child',
    },
    {
      id: 'rewards',
      title: 'Exciting Rewards',
      description: 'Earn points and unlock achievements',
      imagePath: '/images/screenshots/rewards.png',
      category: 'child',
    },
    {
      id: 'photo-upload',
      title: 'Photo Validation',
      description: 'Snap a photo to complete tasks',
      imagePath: '/images/screenshots/photo-upload.png',
      category: 'child',
    },
  ];

  const filteredScreenshots = screenshots.filter(s => s.category === activeTab);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              See How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the intuitive interface that makes family task management enjoyable for everyone
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('parent')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'parent'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Parent View
              </button>
              <button
                onClick={() => setActiveTab('child')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'child'
                    ? 'bg-white text-green-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Child View
              </button>
            </div>
          </div>

          {/* Screenshots Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {filteredScreenshots.map((screenshot, index) => (
              <div key={screenshot.id} className="group relative" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="aspect-[9/16] bg-neutral-900 relative">
                    <img
                      src={screenshot.imagePath}
                      alt={screenshot.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{screenshot.title}</h3>
                    <p className="text-gray-600">{screenshot.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-gray-600">Designed for on-the-go families with busy schedules</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kid Friendly</h3>
              <p className="text-gray-600">Intuitive interface that children love to use</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your family data is protected with bank-level security</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};