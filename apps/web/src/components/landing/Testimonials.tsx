'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface Testimonial {
  id: string;
  name: string;
  role: 'parent' | 'child';
  age?: number;
  location: string;
  avatar: string;
  content: string;
  rating: number;
  highlight?: string;
}

/**
 * Testimonials Component
 * 
 * Displays customer testimonials with carousel functionality for mobile.
 * Includes both parent testimonials and child achievement stories.
 * Implements schema.org markup for SEO benefits.
 * 
 * Features:
 * - Responsive carousel for mobile devices
 * - Schema.org structured data
 * - Parent and child testimonials
 * - Star ratings display
 */
export const Testimonials: React.FC = () => {
  const isTestimonialsEnabled = useFeatureFlag('enableTestimonials');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'parent',
      location: 'Austin, TX',
      avatar: '/images/testimonials/sarah.jpg',
      content: 'TypeB has transformed our family dynamics. My kids actually compete to do their chores now! The reward system keeps them motivated, and I love seeing their progress through the analytics dashboard.',
      rating: 5,
      highlight: 'Kids compete to do chores!'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'parent',
      location: 'Seattle, WA',
      avatar: '/images/testimonials/michael.jpg',
      content: 'As a busy parent, TypeB helps me stay organized and ensures nothing falls through the cracks. The smart reminders are a game-changer, and my children love earning points for their achievements.',
      rating: 5,
      highlight: 'Smart reminders are a game-changer'
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      role: 'parent',
      location: 'Miami, FL',
      avatar: '/images/testimonials/emma.jpg',
      content: 'The photo validation feature gives me peace of mind that tasks are actually completed. My teenagers are more responsible, and we spend less time arguing about chores. Worth every penny!',
      rating: 5,
      highlight: 'Less arguing, more harmony'
    },
    {
      id: '4',
      name: 'Lily Thompson',
      role: 'child',
      age: 12,
      location: 'Denver, CO',
      avatar: '/images/testimonials/lily.jpg',
      content: 'I love earning points and unlocking new achievements! TypeB makes helping around the house feel like a fun game. I even saved enough points to get the new video game I wanted!',
      rating: 5,
      highlight: 'Earned a video game with points!'
    },
    {
      id: '5',
      name: 'David Williams',
      role: 'parent',
      location: 'Chicago, IL',
      avatar: '/images/testimonials/david.jpg',
      content: 'TypeB has taught my children valuable life skills about responsibility and time management. The family bonding activities suggested by the app have brought us closer together.',
      rating: 5,
      highlight: 'Valuable life skills'
    }
  ];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isMobile, testimonials.length]);

  if (!isTestimonialsEnabled) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-accent' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col"
      itemScope
      itemType="https://schema.org/Review"
    >
      {/* Rating */}
      <div className="flex items-center mb-4" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
        {renderStars(testimonial.rating)}
        <meta itemProp="ratingValue" content={testimonial.rating.toString()} />
        <meta itemProp="bestRating" content="5" />
      </div>

      {/* Content */}
      <blockquote className="flex-grow mb-6">
        <p className="text-neutral-700 italic" itemProp="reviewBody">
          "{testimonial.content}"
        </p>
        {testimonial.highlight && (
          <p className="mt-3 text-primary font-semibold">
            — {testimonial.highlight}
          </p>
        )}
      </blockquote>

      {/* Author */}
      <div className="flex items-center" itemProp="author" itemScope itemType="https://schema.org/Person">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
          loading="lazy"
        />
        <div>
          <p className="font-semibold text-neutral-900" itemProp="name">
            {testimonial.name}
          </p>
          <p className="text-sm text-neutral-600">
            {testimonial.role === 'parent' ? 'Parent' : `Student, ${testimonial.age} years old`}
          </p>
          <p className="text-sm text-neutral-500" itemProp="address">
            {testimonial.location}
          </p>
        </div>
      </div>

      {/* Hidden schema.org data */}
      <meta itemProp="itemReviewed" content="TypeB Family App" />
      <meta itemProp="datePublished" content={new Date().toISOString()} />
    </div>
  );

  return (
    <section className="py-16 sm:py-24 bg-white" itemScope itemType="https://schema.org/Product">
      <meta itemProp="name" content="TypeB Family App" />
      <meta itemProp="description" content="Family task management app that turns chores into adventures" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Families Love TypeB
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Join over 500 families who have transformed their daily routines
            </p>
          </div>

          {/* Desktop Grid / Mobile Carousel */}
          {isMobile ? (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-2 hover:bg-neutral-50"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-2 hover:bg-neutral-50"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-neutral-300'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          )}

          {/* Achievement Stories */}
          <div className="mt-12 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Child Achievement Spotlight</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-lg font-semibold mb-2">Lily's Success Story</p>
                <p className="text-white/90">
                  12-year-old Lily earned enough points in just 3 months to get her dream video game. 
                  She completed over 200 tasks and maintained a perfect streak for 30 days!
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">The Numbers</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">200+</p>
                    <p className="text-sm text-white/80">Tasks Completed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">30</p>
                    <p className="text-sm text-white/80">Day Streak</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">2,500</p>
                    <p className="text-sm text-white/80">Points Earned</p>
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

// Colors are defined in globals.css tokens