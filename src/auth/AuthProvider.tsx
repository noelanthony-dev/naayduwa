"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

type AuthCtx = { user: User | null; loading: boolean; error?: Error };
const Ctx = createContext<AuthCtx>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          await signInAnonymously(auth);
        } else {
          setUser(u);
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        console.error("Anonymous sign-in failed", e);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return <Ctx.Provider value={{ user, loading, error }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);