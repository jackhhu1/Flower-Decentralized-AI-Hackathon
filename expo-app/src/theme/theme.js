import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary colors - teal accent
    primary: '#00D4AA', // Vibrant teal
    primaryContainer: '#00B894', // Darker teal
    
    // Secondary colors - dark blue
    secondary: '#1E3A8A', // Dark blue
    secondaryContainer: '#1E40AF', // Lighter dark blue
    
    // Surface colors - dark theme
    surface: '#1A1A2E', // Dark navy
    surfaceVariant: '#16213E', // Darker navy
    
    // Background - dark blue
    background: '#0F0F23', // Very dark blue
    
    // Text colors - white and light
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#FFFFFF', // White text
    onBackground: '#FFFFFF', // White text
    onSurfaceVariant: '#E5E7EB', // Light gray
    
    // Accent colors
    error: '#EF4444', // Red for warnings
    onError: '#FFFFFF',
    outline: '#374151', // Medium gray
    outlineVariant: '#4B5563', // Light gray
    
    // Custom colors for the app
    accent: '#00D4AA', // Teal accent
    accentContainer: '#1E3A8A', // Dark blue accent
    onAccent: '#FFFFFF', // White text on accent
    
    // Status colors
    success: '#10B981', // Green for success
    warning: '#F59E0B', // Orange for warning
    info: '#3B82F6', // Blue for info
  },
  roundness: 8,
};
