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
    <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            {isNewHeroEnabled 
              ? "Turn Chores into Adventures"
              : "Family Task Management Made Simple"}
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            {isNewHeroEnabled
              ? "Transform everyday tasks into exciting family challenges. Build responsibility, earn rewards, and strengthen family bonds."
              : "The smart way for families to manage tasks, build habits, and grow together."}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-lg hover:shadow-xl"
              data-analytics="hero-cta-start-trial"
            >
              Start Free Trial
            </Link>
            <button
              onClick={() => {
                const demoSection = document.getElementById('demo-video');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white border-2 border-primary rounded-lg hover:bg-neutral-50 transition-colors duration-200"
              data-analytics="hero-cta-watch-demo"
            >
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>500+ Happy Families</span>
            </div>
          </div>

          {/* Security Badges */}
          <div className="mt-8 flex items-center justify-center gap-8 opacity-60">
            <img 
              src="/images/badges/ssl-secured.svg" 
              alt="SSL Secured" 
              className="h-10"
              loading="lazy"
            />
            <img 
              src="/images/badges/gdpr-compliant.svg" 
              alt="GDPR Compliant" 
              className="h-10"
              loading="lazy"
            />
            <img 
              src="/images/badges/coppa-compliant.svg" 
              alt="COPPA Compliant" 
              className="h-10"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary opacity-5 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

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