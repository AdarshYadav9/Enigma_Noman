"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

function formatAuthError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in provider is disabled in your Firebase Console. Please go to Firebase Console -> Authentication -> Sign-in method, and enable Google and/or Email/Password.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain (localhost) is not authorized in Firebase. Go to Firebase Console -> Authentication -> Settings -> Authorized domains, and add localhost.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser or an extension. Please allow popups for localhost or try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing authentication.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Invalid email or password. If you do not have an account yet, click "Create an account" below.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Click "Sign in" below to log in with your password.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network request failed. Please check your internet connection.';
  }
  return msg || 'Authentication failed. Please try again.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  // Check redirect result on mount if redirect auth was used
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push('/');
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
        setError(formatAuthError(err));
      });
  }, [router]);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (user) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsGoogleLoading(true);
      console.log("Initiating Google sign-in with popup...");
      await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in succeeded, redirecting...");
      router.push('/');
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      // If popup is blocked by browser/extension, try redirect fallback
      if (err?.code === 'auth/popup-blocked') {
        try {
          console.log("Popup was blocked, attempting redirect sign-in...");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error("Redirect sign-in error:", redirectErr);
          setError(formatAuthError(redirectErr));
        }
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      setError(null);
      setIsEmailLoading(true);
      console.log(`Attempting email auth (registering: ${isRegistering})...`);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      console.log("Email authentication succeeded, redirecting...");
      router.push('/');
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(formatAuthError(err));
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[#15171A]">
          {isRegistering ? 'Create an account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-[#69707A]">
          Personalized Hidden-Ingredient and Dietary-Risk Alerts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-xl sm:px-10 border border-[#E5E8EC]">
          {/* Prominent error banner */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-red-500">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-60 transition-all"
            >
              {isGoogleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1677FF] border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E8EC]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-[#69707A]">Or use email</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleEmailAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-[#15171A]">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full rounded-md border-0 py-2 px-3 text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] placeholder:text-[#69707A] focus:ring-2 focus:ring-inset focus:ring-[#1677FF] sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-[#15171A]">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border-0 py-2 px-3 text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] placeholder:text-[#69707A] focus:ring-2 focus:ring-inset focus:ring-[#1677FF] sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="flex w-full justify-center items-center gap-2 rounded-md bg-[#1677FF] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1677FF] disabled:opacity-60 transition-all"
              >
                {isEmailLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isRegistering ? 'Creating account...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{isRegistering ? 'Create Account' : 'Sign In with Email'}</span>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[#69707A]">
            {isRegistering ? 'Already have an account? ' : "Don't have an account yet? "}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              type="button"
              className="font-semibold text-[#1677FF] hover:underline"
            >
              {isRegistering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
