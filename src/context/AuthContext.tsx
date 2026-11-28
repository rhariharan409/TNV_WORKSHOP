import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Profile, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataProvider, clearInstructorCache } from '../lib/dataProvider';
import { generateUUID, EMAIL_REGEX } from '../lib/utils';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    email: string;
    password?: string;
    fullName: string;
    phone: string;
    collegeName: string;
    department: string;
    yearOfStudy: string;
    workshopId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void> | void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'tnv_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  // Load initial session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (isConfigured) {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.warn('Supabase getSession error:', sessionError);
          }

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              const sanitized: Profile = {
                ...profile,
                full_name: profile.full_name?.replace(/materadmin/gi, 'masteradmin') || profile.full_name,
                email: (profile.email || '').replace(/materadmin/gi, 'masteradmin'),
              };
              setUser(sanitized);
              localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sanitized));
            } else {
              // Fallback profile if record creation was delayed
              const fallback: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'TNV Student',
                role: (session.user.user_metadata?.role as UserRole) || 'student',
                college_name: session.user.user_metadata?.college_name || '',
                department: session.user.user_metadata?.department || '',
                year_of_study: session.user.user_metadata?.year_of_study || '',
                phone: session.user.user_metadata?.phone || '',
                created_at: new Date().toISOString(),
              };
              setUser(fallback);
              localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(fallback));
            }
          } else {
            // No active Supabase session
            setUser(null);
            localStorage.removeItem(LOCAL_AUTH_KEY);
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
          setUser(null);
        }
      } else {
        // Fallback local session when Supabase is NOT configured
        const stored = localStorage.getItem(LOCAL_AUTH_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(LOCAL_AUTH_KEY);
            setUser(null);
          }
        } else {
          // No active session: keep user null until explicit login
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    if (isConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          localStorage.removeItem(LOCAL_AUTH_KEY);
        } else if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) {
            const sanitized: Profile = {
              ...profile,
              full_name: profile.full_name?.replace(/materadmin/gi, 'masteradmin') || profile.full_name,
              email: (profile.email || '').replace(/materadmin/gi, 'masteradmin'),
            };
            setUser(sanitized);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sanitized));
          } else {
            const fallback: Profile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'TNV Student',
              role: (session.user.user_metadata?.role as UserRole) || 'student',
              college_name: session.user.user_metadata?.college_name || '',
              department: session.user.user_metadata?.department || '',
              year_of_study: session.user.user_metadata?.year_of_study || '',
              phone: session.user.user_metadata?.phone || '',
              created_at: new Date().toISOString(),
            };
            setUser(fallback);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(fallback));
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [isConfigured]);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Validate email format and password presence
    if (!cleanEmail || !cleanPass || !EMAIL_REGEX.test(cleanEmail)) {
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }

    // 1. ADMIN ACCOUNT CHECK (Dedicated administrator: masteradmin@gmail.com)
    const isAdminAccount =
      cleanEmail === 'masteradmin@gmail.com' ||
      cleanEmail === 'materadmin@gmail.com' ||
      cleanEmail === 'masteradmin' ||
      cleanEmail === 'materadmin';

    if (isConfigured) {
      let signInData = null;
      let signInError = null;

      const authEmail = cleanEmail.includes('@')
        ? cleanEmail
        : 'masteradmin@gmail.com';

      const res1 = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPass,
      });

      if (!res1.error && res1.data?.user) {
        signInData = res1.data;
      } else if (isAdminAccount) {
        // Try alternate spelling if applicable
        const altEmail = authEmail.toLowerCase() === 'masteradmin@gmail.com'
          ? 'materadmin@gmail.com'
          : 'masteradmin@gmail.com';
        const res2 = await supabase.auth.signInWithPassword({
          email: altEmail,
          password: cleanPass,
        });
        if (!res2.error && res2.data?.user) {
          signInData = res2.data;
        } else {
          signInError = res1.error || res2.error;
        }
      } else {
        signInError = res1.error;
      }

      if (signInError || !signInData?.user) {
        setIsLoading(false);
        // Requirement 5: Always show the generic message "Invalid email or password" for any login failure
        return { success: false, error: 'Invalid email or password' };
      }

      const authUserId = signInData.user.id;

      // Load profile to verify role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      const isProfileAdmin =
        isAdminAccount ||
        profileData?.role === 'admin' ||
        profileData?.role === 'super_admin';

      // 2. FOR STUDENTS: READ public.signup_records
      if (!isProfileAdmin) {
        const { data: record, error: recError } = await supabase
          .from('signup_records')
          .select('*')
          .eq('user_id', authUserId)
          .maybeSingle();

        if (recError || !record || !record.password_set) {
          // If no record or password_set is false, signOut and show generic error
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'Invalid email or password' };
        }
      }

      // Log login event via RPC
      try {
        await supabase.rpc('log_login_event', { p_method: 'password' });
      } catch (logErr) {
        console.warn('log_login_event RPC notice:', logErr);
      }

      let activeProfile: Profile;
      if (profileData) {
        const rawName = profileData.full_name || (isProfileAdmin ? 'masteradmin' : 'TNV Student');
        const cleanName = rawName.replace(/materadmin/gi, 'masteradmin');
        const cleanEmailStr = (profileData.email || '').replace(/materadmin/gi, 'masteradmin');

        activeProfile = {
          ...profileData,
          full_name: cleanName,
          email: cleanEmailStr,
          role: isProfileAdmin
            ? profileData.role === 'admin' || profileData.role === 'super_admin'
              ? profileData.role
              : 'super_admin'
            : (profileData.role as UserRole) || 'student',
        };
      } else {
        const newProfile: Profile = {
          id: authUserId,
          email: (signInData.user.email || cleanEmail).replace(/materadmin/gi, 'masteradmin'),
          full_name:
            signInData.user.user_metadata?.full_name?.replace(/materadmin/gi, 'masteradmin') ||
            (isProfileAdmin ? 'masteradmin' : 'TNV Student'),
          role: isProfileAdmin ? 'super_admin' : 'student',
          college_name: isProfileAdmin ? 'TNV Workshop Academy' : 'Engineering College',
          department: isProfileAdmin ? 'Administration' : 'Information Technology',
          year_of_study: isProfileAdmin ? 'Faculty' : '3rd Year',
          phone: isProfileAdmin ? '+91 98765 43210' : '+91 98765 00000',
          is_suspended: false,
          created_at: new Date().toISOString(),
        };
        try {
          await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
        } catch (e) {
          console.warn('Profile upsert notice:', e);
        }
        activeProfile = newProfile;
      }

      setUser(activeProfile);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(activeProfile));
      setIsLoading(false);
      return { success: true, role: activeProfile.role };
    }

    // SUPABASE IS NOT CONFIGURED (Demo mode fallback only)
    if (isAdminAccount) {
      if (cleanPass !== 'AdminPassword2026!') {
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password' };
      }

      const fallbackAdminProfile: Profile = {
        id: 'd0a9d721-5698-4b5d-b744-64448476057b',
        email: 'masteradmin@gmail.com',
        full_name: 'masteradmin',
        role: 'super_admin',
        college_name: 'TNV Workshop Academy',
        department: 'Administration',
        year_of_study: 'Faculty',
        phone: '+91 98765 43210',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };

      setUser(fallbackAdminProfile);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(fallbackAdminProfile));
      setIsLoading(false);
      return { success: true, role: 'super_admin' };
    }

    // Demo student fallback
    let studentProfile: Profile | null = null;
    try {
      const profiles = await dataProvider.getProfiles();
      const matched = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
      if (matched) {
        studentProfile = { ...matched, role: 'student' };
      }
    } catch { }

    if (!studentProfile) {
      const formattedName = cleanEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      studentProfile = {
        id: generateUUID(),
        email: cleanEmail,
        full_name: formattedName || 'TNV Student',
        role: 'student',
        college_name: 'Engineering College',
        department: 'Information Technology',
        year_of_study: '3rd Year',
        phone: '+91 98765 00000',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
    }

    setUser(studentProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentProfile));
    setIsLoading(false);
    return { success: true, role: 'student' };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    if (isConfigured) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    // Demo mode fallback only when isSupabaseConfigured() is false
    const demoGoogleStudent: Profile = {
      id: generateUUID(),
      email: 'student@tnvworkshop.edu.in',
      full_name: 'Aditya Ramanathan (Student)',
      role: 'student',
      college_name: 'PSG College of Technology',
      department: 'Information Technology',
      year_of_study: '3rd Year',
      phone: '+91 98765 11223',
      is_suspended: false,
      created_at: new Date().toISOString(),
    };
    setUser(demoGoogleStudent);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(demoGoogleStudent));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (data: {
    email: string;
    password?: string;
    fullName: string;
    phone: string;
    collegeName: string;
    department: string;
    yearOfStudy: string;
    workshopId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isConfigured) {
      // Requirement 1: Remove the supabase.auth.signUp call used for students when Supabase is configured.
      setIsLoading(false);
      return {
        success: false,
        error: 'New student registrations must use Continue with Google.',
      };
    }

    // Local / Demo registration only when Supabase is NOT configured
    const newStudentId = generateUUID();
    const newProfile: Profile = {
      id: newStudentId,
      email: data.email.trim(),
      full_name: data.fullName.trim(),
      phone: data.phone.trim(),
      college_name: data.collegeName.trim(),
      department: data.department.trim(),
      year_of_study: data.yearOfStudy,
      role: 'student',
      is_suspended: false,
      created_at: new Date().toISOString(),
    };

    if (data.workshopId) {
      await dataProvider.createEnrollment(data.workshopId, newStudentId);
    }

    setUser(newProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

    const logout = async (): Promise<void> => {
      clearInstructorCache();
      if (isConfigured) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('Supabase signOut error:', err);
        }
      }
      setUser(null);
      localStorage.removeItem(LOCAL_AUTH_KEY);
    };

    const switchDemoRole = async (_targetRole: UserRole): Promise<void> => {
      // Dummy role switching disabled per user specification
    };

    const refreshProfile = useCallback(async (): Promise<void> => {
      try {
        let targetId = user?.id;
        if (!targetId && isConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          targetId = session?.user?.id;
        }
        if (!targetId) return;

        if (isConfigured) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          if (profile) {
            const sanitized: Profile = {
              ...profile,
              full_name: profile.full_name?.replace(/materadmin/gi, 'masteradmin') || profile.full_name,
              email: (profile.email || '').replace(/materadmin/gi, 'masteradmin'),
            };
            setUser(sanitized);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sanitized));
          }
        } else {
          const profiles = await dataProvider.getProfiles();
          const updated = profiles.find((p) => p.id === targetId);
          if (updated) {
            const sanitized: Profile = {
              ...updated,
              full_name: updated.full_name?.replace(/materadmin/gi, 'masteradmin') || updated.full_name,
              email: (updated.email || '').replace(/materadmin/gi, 'masteradmin'),
            };
            setUser(sanitized);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(sanitized));
          }
        }
      } catch (e) {
        console.warn('refreshProfile error:', e);
      }
    }, [user?.id, isConfigured]);

    return (
      <AuthContext.Provider
        value={{
          user,
          role: user?.role || 'student',
          isAuthenticated: Boolean(user),
          isLoading,
          isConfigured,
          login,
          signInWithGoogle,
          signup,
          logout,
          switchDemoRole,
          refreshProfile,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
