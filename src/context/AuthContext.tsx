import { type Session, type User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { User } from "../types/models";
import { getAuthRedirectUrl, supabase } from "../lib/supabase";

type SignUpInput = {
  email: string;
  password: string;
  nickname: string;
  university: string;
  campus: string;
  faculty: string;
  year: string;
};

type AuthContextValue = {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type ProfileRow = {
  id: string;
  verified_university_email: string;
  nickname: string;
  university: string;
  campus: string;
  faculty: string;
  year: string;
  is_premium: boolean;
  post_count: number;
  sticker_packs_owned: number;
  joined_clubs: string[];
  created_at: string;
  updated_at: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeSupabaseAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("over_email_send_rate_limit")) {
    return "Verification emails are rate-limited by Supabase for this project. Please wait a few minutes and try again.";
  }

  if (normalized.includes("user_already_exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (normalized.includes("invalid_credentials")) {
    return "The email or password is invalid. Please check your details and try again.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many verification requests were sent recently. Please wait a few minutes before trying again.";
  }

  return message;
}

function mapProfileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    nickname: row.nickname,
    verifiedUniversityEmail: row.verified_university_email,
    university: row.university,
    campus: row.campus,
    faculty: row.faculty,
    year:
      row.year === "postgraduate"
        ? "postgraduate"
        : (Number(row.year) as User["year"]),
    isPremium: row.is_premium,
    premiumStatus: row.is_premium ? "premium" : "free",
    postCount: row.post_count,
    stickerPacksOwned: row.sticker_packs_owned,
    joinedClubs: row.joined_clubs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseUserToProfile(user: SupabaseUser): Omit<ProfileRow, "created_at" | "updated_at"> {
  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    verified_university_email: user.email ?? "",
    nickname: typeof meta.nickname === "string" ? meta.nickname : "",
    university: typeof meta.university === "string" ? meta.university : "",
    campus: typeof meta.campus === "string" ? meta.campus : "",
    faculty: typeof meta.faculty === "string" ? meta.faculty : "",
    year: typeof meta.year === "string" ? meta.year : "1",
    is_premium: typeof meta.isPremium === "boolean" ? meta.isPremium : false,
    post_count: typeof meta.postCount === "number" ? meta.postCount : 0,
    sticker_packs_owned:
      typeof meta.stickerPacksOwned === "number" ? meta.stickerPacksOwned : 0,
    joined_clubs: Array.isArray(meta.joinedClubs) ? meta.joinedClubs : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (user: SupabaseUser) => {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingProfile) {
      setProfile(mapProfileRowToUser(existingProfile as ProfileRow));
      return;
    }

    const profilePayload = mapSupabaseUserToProfile(user);
    const { data: createdProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    setProfile(mapProfileRowToUser(createdProfile as ProfileRow));
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    const currentSession = data.session;

    setSession(currentSession);

    if (!currentSession?.user) {
      setProfile(null);
      return;
    }

    await loadProfile(currentSession.user);
  };

  useEffect(() => {
    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setAuthError(error.message);
      }

      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        try {
          await loadProfile(currentSession.user);
        } catch (loadError) {
          setAuthError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
        }
      }

      setLoading(false);
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        return;
      }

      try {
        await loadProfile(nextSession.user);
      } catch (loadError) {
        setAuthError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  };

  const signUp = async (input: SignUpInput) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/login"),
        data: {
          nickname: input.nickname,
          university: input.university,
          campus: input.campus,
          faculty: input.faculty,
          year: input.year,
          isPremium: false,
          postCount: 0,
          stickerPacksOwned: 0,
          joinedClubs: [],
        },
      },
    });

    if (error) {
      const friendlyMessage = normalizeSupabaseAuthError(error.message);
      setAuthError(friendlyMessage);
      return { success: false, error: friendlyMessage };
    }

    if (!data.user) {
      const friendlyMessage = "Sign-up succeeded, but the verification email could not be created. Please try again.";
      setAuthError(friendlyMessage);
      return { success: false, error: friendlyMessage };
    }

    return { success: true };
  };

  const resendVerificationEmail = async (email: string) => {
    setAuthError(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/login"),
      },
    });

    if (error) {
      const friendlyMessage = normalizeSupabaseAuthError(error.message);
      setAuthError(friendlyMessage);
      return { success: false, error: friendlyMessage };
    }

    return { success: true };
  };

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      authError,
      signIn,
      signUp,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}