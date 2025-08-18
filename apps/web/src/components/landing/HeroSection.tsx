'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * HeroSection Component
 * 
 * Main hero section for the landing page featuring the primary value proposition
 * and call-to-action buttons. Implements A/B testing through feature flags.
 * 
 * Features:
 * - Dynamic content based on feature flags
 * - Responsive design for all screen sizes
 * - TypeB brand colors with purple/pink gradient theme
 * - Trust indicators and security badges
 */
export const HeroSection: React.FC = () => {
  const isNewHeroEnabled = useFeatureFlag('enableNewHeroSection');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* TypeB Logo Badge */}
            <div className="inline-flex items-center mb-6">
              <img 
                src="/type_b_logo.png" 
                alt="TypeB Logo" 
                className="w-12 h-12 mr-3"
              />
              <div className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Trusted by 500+ Families
              </div>
            </div>
            
            {/* Main Headline with Purple Gradient */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {isNewHeroEnabled
                ? <>Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600">Accountability</span></>
                : <>Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600">Peace of Mind</span></>}
            </h1>
            
            {/* Tagline with TypeB Style */}
            <p className="text-lg sm:text-xl text-purple-700 mb-4 font-medium italic">
              More than checking the box
            </p>
            
            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 leading-relaxed">
              {isNewHeroEnabled
                ? "Know your kids are doing what they should. Track responsibilities, verify completion, and build trust through accountability."
                : "Finally relax knowing chores are getting done. Get notifications, photo proof, and real-time updates on your family's tasks."}
            </p>

            {/* CTA Buttons with Purple/Pink Gradient */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                data-analytics="hero-cta-start-trial"
              >
                Start Free Trial
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                onClick={() => {
                  const demoSection = document.getElementById('demo-video');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-700 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-md hover:shadow-lg"
                data-analytics="hero-cta-watch-demo"
              >
                <svg className="mr-2 w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators with Purple Accents */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Safe & family-friendly</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium">Join 500+ families</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative lg:block">
            <div className="relative">
              {/* Hero Image - Using the new provided image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-200 to-pink-200 p-1">
                <div className="relative rounded-xl overflow-hidden bg-white">
                  <img
                    src="/hero-image.jpg"
                    alt="Parent using TypeB app on smartphone"
                    className="w-full h-auto object-cover rounded-xl"
                    style={{ maxHeight: '600px' }}
                  />
                  
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 via-transparent to-transparent"></div>
                  
                  {/* Floating UI elements with TypeB brand colors */}
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Daily Habit</div>
                        <div className="text-sm font-bold text-gray-900">Room Cleaned!</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Accountability tracking with gradient */}
                  <div className="absolute top-6 right-6 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 text-white rounded-xl p-4 shadow-lg">
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-xs">Task Completion</div>
                  </div>
                  
                  {/* Progress indicator with TypeB colors */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span className="font-medium text-purple-700">Weekly Progress</span>
                      <span className="font-bold text-pink-600">85%</span>
                    </div>
                    <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full transition-all duration-500 animate-progress" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  {/* Achievement badge */}
                  <div className="absolute bottom-24 right-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-3 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-xs font-medium">Super Parent!</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 85%;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-progress {
          animation: progress 2s ease-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
};

// TypeB Design System Colors (Updated to match logo)
export const colors = {
  primary: {
    purple: '#8B5CF6',     // Main Purple
    pink: '#EC4899',       // Main Pink
    indigo: '#6366F1',     // Accent Indigo
  },
  gradients: {
    main: 'from-purple-600 via-pink-600 to-indigo-600',
    light: 'from-purple-100 via-pink-100 to-indigo-100',
    dark: 'from-purple-700 via-pink-700 to-indigo-700',
  },
  success: '#10B981',      // Green for success states
  warning: '#F59E0B',      // Amber for warnings
  danger: '#EF4444',       // Red for errors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};