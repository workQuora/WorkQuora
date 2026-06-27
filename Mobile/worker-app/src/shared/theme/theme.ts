import { useSelector } from 'react-redux';
import { APP_ROLE } from '../../config';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  grayLight: string;
  grayMedium: string;
}

const clientColors: ThemeColors = {
  primary: '#1e3a8a',       // Dark Blue
  secondary: '#3b82f6',     // Sky Blue
  accent: '#eff7ff',        // Light ice-blue
  bg: '#f8fafc',            // Light slate gray/blue
  card: '#ffffff',
  text: '#0f172a',          // Dark slate
  textMuted: '#64748b',     // Slate gray
  border: '#e2e8f0',        // Border gray
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  grayLight: '#f1f5f9',
  grayMedium: '#cbd5e1',
};

const workerColors: ThemeColors = {
  primary: '#10b981',       // Emerald Green
  secondary: '#059669',     // Deep Emerald
  accent: '#ecfdf5',        // Mint active background
  bg: '#f4fbf7',            // Ambient light green
  card: '#ffffff',
  text: '#064e3b',          // Dark green text
  textMuted: '#047857',     // Greenish gray
  border: '#d1fae5',        // Mint green border
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  grayLight: '#f9fbfd',
  grayMedium: '#a7f3d0',
};

export function useTheme() {
  const role = useSelector((state: any) => state?.auth?.role) as 'CLIENT' | 'FREELANCER' | undefined;
  
  // Fallback to the environment configuration APP_ROLE
  const activeRole = role || APP_ROLE || 'CLIENT';
  const colors = activeRole === 'CLIENT' ? clientColors : workerColors;
  
  return {
    colors,
    role: activeRole,
    isClient: activeRole === 'CLIENT',
    isWorker: activeRole === 'FREELANCER',
  };
}
