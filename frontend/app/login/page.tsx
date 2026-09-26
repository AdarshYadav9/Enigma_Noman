"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (user) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
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
          <form className="space-y-6" onSubmit={handleEmailAuth}>
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
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] placeholder:text-[#69707A] focus:ring-2 focus:ring-inset focus:ring-[#1677FF] sm:text-sm sm:leading-6"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] placeholder:text-[#69707A] focus:ring-2 focus:ring-inset focus:ring-[#1677FF] sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {error && (
              <div className="text-[#FF4D4F] text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-[#1677FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1677FF]"
              >
                {isRegistering ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E8EC]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-[#69707A]">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#15171A] shadow-sm ring-1 ring-inset ring-[#E5E8EC] hover:bg-gray-50 focus-visible:ring-transparent"
              >
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
                <span className="text-sm font-semibold leading-6">Google</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[#69707A]">
            {isRegistering ? 'Already have an account? ' : 'Not a member? '}
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="font-semibold leading-6 text-[#1677FF] hover:text-blue-500"
            >
              {isRegistering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
