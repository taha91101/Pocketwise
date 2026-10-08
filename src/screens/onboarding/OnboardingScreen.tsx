import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { CURRENCY_OPTIONS } from '../../constants/paymentMethods';
import { useAppStore } from '../../store/useAppStore';
import { AccountType } from '../../types';
import { Feather } from '@expo/vector-icons';

const SLIDES = [
  {
    id: 'welcome',
    badge: 'WELCOME',
    title: 'Take control of your money.',
    desc: 'Track your spending, build better habits, and reach your savings goals with clarity and confidence.',
    icon: 'compass' as const,
  },
  {
    id: 'expenses',
    badge: 'EXPENSE TRACKING',
    title: 'Effortless Daily Tracking.',
    desc: 'Log expenses in seconds. Monitor category limits and get intelligent alerts before you exceed your budget.',
    icon: 'zap' as const,
  },
  {
    id: 'savings',
    badge: 'SAVINGS GOALS',
    title: 'Build Long-Term Wealth.',
    desc: 'Set goals for emergency funds, vacations, or new gadgets. Follow custom monthly targets and watch your savings grow.',
    icon: 'target' as const,
  },
  {
    id: 'insights',
    badge: 'FINANCIAL INTELLIGENCE',
    title: 'Understand Your Money.',
    desc: 'Receive personalized insights and smart saving suggestions tailored to your unique financial patterns.',
    icon: 'bar-chart-2' as const,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { colors, radius, spacing, shadows } = useTheme();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const addAccount = useAppStore((state) => state.addAccount);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPersonalizing, setIsPersonalizing] = useState(false);

  // Personalization form state - No hardcoded sample values
  const [userName, setUserName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [incomeRange, setIncomeRange] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [savingTarget, setSavingTarget] = useState('20');

  // Initial Account Setup
  const [accountName, setAccountName] = useState('Cash');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [openingBalance, setOpeningBalance] = useState('0');

  const isLastSlide = currentSlideIndex === SLIDES.length - 1;

  const handleNextSlide = () => {
    if (isLastSlide) {
      setIsPersonalizing(true);
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handleSkipToPersonalization = () => {
    setIsPersonalizing(true);
  };

  const handleFinish = async () => {
    const currencyObj = CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];
    await completeOnboarding({
      userName: userName.trim(),
      currency: currencyObj.code,
      currencySymbol: currencyObj.symbol,
      monthlyIncomeRange: incomeRange,
      mainSavingsGoal: mainGoal,
      preferredSavingTarget: parseInt(savingTarget, 10) || 20,
    });

    const parsedBalance = parseFloat(openingBalance.replace(/,/g, '')) || 0;
    const trimmedAccountName = accountName.trim() || 'Cash';
    const typeIcons: Record<AccountType, string> = {
      bank: 'credit-card',
      cash: 'dollar-sign',
      credit: 'credit-card',
      wallet: 'smartphone',
      investment: 'trending-up',
    };
    const typeColors: Record<AccountType, string> = {
      bank: '#0D9488',
      cash: '#10B981',
      credit: '#EF4444',
      wallet: '#3B82F6',
      investment: '#8B5CF6',
    };

    await addAccount({
      name: trimmedAccountName,
      type: accountType,
      balance: parsedBalance,
      icon: typeIcons[accountType] || 'dollar-sign',
      color: typeColors[accountType] || '#10B981',
    });
  };

  if (isPersonalizing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.personalizeContent, { padding: spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.personalizeHeader}>
              <View
                style={[
                  styles.badgeWrap,
                  {
                    backgroundColor: colors.primaryLight,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <AppText variant="caption" color={colors.primary} weight="700">
                  PERSONALIZATION
                </AppText>
              </View>
              <AppText variant="h2" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
                Tailor Your Experience
              </AppText>
              <AppText variant="body2" color={colors.textSecondary}>
                We will configure PocketWise according to your financial goals and currency.
              </AppText>
            </View>

            {/* Name */}
            <AppInput
              label="What should we call you?"
              placeholder="Your name"
              value={userName}
              onChangeText={setUserName}
              iconName="user"
            />

            {/* Currency */}
            <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
              Preferred Currency
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CURRENCY_OPTIONS.map((curr) => {
                const isSelected = selectedCurrency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => setSelectedCurrency(curr.code)}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      variant="body2"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      {curr.symbol} {curr.code}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Income Range */}
            <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Monthly Income Range
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {['< ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000', '₹1,00,000+'].map((range) => {
                const isSelected = incomeRange === range;
                return (
                  <TouchableOpacity
                    key={range}
                    onPress={() => setIncomeRange(range)}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      {range}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Main Savings Goal */}
            <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Main Savings Goal
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {['Emergency Fund', 'Travel & Vacation', 'Buy a Home', 'Gadgets / Tech', 'Retirement'].map((g) => {
                const isSelected = mainGoal === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setMainGoal(g)}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      🎯 {g}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Preferred Saving Target % */}
            <AppInput
              label="Target Savings Percentage of Monthly Income (%)"
              placeholder="20"
              keyboardType="numeric"
              value={savingTarget}
              onChangeText={setSavingTarget}
              iconName="percent"
              style={{ marginTop: spacing.md }}
            />

            {/* Primary Account Setup */}
            <View style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <AppText variant="subtitle1" weight="700">
                Primary Account Setup
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, marginBottom: spacing.sm }}>
                Set up your primary account and starting balance.
              </AppText>

              <AppInput
                label="Account Name"
                placeholder="e.g. HDFC Bank or Cash"
                value={accountName}
                onChangeText={setAccountName}
                iconName="credit-card"
              />

              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Account Type
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {(['cash', 'bank', 'wallet', 'credit'] as const).map((t) => {
                  const isSelected = accountType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setAccountType(t)}
                      style={[
                        styles.choiceChip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textPrimary}
                      >
                        {t === 'cash' ? '💵 Cash' : t === 'bank' ? '🏦 Bank' : t === 'wallet' ? '📱 Wallet' : '💳 Credit'}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <AppInput
                label="Opening Balance"
                placeholder="0"
                keyboardType="numeric"
                value={openingBalance}
                onChangeText={setOpeningBalance}
                iconName="dollar-sign"
                style={{ marginTop: spacing.md }}
              />
            </View>

            <View style={{ marginTop: spacing.xl, marginBottom: 30 }}>
              <AppButton
                title="Get Started"
                variant="primary"
                size="lg"
                onPress={handleFinish}
                fullWidth
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const slide = SLIDES[currentSlideIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.slideWrapper, { padding: spacing.xl }]}>
        {/* Skip button on top */}
        <View style={styles.skipRow}>
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.slideDot,
                  {
                    backgroundColor: idx === currentSlideIndex ? colors.primary : colors.border,
                    width: idx === currentSlideIndex ? 22 : 6,
                    borderRadius: radius.full,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={handleSkipToPersonalization}>
            <AppText variant="button" color={colors.textMuted}>
              Skip
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Hero Visual Card */}
        <View
          style={[
            styles.heroVisual,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              ...shadows.elevated,
            },
          ]}
        >
          <View
            style={[
              styles.heroIconCircle,
              {
                backgroundColor: colors.primaryLight,
                borderRadius: radius.full,
              },
            ]}
          >
            <Feather name={slide.icon} size={48} color={colors.primary} />
          </View>
          <View
            style={[
              styles.badgeWrap,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
                marginTop: spacing.xl,
              },
            ]}
          >
            <AppText variant="caption" color={colors.primary} weight="700">
              {slide.badge}
            </AppText>
          </View>
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <AppText variant="h1" align="center" style={{ marginBottom: spacing.md }}>
            {slide.title}
          </AppText>
          <AppText
            variant="body1"
            color={colors.textSecondary}
            align="center"
            style={{ lineHeight: 24, maxWidth: 320 }}
          >
            {slide.desc}
          </AppText>
        </View>

        {/* Bottom CTA */}
        <View style={styles.footerRow}>
          <AppButton
            title={isLastSlide ? 'Personalize Setup' : 'Continue'}
            variant="primary"
            size="lg"
            onPress={handleNextSlide}
            fullWidth
            iconName="arrow-right"
            iconPosition="right"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideDot: {
    height: 6,
    marginRight: 6,
  },
  heroVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    borderWidth: 1,
    marginTop: 20,
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  footerRow: {
    width: '100%',
    marginBottom: 16,
  },
  personalizeContent: {
    paddingBottom: 40,
  },
  personalizeHeader: {
    marginBottom: 24,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    marginRight: 8,
  },
});
