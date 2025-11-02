'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface EmailLead {
  email: string;
  timestamp: string;
  source: 'exit_intent' | 'timed_trigger' | 'manual';
  leadMagnet: string;
}

/**
 * EmailCaptureModal Component
 * 
 * Modal for capturing email leads with exit intent and timed triggers.
 * Offers a "Family Setup Guide" as a lead magnet and stores leads in Firestore.
 * 
 * Features:
 * - Exit intent detection
 * - Timed trigger after 30 seconds
 * - Email validation
 * - Firestore integration for lead storage
 * - Analytics tracking
 */
export const EmailCaptureModal: React.FC = () => {
  const isEmailCaptureEnabled = useFeatureFlag('enableEmailCaptureModal');
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [triggerSource, setTriggerSource] = useState<'exit_intent' | 'timed_trigger' | 'manual'>('manual');

  // Check if modal has been dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('emailModalDismissed');
    const captured = localStorage.getItem('emailCaptured');
    if (dismissed || captured) {
      setHasBeenShown(true);
    }
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (!isEmailCaptureEnabled || hasBeenShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasBeenShown) {
        setTriggerSource('exit_intent');
        setIsOpen(true);
        setHasBeenShown(true);
        
        // Track exit intent trigger
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'email_modal_trigger', {
            event_category: 'engagement',
            event_label: 'exit_intent',
          });
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isEmailCaptureEnabled, hasBeenShown]);

  // Timed trigger after 30 seconds
  useEffect(() => {
    if (!isEmailCaptureEnabled || hasBeenShown) return;

    const timer = setTimeout(() => {
      if (!hasBeenShown) {
        setTriggerSource('timed_trigger');
        setIsOpen(true);
        setHasBeenShown(true);
        
        // Track timed trigger
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'email_modal_trigger', {
            event_category: 'engagement',
            event_label: 'timed_30s',
          });
        }
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isEmailCaptureEnabled, hasBeenShown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store lead in Firestore (or send to email service)
      const lead: EmailLead = {
        email,
        timestamp: new Date().toISOString(),
        source: triggerSource,
        leadMagnet: 'Family Setup Guide',
      };

      // In production, this would be an API call to store in Firestore
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        throw new Error('Failed to submit email');
      }

      // Mark as captured
      localStorage.setItem('emailCaptured', 'true');
      
      // Track successful capture
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_capture_success', {
          event_category: 'conversion',
          event_label: triggerSource,
          value: 1,
        });
      }

      // Send lead magnet email (would be handled by backend)
      setIsSuccess(true);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      console.error('Error capturing email:', err);
      setError('Something went wrong. Please try again.');
      
      // Track error
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_capture_error', {
          event_category: 'error',
          event_label: 'submission_failed',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('emailModalDismissed', 'true');
    
    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'email_modal_dismissed', {
        event_category: 'engagement',
        event_label: triggerSource,
      });
    }
  };

  if (!isEmailCaptureEnabled || !isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!isSuccess ? (
            <>
              {/* Icon */}
              <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-neutral-900 text-center mb-3">
                Get Your Free Family Setup Guide
              </h2>
              <p className="text-neutral-600 text-center mb-6">
                Learn the proven strategies that successful families use to build responsibility and strengthen bonds. 
                Our comprehensive guide includes:
              </p>

              {/* Benefits List */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-700">Age-appropriate task templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-700">Reward system best practices</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-700">Communication tips for parents</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-neutral-700">30-day family challenge calendar</span>
                </li>
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                  {error && (
                    <p className="text-danger text-sm mt-1">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Get Free Guide'}
                </button>
              </form>

              {/* Privacy Note */}
              <p className="text-xs text-neutral-500 text-center mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Check Your Email!
              </h3>
              <p className="text-neutral-600">
                We've sent your Family Setup Guide to <strong>{email}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Colors are defined in globals.css tokens