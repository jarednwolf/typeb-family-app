'use client';

import React from 'react';
import Link from 'next/link';
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
 * - TypeB brand colors and typography
 * - Trust indicators and security badges
 */
export const HeroSection: React.FC = () => {
  const isNewHeroEnabled = useFeatureFlag('enableNewHeroSection');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Trusted by 500+ Families
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {isNewHeroEnabled 
                ? <>Turn Chores into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Adventures</span></>
                : <>Family Tasks Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Simple</span></>}
            </h1>
            
            {/* Tagline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-4 font-medium italic">
              More than checking the box
            </p>
            
            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 leading-relaxed">
              {isNewHeroEnabled
                ? "Transform everyday tasks into exciting family challenges. Build responsibility, earn rewards, and strengthen bonds together."
                : "The smart way for families to manage tasks, build habits, and grow together."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
                data-analytics="hero-cta-watch-demo"
              >
                <svg className="mr-2 w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Bank-level security</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium">Join 500+ families</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative lg:block">
            <div className="relative">
              {/* Hero Image with Unsplash open-source image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=2070&auto=format&fit=crop"
                  alt="Happy family using technology together"
                  className="w-full h-auto object-cover rounded-2xl"
                />
                
                {/* Overlay gradient for better contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                
                {/* Floating UI elements on top of image */}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Task Completed</div>
                      <div className="text-sm font-bold text-gray-900">Clean Room</div>
                    </div>
                  </div>
                </div>
                
                {/* Points earned badge */}
                <div className="absolute top-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl p-4 shadow-lg">
                  <div className="text-2xl font-bold">+50</div>
                  <div className="text-xs">Points Earned!</div>
                </div>
                
                {/* Progress indicator */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Weekly Progress</span>
                    <span className="font-bold text-green-600">75%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                {/* Achievement notification */}
                <div className="absolute bottom-24 right-6 bg-purple-600 text-white rounded-lg p-3 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-xs font-medium">New Achievement!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Add animation styles
const styles = `
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
  
  .animate-blob {
    animation: blob 7s infinite;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
`;

// TypeB Design System Colors (for reference)
const colors = {
  primary: '#4A90E2',      // Trustworthy Blue
  secondary: '#7ED321',    // Success Green
  accent: '#F5A623',       // Reward Gold
  danger: '#D0021B',       // Alert Red
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