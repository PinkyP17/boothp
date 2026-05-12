import { Platform } from 'react-native';

export const LIGHT_COLORS = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  primary: '#4A90D9',
  income: '#34C759',
  expense: '#FF3B30',
  profit: '#4A90D9',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  tabBar: '#FFFFFF',
  posButton: '#FF9500',
};

export const DARK_COLORS = {
  background: '#121212',
  card: '#1E1E1E',
  primary: '#5A9FE8',
  income: '#32D74B',
  expense: '#FF453A',
  profit: '#5A9FE8',
  textPrimary: '#F2F2F7',
  textSecondary: '#98989D',
  tabBar: '#1C1C1E',
  posButton: '#FF9F0A',
};

// Default export for backward compat — screens that haven't
// migrated to useTheme() yet will still get light colors.
export const COLORS = LIGHT_COLORS;

export const SIZES = {
  padding: 16,
  cardRadius: 12,
  fontTitle: 24,
  fontSubtitle: 18,
  fontBody: 16,
  fontCaption: 13,
};

export const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 3,
  },
  default: {},
});
