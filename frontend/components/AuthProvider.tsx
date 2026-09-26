"use client";

import { useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Optionally sync user profile to Supabase 'users' table
        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              display_name: firebaseUser.displayName,
              photo_url: firebaseUser.photoURL,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
            
          if (error) {
            if (error.message.includes("row-level security")) {
              console.warn(
                "Supabase sync: RLS policy on 'public.users' requires an INSERT/UPDATE policy for the anon role. " +
                "Run the policy script from db/schema.sql in your Supabase SQL editor if you wish to mirror Firebase users to Supabase."
              );
            } else {
              console.error("Supabase sync error:", error.message);
            }
          }
        } catch (err) {
          console.error("Error syncing user to Supabase:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
