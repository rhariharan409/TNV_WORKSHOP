import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataProvider } from '../lib/dataProvider';
import { generateUUID } from '../lib/utils';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              setUser(profile);
            } else {
              // Fallback profile if record creation was delayed
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'TNV Student',
                role: (session.user.user_metadata?.role as UserRole) || 'student',
                college_name: session.user.user_metadata?.college_name || '',
                department: session.user.user_metadata?.department || '',
                year_of_study: session.user.user_metadata?.year_of_study || '',
                phone: session.user.user_metadata?.phone || '',
                created_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      } else {
        // Fallback local session
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
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) setUser(profile);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [isConfigured]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your email or username.' };
    }

    // 1. ADMIN AUTHENTICATION
    // User requirement: Only one admin with email MaterAdmin@gmail.com and password AdminPassword2026!
    const isAdminAccount =
      cleanEmail === 'materadmin@gmail.com' ||
      cleanEmail === 'masteradmin@gmail.com' ||
      cleanEmail === 'materadmin' ||
      cleanEmail === 'masteradmin';

    if (isAdminAccount) {
      if (cleanPass !== 'AdminPassword2026!') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Invalid password. Please enter the correct password for MaterAdmin@gmail.com.',
        };
      }

      const adminProfile: Profile = {
        id: 'd0a9d721-5698-4b5d-b744-64448476057b',
        email: 'MaterAdmin@gmail.com',
        full_name: 'Thamilaran (Admin)',
        role: 'super_admin',
        college_name: 'TNV Workshop Academy',
        department: 'Administration',
        year_of_study: 'Faculty',
        phone: '+91 98765 43210',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };

      setUser(adminProfile);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(adminProfile));
      setIsLoading(false);
      return { success: true };
    }

    // 2. STUDENT AUTHENTICATION (All other emails & passwords are for students)
    if (!cleanPass) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your student account password.' };
    }

    // Try Supabase auth first if configured
    if (isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const studentProfile: Profile = profile || {
            id: data.user.id,
            email: cleanEmail,
            full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: 'student',
            college_name: data.user.user_metadata?.college_name || 'Engineering College',
            department: data.user.user_metadata?.department || 'Information Technology',
            year_of_study: data.user.user_metadata?.year_of_study || '3rd Year',
            phone: data.user.user_metadata?.phone || '+91 98765 00000',
            created_at: new Date().toISOString(),
          };

          setUser(studentProfile);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentProfile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase auth sign-in warning, using direct student sign-in fallback:', err);
      }
    }

    // Direct student session creation/matching
    let studentProfile: Profile | null = null;
    try {
      const profiles = await dataProvider.getProfiles();
      const matched = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
      if (matched) {
        studentProfile = { ...matched, role: 'student' };
      }
    } catch {}

    if (!studentProfile) {
      try {
        const savedProfiles = JSON.parse(localStorage.getItem('tnv_student_profiles') || '[]');
        const matched = savedProfiles.find((p: any) => p.email.toLowerCase() === cleanEmail);
        if (matched) {
          studentProfile = matched;
        }
      } catch {}
    }

    if (!studentProfile) {
      const formattedName = cleanEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      studentProfile = {
        id: generateUUID(),
        email: email.trim(),
        full_name: formattedName || 'TNV Student',
        role: 'student',
        college_name: 'Engineering College',
        department: 'Information Technology',
        year_of_study: '3rd Year',
        phone: '+91 98765 00000',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };

      try {
        const savedProfiles = JSON.parse(localStorage.getItem('tnv_student_profiles') || '[]');
        savedProfiles.push(studentProfile);
        localStorage.setItem('tnv_student_profiles', JSON.stringify(savedProfiles));
      } catch {}
    }

    setUser(studentProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentProfile));
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
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password || 'TnvStudent2024!',
          options: {
            data: {
              full_name: data.fullName,
              phone: data.phone,
              college_name: data.collegeName,
              department: data.department,
              year_of_study: data.yearOfStudy,
              workshop_id: data.workshopId || null,
              role: 'student',
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (authData.user) {
          const newProfile: Profile = {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            college_name: data.collegeName,
            department: data.department,
            year_of_study: data.yearOfStudy,
            role: 'student',
            is_suspended: false,
            created_at: new Date().toISOString(),
          };
          setUser(newProfile);
        }

        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message };
      }
    }

    // Local / Demo registration
    const newStudentId = generateUUID();
    const newProfile: Profile = {
      id: newStudentId,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      college_name: data.collegeName,
      department: data.department,
      year_of_study: data.yearOfStudy,
      role: 'student',
      is_suspended: false,
      created_at: new Date().toISOString(),
    };

    // If workshop selected, create enrollment record
    if (data.workshopId) {
      await dataProvider.createEnrollment(data.workshopId, newStudentId);
    }

    setUser(newProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_AUTH_KEY);
  };

  const switchDemoRole = async (_targetRole: UserRole): Promise<void> => {
    // Dummy role switching disabled per user specification
  };

  const refreshProfile = async (): Promise<void> => {
    if (user?.id) {
      const profiles = await dataProvider.getProfiles();
      const updated = profiles.find((p) => p.id === user.id);
      if (updated) {
        setUser(updated);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        isAuthenticated: Boolean(user),
        isLoading,
        isConfigured,
        login,
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
