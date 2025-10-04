'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * HeroSection Component
 * 
 * Main hero section for the landing page featuring the primary value proposition
 * and call-to-action buttons. Matches the mobile app's minimal, premium design.
 * 
 * Features:
 * - Dynamic content based on feature flags
 * - Responsive design for all screen sizes
 * - TypeB minimal design system with premium black
 * - Trust indicators and security badges
 */
export const HeroSection: React.FC = () => {
  const isNewHeroEnabled = useFeatureFlag('enableNewHeroSection');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0A0A0A 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* TypeB Logo Badge with minimal design */}
            <div className="inline-flex items-center mb-6">
              <img 
                src="/type_b_logo.png" 
                alt="TypeB Logo" 
                className="w-12 h-12 mr-3"
              />
              <div className="flex items-center px-4 py-2 rounded-full text-sm font-medium" style={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D1D1',
                color: '#404040'
              }}>
                <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#34C759' }}></span>
                Trusted by 500+ Families
              </div>
            </div>
            
            {/* Main Headline with premium black */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-normal mb-4 sm:mb-6 leading-[1.05] tracking-tight" style={{ color: '#0A0A0A' }}>
              {isNewHeroEnabled
                ? <>Build <span style={{ color: '#007AFF' }}>Accountability</span></>
                : <>Get <span style={{ color: '#007AFF' }}>Peace of Mind</span></>}
            </h1>
            
            {/* Tagline */}
            <p className="text-lg sm:text-xl mb-2 sm:mb-3 italic" style={{ color: '#595959' }}>
              More than checking the box
            </p>
            
            {/* Subheadline */}
            <p className="text-xl sm:text-2xl mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0" style={{ color: '#404040' }}>
              {isNewHeroEnabled
                ? "Know your kids are doing what they should. Track responsibilities, verify completion, and build trust through accountability."
                : "Finally relax knowing chores are getting done. Get notifications, photo proof, and real-time updates on your family's tasks."}
            </p>

            {/* CTA Buttons - refined styling; demo hidden until available */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: '#0A0A0A' }}
                data-analytics="hero-cta-start-trial"
              >
                <span>Start Free Trial</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-medium transition-all duration-200 border shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D1D1', color: '#0A0A0A' }}
                data-analytics="hero-cta-login"
              >
                <span>Sign In</span>
              </Link>
              {/* Demo button hidden until a real video is available */}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2" style={{ color: '#595959' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#34C759' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: '#595959' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#007AFF' }}>
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Safe & family-friendly</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: '#595959' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FF9500' }}>
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium">Join 500+ families</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative lg:block">
            <div className="relative">
              {/* Hero Image Container with proper aspect ratio */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <div className="relative w-full" style={{ paddingBottom: '75%' /* 4:3 Aspect Ratio */ }}>
                  <img
                    src="/hero-image.png"
                    alt="Parent using TypeB app on smartphone"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  
                  {/* Floating UI elements - Hidden on mobile, subtle on desktop */}
                  {/* Daily Habit Card - Top Left */}
                  <div 
                    className="hidden lg:block absolute top-6 left-6 rounded-xl p-3 shadow-sm animate-fade-in" 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" 
                        style={{ backgroundColor: '#34C759' }}
                      >
                        ✓
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#595959' }}>Daily Habit</div>
                        <div className="text-xs font-medium" style={{ color: '#0A0A0A' }}>Room Cleaned!</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Task completion rate - Top Right */}
                  <div 
                    className="hidden lg:block absolute top-6 right-6 text-white rounded-xl p-3 shadow-sm" 
                    style={{ 
                      backgroundColor: 'rgba(0, 122, 255, 0.8)'
                    }}
                  >
                    <div className="text-xl font-medium">92%</div>
                    <div className="text-xs">Task Completion</div>
                  </div>
                  
                  {/* Progress indicator - Bottom */}
                  <div 
                    className="hidden lg:block absolute bottom-6 left-6 right-6 rounded-xl p-3 shadow-sm" 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }}
                  >
                    <div className="flex justify-between text-xs mb-2">
                      <span style={{ color: '#595959' }}>Weekly Progress</span>
                      <span className="font-medium" style={{ color: '#34C759' }}>85%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(229, 229, 229, 0.5)' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: '85%',
                          backgroundColor: '#34C759'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Achievement badge - Bottom Right (Hidden on mobile) */}
                  <div 
                    className="hidden lg:block absolute bottom-20 right-6 text-white rounded-lg p-2 shadow-sm transform rotate-3 hover:rotate-0 transition-transform" 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))'
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🏆</span>
                      <span className="text-xs font-medium">Super Parent!</span>
                    </div>
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

// TypeB Design System Colors (Updated to match mobile app)
export const colors = {
  // Primary colors
  primary: '#0A0A0A',      // Premium black
  success: '#34C759',      // Apple green
  warning: '#FF9500',      // Apple amber
  error: '#FF3B30',        // Apple red
  info: '#007AFF',         // Apple blue
  
  // Backgrounds
  background: '#FAF8F5',   // Warm background
  surface: '#FFFFFF',      // Cards, modals
  backgroundTexture: '#F5F2ED', // Subtle depth
  inputBackground: '#F2F2F7',   // Input fields
  
  // Text colors
  textPrimary: '#0A0A0A',  // Black
  textSecondary: '#404040', // Better contrast
  textTertiary: '#595959',  // WCAG compliant
  
  // UI elements
  separator: '#D1D1D1',
  white: '#FFFFFF',
  black: '#000000',
  
  // Premium
  premium: '#FFD700',       // Gold
};