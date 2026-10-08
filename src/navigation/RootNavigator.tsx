import React from 'react';
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
import { WalkthroughModal } from '../components/modals/WalkthroughModal';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const hasCompletedOnboarding = useAppStore((state) => state.settings.hasCompletedOnboarding);

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
          </>
        )}
      </Stack.Navigator>
      {hasCompletedOnboarding && <WalkthroughModal />}
    </NavigationContainer>
  );
};
