'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface VideoAnalytics {
  plays: number;
  pauses: number;
  completions: number;
  watchTime: number;
}

/**
 * DemoVideo Component
 * 
 * Displays a product demo video with engagement tracking and lazy loading.
 * Tracks user interactions for analytics and conversion optimization.
 * 
 * Features:
 * - Lazy loading for performance
 * - Play button overlay with TypeB branding
 * - Comprehensive analytics tracking
 * - Responsive video player
 */
export const DemoVideo: React.FC = () => {
  const isDemoVideoEnabled = useFeatureFlag('enableDemoVideo');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [analytics, setAnalytics] = useState<VideoAnalytics>({
    plays: 0,
    pauses: 0,
    completions: 0,
    watchTime: 0,
  });

  // Track video events
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let watchStartTime: number | null = null;

    const handlePlay = () => {
      setIsPlaying(true);
      watchStartTime = Date.now();
      setAnalytics(prev => ({ ...prev, plays: prev.plays + 1 }));
      
      // Send analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'video_play', {
          event_category: 'engagement',
          event_label: 'demo_video',
          value: analytics.plays + 1,
        });
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (watchStartTime) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        setAnalytics(prev => ({ 
          ...prev, 
          pauses: prev.pauses + 1,
          watchTime: prev.watchTime + watchDuration 
        }));
        watchStartTime = null;
      }

      // Send analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'video_pause', {
          event_category: 'engagement',
          event_label: 'demo_video',
          value: analytics.watchTime,
        });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (watchStartTime) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        setAnalytics(prev => ({ 
          ...prev, 
          completions: prev.completions + 1,
          watchTime: prev.watchTime + watchDuration 
        }));
        watchStartTime = null;
      }

      // Send analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'video_complete', {
          event_category: 'engagement',
          event_label: 'demo_video',
          value: 1,
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [analytics]);

  // Lazy load video when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsLoaded(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('demo-video');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [isLoaded]);

  if (!isDemoVideoEnabled) {
    return null;
  }

  const handlePlayClick = () => {
    setShowVideo(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  return (
    <section id="demo-video" className="py-16 sm:py-24 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              See TypeB in Action
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Watch how families are transforming their daily routines into exciting adventures
            </p>
          </div>

          {/* Video Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-neutral-900">
            {!showVideo ? (
              // Thumbnail with Play Button Overlay
              <div className="relative aspect-video cursor-pointer group" onClick={handlePlayClick}>
                <img
                  src="/images/video-thumbnail.jpg"
                  alt="TypeB Demo Video Thumbnail"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300">
                  <button
                    className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300"
                    aria-label="Play demo video"
                  >
                    <svg
                      className="w-8 h-8 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </button>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                  2:00
                </div>
              </div>
            ) : (
              // Video Player
              <div className="relative aspect-video">
                {isLoaded && (
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    playsInline
                    poster="/images/video-thumbnail.jpg"
                  >
                    <source src="/videos/typeb-demo.mp4" type="video/mp4" />
                    <source src="/videos/typeb-demo.webm" type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>

          {/* Video Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Quick Setup</h3>
              <p className="text-sm text-neutral-600">Get your family started in under 5 minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Fun for Kids</h3>
              <p className="text-sm text-neutral-600">Engaging interface that children love to use</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Reward System</h3>
              <p className="text-sm text-neutral-600">Motivate with points and achievements</p>
            </div>
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