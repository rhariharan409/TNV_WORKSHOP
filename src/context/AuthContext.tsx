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
  switchDemoRole: (role: UserRole) => void;
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
          }
        } else {
          // Default to student demo user for instant testability
          const demoStudent: Profile = {
            id: 'student-demo-id-1',
            email: 'student@tnvworkshop.edu.in',
            full_name: 'Aditya Ramanathan',
            phone: '+91 98765 11223',
            college_name: 'PSG College of Technology',
            department: 'Computer Science and Engineering',
            year_of_study: '3rd Year',
            role: 'student',
            is_suspended: false,
            created_at: new Date().toISOString(),
          };
          setUser(demoStudent);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(demoStudent));
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
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [isConfigured]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'TestPassword123!',
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) setUser(profile);
        }
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Login failed' };
      }
    }

    // Local / Demo Login Handler
    const profiles = await dataProvider.getProfiles();
    let matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!matched) {
      // Auto-create local student if unknown
      matched = {
        id: generateUUID(),
        email,
        full_name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'student',
        college_name: 'Registered College',
        department: 'Engineering',
        year_of_study: '3rd Year',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
    }

    setUser(matched);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(matched));
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

  const switchDemoRole = (targetRole: UserRole): void => {
    if (targetRole === 'admin' || targetRole === 'super_admin') {
      const adminUser: Profile = {
        id: 'admin-demo-id-1',
        email: 'admin@tnvworkshop.edu.in',
        full_name: 'Dr. T. N. Venkatesh (Admin)',
        phone: '+91 98765 43210',
        college_name: 'TNV Workshop Academy',
        department: 'Program Administration',
        year_of_study: 'Faculty',
        role: targetRole,
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
      setUser(adminUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(adminUser));
    } else {
      const studentUser: Profile = {
        id: 'student-demo-id-1',
        email: 'student@tnvworkshop.edu.in',
        full_name: 'Aditya Ramanathan',
        phone: '+91 98765 11223',
        college_name: 'PSG College of Technology',
        department: 'Computer Science and Engineering',
        year_of_study: '3rd Year',
        role: 'student',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
      setUser(studentUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(studentUser));
    }
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
