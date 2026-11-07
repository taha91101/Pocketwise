import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { TransactionDetailScreen } from '../screens/transactions/TransactionDetailScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { RecurringScreen } from '../screens/recurring/RecurringScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { AutomaticDetectionSettingsScreen } from '../screens/settings/AutomaticDetectionSettingsScreen';
import { DetectionDiagnosticsScreen } from '../screens/settings/DetectionDiagnosticsScreen';
import { WalkthroughModal } from '../components/modals/WalkthroughModal';
import { PinLockScreen } from '../screens/security/PinLockScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const hasCompletedOnboarding = settings.hasCompletedOnboarding;
  const securityEnabled = settings.securityEnabled;
  const lockTimeout = settings.lockTimeout || 'immediate';

  const [isLocked, setIsLocked] = useState<boolean>(securityEnabled);
  const lastBackgroundTime = useRef<number | null>(null);

  // Sync locked state if user enables security in settings
  useEffect(() => {
    if (!securityEnabled) {
      setIsLocked(false);
    }
  }, [securityEnabled]);

  // Monitor AppState to handle background lock timeout
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastBackgroundTime.current = Date.now();
      } else if (nextAppState === 'active') {
        // Re-sync any UPI transactions captured in native storage while in background
        useAppStore.getState().syncDetectedTransactions();

        if (securityEnabled && lastBackgroundTime.current) {
          const elapsedMs = Date.now() - lastBackgroundTime.current;
          const timeoutMs =
            lockTimeout === '5min'
              ? 5 * 60 * 1000
              : lockTimeout === '1min'
              ? 1 * 60 * 1000
              : 0; // immediate

          if (elapsedMs >= timeoutMs) {
            setIsLocked(true);
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [securityEnabled, lockTimeout]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  // If user has completed onboarding and security lock is active, show PinLockScreen
  if (hasCompletedOnboarding && securityEnabled && isLocked) {
    return <PinLockScreen onUnlockSuccess={() => setIsLocked(false)} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Recurring" component={RecurringScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Accounts" component={AccountsScreen} />
            <Stack.Screen name="AutomaticDetectionSettings" component={AutomaticDetectionSettingsScreen} />
            <Stack.Screen name="DetectionDiagnostics" component={DetectionDiagnosticsScreen} />
          </>
        )}
      </Stack.Navigator>
      {hasCompletedOnboarding && <WalkthroughModal />}
    </NavigationContainer>
  );
};
