'use client';

import React from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent';
}

/**
 * FeatureGrid Component
 * 
 * Displays a grid of product features with icons and descriptions.
 * Emphasizes family bonding and positive reinforcement aspects.
 * 
 * Features:
 * - Responsive grid layout
 * - TypeB brand colors
 * - Accessible design
 */
export const FeatureGrid: React.FC = () => {
  const features: Feature[] = [
    {
      id: 'task-management',
      title: 'Smart Task Management',
      description: 'Create age-appropriate responsibilities that grow with your children. Set schedules, priorities, and watch as daily tasks become lifelong habits.',
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'accountability-tracking',
      title: 'Accountability System',
      description: 'Track completion rates and build consistency. Help your children develop personal responsibility through clear expectations and follow-through.',
      color: 'accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'photo-validation',
      title: 'Photo Validation',
      description: 'Children snap photos of completed tasks for parent approval. Build trust while ensuring tasks are done right.',
      color: 'secondary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'habit-building',
      title: 'Habit Development',
      description: 'Build lasting routines through daily practice and consistency tracking. Watch as one-time tasks evolve into automatic behaviors.',
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'progress-tracking',
      title: 'Progress Monitoring',
      description: 'Track completion rates, identify areas for improvement, and celebrate consistency. Watch your children develop stronger work ethic over time.',
      color: 'secondary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'smart-reminders',
      title: 'Smart Scheduling',
      description: 'Set up recurring tasks and reminders that fit your family\'s routine. Ensure nothing falls through the cracks with timely notifications.',
      color: 'accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  const getColorClasses = (_color: Feature['color']) => {
    // Standardize icon backgrounds to a single neutral tone with black icons
    return { bg: 'bg-neutral-100', text: 'text-black' };
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Get Complete{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Peace of Mind
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Know exactly what's getting done in your home with real-time tracking, photo verification, and instant accountability
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {features.map((feature, index) => {
              const colors = getColorClasses(feature.color);
              return (
                <div
                  key={feature.id}
                  className="group relative bg-white rounded-2xl p-7 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-1 h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon with enhanced styling */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4 ring-1 ring-neutral-200 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <div className={`${colors.text} transform group-hover:rotate-3 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                    </div>
                    
                    {/* Title with better typography */}
                    <h3 className="text-[20px] sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description with improved readability */}
                    <p className="text-gray-600 leading-relaxed text-[15px] sm:text-base">
                      {feature.description}
                    </p>
                    
                    {/* Hover CTA removed until destination links are available */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA section removed until demo is available and redundant CTAs are reduced */}
        </div>
      </div>
    </section>
  );
};

// TypeB Design System Colors
const colors = {
  primary: '#4A90E2',
  secondary: '#7ED321',
  accent: '#F5A623',
};