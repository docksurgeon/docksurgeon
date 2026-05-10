"use client";

import { useState, useEffect } from "react";
import { 
  RocketIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1 bg-white/5 w-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <RocketIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to DockSurgeon</h1>
              <p className="text-gray-400 text-lg">
                Let's get your production environment ready. This will only take a minute.
              </p>
              <button 
                onClick={handleNext}
                className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                Start Onboarding <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-8 w-8 text-purple-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Connect Your Domain</h1>
              <p className="text-gray-400">
                Enter the domain where you want your SaaS to live. We'll handle the SSL for you.
              </p>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="app.yourdomain.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 transition"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 shrink-0" />
                  <p className="text-sm text-yellow-500/90">
                    Make sure to point your DNS A Record to your server IP before continuing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 py-4 rounded-xl hover:bg-white/10 transition"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] bg-blue-500 py-4 rounded-xl font-semibold hover:bg-blue-600 transition"
                >
                  Secure Domain
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">You're Ready!</h1>
              <p className="text-gray-400">
                Your SaaS is now secured with SSL and optimized for production. 
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Public URL</span>
                  <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                    <ShieldCheckIcon className="h-4 w-4" /> Secure
                  </span>
                </div>
                <div className="text-xl font-mono text-blue-400">https://{domain || 'your-domain.com'}</div>
              </div>

              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
