import { User, Task, Family } from '@typeb/types';
import { validateEmail, formatDate } from '@typeb/core';

export default function Home() {
  // Test that we can use types from @typeb/types
  const testUser: Partial<User> = {
    email: 'test@typebapp.com',
    displayName: 'Test User',
  };

  // Test that we can use validators from @typeb/core
  const emailValidation = validateEmail('test@typebapp.com');
  const currentDate = formatDate(new Date(), 'MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to TypeB
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The family task management app that helps Type B personalities build better habits
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition"
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Task Management</h3>
              <p className="text-gray-600">
                Create, assign, and track tasks for your entire family with ease.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Reminders</h3>
              <p className="text-gray-600">
                Intelligent reminder system that adapts to your family's schedule.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">
                Visualize your family's productivity with detailed analytics.
              </p>
            </div>
          </div>

          {/* Integration Test Info */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-3">🎉 Monorepo Integration Success!</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">✅ @typeb/types:</span> Successfully imported User, Task, and Family types
              </p>
              <p className="text-gray-600">
                <span className="font-medium">✅ @typeb/core:</span> Email validation result: {emailValidation.isValid ? 'Valid' : 'Invalid'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">✅ Date formatting:</span> Today is {currentDate}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
