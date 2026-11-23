import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Raw environment variables (with default production fallback for Vercel/cloud deployments)
const rawSupabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://hbocacibcgxkufvxhqpb.supabase.co'
).trim();
const rawSupabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_hGIEVnkNBHXh4FYLD7VWgw_MlXVnpXd'
).trim();

// Normalize the Supabase URL:
// Automatically strip trailing slashes and common accidental path suffixes like /rest/v1 or /rest/v1/
export const supabaseUrl = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const supabaseAnonKey = rawSupabaseAnonKey;

// Validation helpers
export const isSecretKeyDetected = (): boolean => {
  return (
    supabaseAnonKey.startsWith('sb_secret_') ||
    supabaseAnonKey.startsWith('service_role')
  );
};

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  isSecretKey: boolean;
  url: string;
  errorMessage?: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const hasUrl = Boolean(supabaseUrl) && supabaseUrl.startsWith('https://');
  const isPlaceholderUrl =
    supabaseUrl.includes('sample-project-id') ||
    supabaseUrl.includes('your-project-id') ||
    supabaseUrl.includes('placeholder');
  const hasKey = Boolean(supabaseAnonKey);
  const isPlaceholderKey =
    supabaseAnonKey.includes('sample') ||
    supabaseAnonKey.includes('placeholder') ||
    supabaseAnonKey.includes('your-anon-key');
  const isSecret = isSecretKeyDetected();

  let errorMessage: string | undefined;

  if (isSecret) {
    errorMessage =
      'CRITICAL SECURITY RISK: A Secret Key (service_role) was detected in VITE_SUPABASE_ANON_KEY. ' +
      'Never expose your secret key in frontend client bundles! Replace it with your Publishable / Anon key in .env.';
  } else if (!hasUrl || isPlaceholderUrl) {
    errorMessage =
      'VITE_SUPABASE_URL is missing or using placeholder values. Please set your project URL in .env.';
  } else if (!hasKey || isPlaceholderKey) {
    errorMessage =
      'VITE_SUPABASE_ANON_KEY is missing or using placeholder values. Please set your anon key in .env.';
  }

  const isConfigured = hasUrl && !isPlaceholderUrl && hasKey && !isPlaceholderKey && !isSecret;

  return {
    isConfigured,
    hasUrl,
    hasKey,
    isSecretKey: isSecret,
    url: supabaseUrl,
    errorMessage,
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfigStatus().isConfigured;
};

// Console notifications on startup
if (typeof window !== 'undefined') {
  const status = getSupabaseConfigStatus();
  if (status.errorMessage) {
    if (status.isSecretKey) {
      console.error(`🚨 [TNV Workshop Security Alert] ${status.errorMessage}`);
    } else {
      console.warn(`⚠️ [TNV Workshop Configuration] ${status.errorMessage}`);
    }
  } else {
    console.info(`✅ [TNV Workshop] Supabase configured with endpoint: ${supabaseUrl}`);
  }
}

// Client initialization with fallback
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Diagnostic live connection check
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  statusCode?: number;
  tableCount?: number;
}> => {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    return {
      connected: false,
      message: status.errorMessage || 'Supabase credentials are not configured.',
    };
  }

  try {
    const { count, error, status: httpStatus } = await supabase
      .from('workshops')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Database query failed: ${error.message} (${error.code || 'UNKNOWN'})`,
        statusCode: httpStatus,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase database (${count ?? 0} workshops found).`,
      statusCode: httpStatus,
      tableCount: count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network/Fetch error: ${err.message || 'Unable to connect to Supabase.'}`,
    };
  }
};
