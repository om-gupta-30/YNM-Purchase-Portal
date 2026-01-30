'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { validatePassword, generateCaptcha, PasswordValidationResult } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'username' | 'reset'>('username');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaAnswer('');
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePassword(newPassword));
    } else {
      setPasswordValidation(null);
    }
  }, [newPassword]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    // Verify captcha
    if (parseInt(captchaAnswer) !== captcha.answer) {
      setError('Incorrect captcha answer. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify username exists
      const response = await fetch('/api/auth/verify-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (data.exists) {
        setStep('reset');
        refreshCaptcha();
      } else {
        setError('Username not found. Please check and try again.');
        refreshCaptcha();
      }
    } catch {
      setError('Failed to verify username. Please try again.');
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Verify captcha
    if (parseInt(captchaAnswer) !== captcha.answer) {
      setError('Incorrect captcha answer. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          newPassword 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
        refreshCaptcha();
      }
    } catch {
      setError('Failed to reset password. Please try again.');
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const RequirementCheck = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-text-muted'}`}>
      {met ? (
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 md:p-8 animate-scaleIn">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/ynm-logo-vertical.jpg"
              alt="YNM Safety"
              width={200}
              height={150}
              className="h-20 w-auto rounded-lg shadow-lg"
              priority
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-text-dark mb-1">
            {step === 'username' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-text-muted text-sm">
            {step === 'username' 
              ? 'Enter your username to reset your password' 
              : 'Create a new secure password'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert alert-success mb-4 animate-fadeIn text-sm py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4 animate-fadeIn text-sm py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === 'username' ? (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-text-dark font-medium mb-1.5 text-sm">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full pl-10 pr-4 py-2.5 text-sm"
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Captcha */}
            <div>
              <label className="block text-text-dark font-medium mb-1.5 text-sm">
                Security Check
              </label>
              <div className="bg-gradient-to-r from-maroon/10 to-gold/10 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-dark font-mono text-lg font-bold">
                    {captcha.question} = ?
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-maroon hover:text-maroon-dark transition-colors p-1"
                    title="Refresh captcha"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="input w-full py-2.5 text-sm text-center"
                placeholder="Enter your answer"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !captchaAnswer}
              className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-sm border-text-dark/30 border-t-text-dark"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-text-dark font-medium mb-1.5 text-sm">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full pl-10 pr-12 py-2.5 text-sm"
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordValidation && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1.5">
                  <RequirementCheck 
                    met={passwordValidation.requirements.minLength} 
                    text="At least 8 characters" 
                  />
                  <RequirementCheck 
                    met={passwordValidation.requirements.hasUppercase} 
                    text="One uppercase letter" 
                  />
                  <RequirementCheck 
                    met={passwordValidation.requirements.hasNumber} 
                    text="One number" 
                  />
                  <RequirementCheck 
                    met={passwordValidation.requirements.hasSpecialChar} 
                    text="One special character" 
                  />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-text-dark font-medium mb-1.5 text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full pl-10 pr-12 py-2.5 text-sm"
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {/* Captcha */}
            <div>
              <label className="block text-text-dark font-medium mb-1.5 text-sm">
                Security Check
              </label>
              <div className="bg-gradient-to-r from-maroon/10 to-gold/10 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-dark font-mono text-lg font-bold">
                    {captcha.question} = ?
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-maroon hover:text-maroon-dark transition-colors p-1"
                    title="Refresh captcha"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="input w-full py-2.5 text-sm text-center"
                placeholder="Enter your answer"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !passwordValidation?.valid || 
                newPassword !== confirmPassword || 
                !captchaAnswer
              }
              className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-sm border-text-dark/30 border-t-text-dark"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('username');
                setNewPassword('');
                setConfirmPassword('');
                refreshCaptcha();
              }}
              className="w-full py-2 text-sm text-text-muted hover:text-text-dark transition-colors"
            >
              ← Back to username
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link 
            href="/login" 
            className="text-maroon hover:text-maroon-dark text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
