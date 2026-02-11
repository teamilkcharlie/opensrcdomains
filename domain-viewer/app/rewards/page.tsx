'use client';

import { TunnelNavigation } from '@/components/TunnelNavigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { submitRewardsForm } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function RewardsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const form = formRef.current;

    if (!hero || !form) return;

    const ctx = gsap.context(() => {
      const heroH1 = hero.querySelector('h1');
      const heroDiv = hero.querySelector('div');

      if (heroH1 && heroDiv) {
        const heroTl = gsap.timeline();
        heroTl
          .fromTo(
            heroH1,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
          )
          .fromTo(
            heroDiv,
            { scaleX: 0, transformOrigin: 'left' },
            { scaleX: 1, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
          );
      }

      // Form sections animation
      const sections = form.querySelectorAll('.form-section');
      if (sections.length) {
        gsap.fromTo(
          sections,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 0.4,
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const validateWallet = (address: string): boolean => {
    if (!address) {
      setWalletError(null);
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setWalletError('Please enter a valid Base wallet address (0x followed by 40 characters)');
      return false;
    }
    setWalletError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(formRef.current!);
    const walletAddress = formData.get('walletAddress')?.toString().trim() || '';

    if (!validateWallet(walletAddress)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    // Get reCAPTCHA v3 token
    let recaptchaToken = '';
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('submit_rewards');
      } catch {
        setIsSubmitting(false);
        setSubmitResult({
          success: false,
          message: 'Failed to verify you are human. Please refresh and try again.',
        });
        return;
      }
    }

    formData.set('agreed', agreed.toString());
    formData.set('recaptchaToken', recaptchaToken);

    const result = await submitRewardsForm(formData);

    setIsSubmitting(false);
    setSubmitResult({
      success: result.success,
      message: result.success
        ? 'Your submission has been received! We will review it and process your reward.'
        : result.error || 'Something went wrong. Please try again.',
    });

    if (result.success) {
      formRef.current?.reset();
      setAgreed(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white relative">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Fade overlay at top and bottom */}
      <div className="fixed inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-white to-transparent dark:from-[#050505]" />
      <div className="fixed inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-white to-transparent dark:from-[#050505]" />

      <TunnelNavigation />

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Hero section */}
        <div ref={heroRef} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Claim Rewards
          </h1>
          <div className="w-16 h-1 bg-black dark:bg-white rounded-full" />
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Domain Information */}
          <div className="form-section">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs">1</span>
                Domain Information
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="domainId" className="text-black/70 dark:text-white/70">
                  Domain ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="domainId"
                  name="domainId"
                  placeholder="e.g., 8093f9bf-c374-4162-ab74-ab61949627f1"
                  required
                  className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-black/70 dark:text-white/70">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Briefly describe the location you scanned (e.g., 'Modern office space with open floor plan')"
                  maxLength={500}
                  required
                  className="bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl min-h-[100px] focus:border-black/30 dark:focus:border-white/30"
                />
                <p className="text-xs text-black/40 dark:text-white/40">Max 500 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-black/70 dark:text-white/70">City (optional)</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="e.g., San Francisco, CA"
                  className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="form-section">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs">2</span>
                Wallet Information
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="walletAddress" className="text-black/70 dark:text-white/70">
                  Base Network Wallet Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="walletAddress"
                  name="walletAddress"
                  placeholder="0x..."
                  required
                  onChange={(e) => {
                    if (walletError) validateWallet(e.target.value);
                  }}
                  onBlur={(e) => validateWallet(e.target.value)}
                  className={`h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl font-mono text-sm focus:border-black/30 dark:focus:border-white/30 ${
                    walletError ? 'border-red-500 dark:border-red-500' : ''
                  }`}
                />
                {walletError && (
                  <p className="text-sm text-red-500 mt-1">{walletError}</p>
                )}
              </div>

              {/* Wallet disclaimer - below input */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Rewards are sent on the Base Network
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Double-check your wallet address. We cannot recover funds sent to an incorrect address. Your wallet must support the Base network (any EVM-compatible wallet works).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs">3</span>
                Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-black/70 dark:text-white/70">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                    className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-black/70 dark:text-white/70">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discord" className="text-black/70 dark:text-white/70">Discord (optional)</Label>
                  <Input
                    id="discord"
                    name="discord"
                    placeholder="username"
                    className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="twitter" className="text-black/70 dark:text-white/70">X / Twitter (optional)</Label>
                  <Input
                    id="twitter"
                    name="twitter"
                    placeholder="@username"
                    className="h-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Agreement */}
          <div className="form-section">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreed"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked)}
                  required
                  className="mt-0.5"
                />
                <Label htmlFor="agreed" className="text-sm leading-relaxed cursor-pointer text-black/70 dark:text-white/70">
                  I confirm that I have the legal right to scan and share this location data.
                  I agree to contribute my domain data to the open-source dataset, and I understand
                  that my data may be used for research, robotics development, and other open-source
                  purposes. <span className="text-red-500">*</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Result - at bottom near button */}
          {submitResult && (
            <div className={`form-section p-4 rounded-xl border ${
              submitResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
            }`}>
              <p className={`text-sm font-medium ${
                submitResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {submitResult.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-section">
            <Button
              type="submit"
              disabled={isSubmitting || !agreed}
              className="w-full h-14 text-base font-medium rounded-xl bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Claim'
              )}
            </Button>
          </div>

          {/* reCAPTCHA attribution (required by Google ToS) */}
          <p className="text-xs text-center text-black/40 dark:text-white/40">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-black/60 dark:hover:text-white/60">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-black/60 dark:hover:text-white/60">
              Terms of Service
            </a>{' '}
            apply.
          </p>
        </form>
      </main>
    </div>
  );
}
