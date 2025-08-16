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
      description: 'Create age-appropriate tasks that grow with your children. Set schedules, priorities, and watch as responsibilities become habits.',
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'reward-system',
      title: 'Motivating Rewards',
      description: 'Points, badges, and real rewards that children can work towards. Transform chores into achievements worth celebrating.',
      color: 'accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      id: 'family-bonding',
      title: 'Family Bonding Activities',
      description: 'Discover weekly challenges and activities designed to bring families closer together through shared experiences.',
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'progress-tracking',
      title: 'Insightful Analytics',
      description: 'Track progress, identify patterns, and celebrate milestones. See how your family grows stronger together.',
      color: 'secondary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'smart-reminders',
      title: 'Intelligent Reminders',
      description: 'Never miss a task with smart notifications that adapt to your family schedule and preferences.',
      color: 'accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  const getColorClasses = (color: Feature['color']) => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-primary bg-opacity-10',
          text: 'text-primary',
        };
      case 'secondary':
        return {
          bg: 'bg-secondary bg-opacity-10',
          text: 'text-secondary',
        };
      case 'accent':
        return {
          bg: 'bg-accent bg-opacity-10',
          text: 'text-accent',
        };
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything Your Family Needs to Succeed
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Powerful features designed to make family task management enjoyable and effective
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const colors = getColorClasses(feature.color);
              return (
                <div
                  key={feature.id}
                  className="group hover:shadow-lg transition-shadow duration-300 rounded-xl p-6 border border-neutral-100"
                >
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={colors.text}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-lg text-neutral-700 mb-6">
              Ready to transform your family's daily routine?
            </p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-lg hover:shadow-xl"
              data-analytics="features-cta"
            >
              Start Your Free Trial
            </a>
          </div>
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