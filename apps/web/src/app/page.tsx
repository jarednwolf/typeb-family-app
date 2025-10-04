'use client';

import React, { useEffect } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { DemoVideo } from '@/components/landing/DemoVideo';
import { Testimonials } from '@/components/landing/Testimonials';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { SocialProof } from '@/components/landing/SocialProof';
import { AppScreenshots } from '@/components/landing/AppScreenshots';
import { EmailCaptureModal } from '@/components/modals/EmailCaptureModal';
import { useConversionTracking } from '@/hooks/useConversionTracking';

/**
 * Landing Page Component
 * 
 * Main landing page for TypeB Family App with comprehensive conversion optimization.
 * Implements all Phase 1 requirements including hero section, demo video, testimonials,
 * email capture, social proof, and analytics tracking.
 * 
 * Features:
 * - A/B testing through feature flags
 * - Comprehensive analytics tracking
 * - SEO optimization
 * - Responsive design
 * - Performance optimizations
 */
export default function LandingPage() {
  const { trackCTAClick } = useConversionTracking();

  // Track CTA clicks
  useEffect(() => {
    const handleCTAClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const ctaElement = target.closest('[data-analytics]');
      
      if (ctaElement) {
        const ctaName = ctaElement.getAttribute('data-analytics');
        if (ctaName) {
          trackCTAClick(ctaName, 'landing_page');
        }
      }
    };

    document.addEventListener('click', handleCTAClick);
    return () => document.removeEventListener('click', handleCTAClick);
  }, [trackCTAClick]);

  return (
    <>
      {/* Main Content */}
      <main className="min-h-screen section-y">
        {/* Hero Section */}
        <HeroSection />

        {/* Social Proof Bar */}
        <div className="mt-4 sm:mt-6">
          <SocialProof />
        </div>

        {/* Features Grid - Moved up for better flow */}
        <FeatureGrid />

        {/* Demo Video */}
        <DemoVideo />

        {/* App Screenshots - New section showing actual interface */}
        <AppScreenshots />

        {/* Testimonials */}
        <Testimonials />

        {/* Footer CTA Section with Minimal Design */}
        <section className="py-16 sm:py-24" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-normal text-white mb-4">
                Ready to Transform Your Family's Daily Routine?
              </h2>
              <p className="text-xl text-white/80 mb-8">
                Join hundreds of families who are building responsibility and strengthening bonds through TypeB
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  data-analytics="footer-cta-start-trial"
                  style={{ color: '#0A0A0A' }}
                >
                  Start Your Free Trial
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border border-white rounded-lg hover:bg-white/10 transition-colors duration-200"
                  data-analytics="footer-cta-login"
                >
                  Sign In
                </a>
              </div>
              <p className="mt-6 text-sm text-white/60">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-neutral-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Company */}
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="/press" className="hover:text-white transition-colors">Press</a></li>
                </ul>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/demo" className="hover:text-white transition-colors">Demo</a></li>
                  <li><a href="/updates" className="hover:text-white transition-colors">Updates</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="/status" className="hover:text-white transition-colors">System Status</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                  <li><a href="/coppa" className="hover:text-white transition-colors">COPPA Compliance</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-neutral-400">
                © 2024 TypeB Family App. All rights reserved.
              </p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="https://twitter.com/typebapp" className="text-neutral-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/typebapp" className="text-neutral-400 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/typebapp" className="text-neutral-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Email Capture Modal */}
      <EmailCaptureModal />
    </>
  );
}

// TypeB Design System Colors (Matching Mobile App)
const colors = {
  primary: '#0A0A0A',    // Premium black
  success: '#34C759',    // Apple green
  info: '#007AFF',       // Apple blue
  warning: '#FF9500',    // Apple amber
  background: '#FAF8F5', // Warm background
};
