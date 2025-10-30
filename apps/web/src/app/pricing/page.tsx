'use client';

import Link from 'next/link';

export default function PricingPage() {
  const portalUrl = process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '/dashboard/settings';

  return (
    <div className="section-y screen-container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Simple pricing for the whole family</h1>
        <p className="text-gray-600 mt-2">One subscription unlocks premium for your entire family group.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Monthly</h2>
          <p className="text-3xl font-bold mt-2">$4.99<span className="text-base font-normal text-gray-500">/mo</span></p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>Advanced analytics</li>
            <li>Priority validation tools</li>
            <li>Family member expansion</li>
          </ul>
          <div className="mt-6">
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Start monthly</a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-black">
          <h2 className="text-xl font-semibold">Annual</h2>
          <p className="text-3xl font-bold mt-2">$39.99<span className="text-base font-normal text-gray-500">/yr</span></p>
          <p className="text-sm text-green-700 mt-1">Save 33% with yearly billing</p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>Everything in Monthly</li>
            <li>Priority support</li>
            <li>Early access to new features</li>
          </ul>
          <div className="mt-6">
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Start annual</a>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-gray-600">
        <p>14‑day free trial. Cancel anytime. Managed by your app store or billing portal.</p>
        <p className="mt-2">Already subscribed? <Link href="/dashboard/settings" className="underline">Manage your subscription</Link></p>
      </div>
    </div>
  );
}


