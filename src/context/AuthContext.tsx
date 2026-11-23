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
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
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
              setUser(profile);
              localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
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
            setUser(profile);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
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

    if (!cleanEmail) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your email or username.' };
    }

    // 1. ADMIN AUTHENTICATION
    // Dedicated administrator account: MaterAdmin@gmail.com
    const isAdminAccount =
      cleanEmail === 'materadmin@gmail.com' ||
      cleanEmail === 'masteradmin@gmail.com' ||
      cleanEmail === 'materadmin' ||
      cleanEmail === 'masteradmin';

    if (isAdminAccount) {
      if (isConfigured) {
        // Real Supabase Auth for Admin: never hardcodes plaintext password
        const authEmail = cleanEmail.includes('@') ? cleanEmail : 'MaterAdmin@gmail.com';
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPass,
        });

        if (signInError) {
          setIsLoading(false);
          let errMsg = signInError.message;
          if (errMsg.toLowerCase().includes('invalid login credentials')) {
            errMsg = 'Invalid admin credentials. Please enter the correct password for MaterAdmin@gmail.com.';
          }
          return { success: false, error: errMsg };
        }

        if (!signInData?.user) {
          setIsLoading(false);
          return { success: false, error: 'Admin login failed. User session not found.' };
        }

        const authUserId = signInData.user.id;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle();

        let adminProfile: Profile;
        if (profileData) {
          adminProfile = {
            ...profileData,
            role:
              profileData.role === 'admin' || profileData.role === 'super_admin'
                ? profileData.role
                : 'super_admin',
          };
        } else {
          // If no row in public.profiles yet, create and upsert it with the real auth uid
          const newAdminProfile: Profile = {
            id: authUserId,
            email: signInData.user.email || 'MaterAdmin@gmail.com',
            full_name: signInData.user.user_metadata?.full_name || 'Thamilaran (Admin)',
            role: 'super_admin',
            college_name: 'TNV Workshop Academy',
            department: 'Administration',
            year_of_study: 'Faculty',
            phone: '+91 98765 43210',
            is_suspended: false,
            created_at: new Date().toISOString(),
          };
          try {
            await supabase.from('profiles').upsert(newAdminProfile, { onConflict: 'id' });
          } catch (e) {
            console.warn('Profile upsert notice:', e);
          }
          adminProfile = newAdminProfile;
        }

        setUser(adminProfile);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(adminProfile));
        setIsLoading(false);
        return { success: true, role: adminProfile.role };
      }

      // Supabase is NOT configured (Demo mode fallback only)
      if (cleanPass !== 'AdminPassword2026!') {
        if (!cleanPass) {
          setIsLoading(false);
          return {
            success: false,
            error: 'Invalid password. Please enter the correct password for MaterAdmin@gmail.com.',
            error: 'Please enter your password.',
          };
        }

        const fallbackAdminProfile: Profile = {
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

        setUser(fallbackAdminProfile);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(fallbackAdminProfile));
        setIsLoading(false);
        return { success: true, role: 'super_admin' };
      }

      // 2. STUDENT AUTHENTICATION (All other emails & passwords are for students)
      if (!cleanPass) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your student account password.' };
      }

      // When Supabase is configured: strictly use real supabase.auth
      if (isConfigured) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (signInError) {
          setIsLoading(false);
          let errMsg = signInError.message;
          if (errMsg.toLowerCase().includes('email not confirmed')) {
            errMsg = 'Email not confirmed. Please check your email to confirm your account, then log in.';
          } else if (errMsg.toLowerCase().includes('invalid login credentials')) {
            errMsg = 'Invalid login credentials. Please verify your email and password.';
          }
          // Do NOT create any fake profile. Return real Supabase error.
          return { success: false, error: errMsg };
        }

        if (!signInData?.user) {
          setIsLoading(false);
          return { success: false, error: 'Login failed. User session not found.' };
        }

        const authUserId = signInData.user.id;

        // Load matching row from public.profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle();

        let studentProfile: Profile;
        if (profileData) {
          studentProfile = profileData as Profile;
        } else {
          // Fallback: If handle_new_user trigger had not created the profile, upsert it now with real auth uid
          const formattedName = cleanEmail
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          const newProfilePayload: Profile = {
            id: authUserId,
            email: signInData.user.email || cleanEmail,
            full_name: signInData.user.user_metadata?.full_name || formattedName || 'TNV Student',
            role: 'student',
            college_name: signInData.user.user_metadata?.college_name || 'Engineering College',
            department: signInData.user.user_metadata?.department || 'Information Technology',
            year_of_study: signInData.user.user_metadata?.year_of_study || '3rd Year',
            phone: signInData.user.user_metadata?.phone || '+91 98765 00000',
            is_suspended: false,
            created_at: new Date().toISOString(),
          };

          try {
            await supabase.from('profiles').upsert(newProfilePayload, { onConflict: 'id' });
          } catch (upsertErr) {
            console.warn('Profile direct upsert notice:', upsertErr);
          }

          studentProfile = newProfilePayload;
        }

        setUser(studentProfile);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentProfile));
        setIsLoading(false);
        return { success: true, role: studentProfile.role };
      }

      // LOCAL FALLBACK ONLY WHEN SUPABASE IS NOT CONFIGURED (Demo Mode)
      let studentProfile: Profile | null = null;
      try {
        const profiles = await dataProvider.getProfiles();
        const matched = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
        if (matched) {
          studentProfile = { ...matched, role: 'student' };
        }
      } catch { }

      if (!studentProfile) {
        try {
          const savedProfiles = JSON.parse(localStorage.getItem('tnv_student_profiles') || '[]');
          const matched = savedProfiles.find((p: any) => p.email.toLowerCase() === cleanEmail);
          if (matched) {
            studentProfile = matched;
          }
        } catch { }
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
        } catch { }
      }

      setUser(studentProfile);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentProfile));
      setIsLoading(false);
      return { success: true, role: 'student' };
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
          // Register using real Supabase Auth
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email.trim(),
            password: data.password || 'TnvStudent2024!',
            options: {
              data: {
                full_name: data.fullName.trim(),
                college_name: data.collegeName.trim(),
                department: data.department.trim(),
                year_of_study: data.yearOfStudy,
                phone: data.phone.trim(),
                workshop_id: data.workshopId || null,
                role: 'student',
              },
            },
          });

          if (error) {
            setIsLoading(false);
            // Show real Supabase error with NO local fallback
            return { success: false, error: error.message };
          }

          if (!authData.user) {
            setIsLoading(false);
            return { success: false, error: 'Registration failed. User was not created.' };
          }

          const authUserId = authData.user.id;

          // Ensure row exists in public.profiles for the new user (check handle_new_user trigger; upsert if missing)
          const newProfile: Profile = {
            id: authUserId,
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

          try {
            await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
          } catch (upsertErr) {
            console.warn('Profile direct upsert notice:', upsertErr);
          }

          // If workshop selected, create enrollment record
          if (data.workshopId) {
            try {
              await dataProvider.createEnrollment(data.workshopId, authUserId);
            } catch (e) {
              console.warn('Post-signup enrollment notice:', e);
            }
          }

          // Handle "email confirmation required": if signUp returns no session
          if (!authData.session) {
            setIsLoading(false);
            return {
              success: false,
              error: 'Check your email to confirm, then log in',
            };
          }

          setUser(newProfile);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newProfile));
          setIsLoading(false);
          return { success: true };
        } catch (err: any) {
          setIsLoading(false);
          return { success: false, error: err.message || 'Registration failed.' };
        }
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
