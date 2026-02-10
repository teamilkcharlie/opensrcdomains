'use client';

import { TunnelNavigation } from '@/components/TunnelNavigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Turnstile } from '@marsidev/react-turnstile';
import { submitRewardsForm } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function RewardsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [agreed, setAgreed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    const formData = new FormData(formRef.current!);
    formData.set('agreed', agreed.toString());
    formData.set('turnstileToken', turnstileToken);

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
      setTurnstileToken('');
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
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        {/* Hero section */}
        <div ref={heroRef} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Claim Rewards
          </h1>
          <div className="w-16 h-1 bg-black dark:bg-white rounded-full" />
        </div>

        {/* Success Message */}
        {submitResult?.success && (
          <div className="mb-8 p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50">
            <p className="text-green-800 dark:text-green-200 font-medium">
              {submitResult.message}
            </p>
          </div>
        )}

        {/* Error Message */}
        {submitResult && !submitResult.success && (
          <div className="mb-8 p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
            <p className="text-red-800 dark:text-red-200 font-medium">
              {submitResult.message}
            </p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-10">
          {/* Domain Information */}
          <div className="form-section space-y-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Domain Information
            </h2>

            <div className="space-y-2">
              <Label htmlFor="domainId">
                Domain ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="domainId"
                name="domainId"
                placeholder="Enter your domain ID"
                required
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Short Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Briefly describe the location you scanned (e.g., 'Modern office space with open floor plan')"
                maxLength={500}
                required
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20 min-h-[100px]"
              />
              <p className="text-xs text-black/50 dark:text-white/50">Max 500 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Input
                id="city"
                name="city"
                placeholder="e.g., San Francisco, CA"
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>
          </div>

          {/* Wallet Information */}
          <div className="form-section space-y-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Wallet Information
            </h2>

            {/* Warning callout */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                Important: Please double-check your wallet address
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Rewards will be sent on the <strong>Base Network</strong>. Ensure you are providing a valid
                EVM-compatible wallet address that you control. We cannot recover funds sent to an incorrect address.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletAddress">
                Wallet Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="walletAddress"
                name="walletAddress"
                placeholder="0x..."
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Please enter a valid Ethereum wallet address (0x followed by 40 hex characters)"
                required
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20 font-mono text-sm"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section space-y-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Contact Information
            </h2>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                required
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord">Discord (optional)</Label>
              <Input
                id="discord"
                name="discord"
                placeholder="username#0000 or username"
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter (optional)</Label>
              <Input
                id="twitter"
                name="twitter"
                placeholder="@username"
                className="bg-white dark:bg-white/5 border-black/20 dark:border-white/20"
              />
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="form-section space-y-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Terms & Agreement
            </h2>

            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreed"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked)}
                  required
                  className="mt-1"
                />
                <Label htmlFor="agreed" className="text-sm leading-relaxed cursor-pointer">
                  I confirm that I have the legal right to scan and share this location data.
                  I agree to contribute my domain data to the open-source dataset, and I understand
                  that my data may be used for research, robotics development, and other open-source
                  purposes. <span className="text-red-500">*</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Turnstile Captcha */}
          <div className="form-section">
            {mounted ? (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => {
                  console.log('Turnstile success, token received');
                  setTurnstileToken(token);
                }}
                onError={(error) => {
                  console.error('Turnstile error:', error);
                  setTurnstileToken('');
                }}
                onExpire={() => {
                  console.log('Turnstile expired');
                  setTurnstileToken('');
                }}
                options={{
                  theme: 'auto',
                }}
              />
            ) : (
              <div className="h-[65px] bg-black/5 dark:bg-white/5 rounded animate-pulse" />
            )}
            {/* Debug info - remove in production */}
            <p className="text-xs text-black/40 dark:text-white/40 mt-2">
              Debug: Mounted={mounted ? 'yes' : 'no'}, Checkbox={agreed ? 'checked' : 'unchecked'}, Captcha={turnstileToken ? 'valid' : 'pending'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="form-section pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !agreed} // TODO: Re-enable turnstile: || !turnstileToken
              className="w-full py-6 text-base font-medium rounded-xl bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </form>
      </main>
    </div>
  );
}
