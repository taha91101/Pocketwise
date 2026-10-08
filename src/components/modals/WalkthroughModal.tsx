import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

const WALKTHROUGH_STEPS = [
  {
    step: 1,
    title: 'Welcome to PocketWise 👋',
    desc: 'Your pocket. Your plan. Your future. Let us give you a quick 60-second tour of your new financial command center.',
    icon: 'compass' as const,
  },
  {
    step: 2,
    title: 'Available Balance & Net Worth 💰',
    desc: 'See your real-time liquid balance across all accounts, monthly growth percentages, and overall savings rate at a glance.',
    icon: 'shield' as const,
  },
  {
    step: 3,
    title: 'Quick Actions ⚡',
    desc: 'Record an expense or income in 2 taps. Perform account transfers or allocate funds directly to savings goals effortlessly.',
    icon: 'zap' as const,
  },
  {
    step: 4,
    title: 'Transaction Tracker 📜',
    desc: 'Search, filter by date or category, edit, duplicate, and monitor all your expenses, incomes, and savings in real time.',
    icon: 'list' as const,
  },
  {
    step: 5,
    title: 'Smart Category Budgets 🎯',
    desc: 'Set limits for Food, Shopping, Transport, and Bills. Get proactive alerts when you reach 80% capacity before you overspend.',
    icon: 'pie-chart' as const,
  },
  {
    step: 6,
    title: 'Savings & Emergency Fund 🛡️',
    desc: 'Create dedicated savings targets. We calculate required monthly deposits and track your estimated completion dates.',
    icon: 'target' as const,
  },
  {
    step: 7,
    title: 'Recurring Payments & Bills 📅',
    desc: 'Stay ahead of upcoming rent, wifi, electricity, and streaming subscriptions with automatic due date reminders.',
    icon: 'repeat' as const,
  },
  {
    step: 8,
    title: 'Financial Insights & Reports 📊',
    desc: 'Unlock AI-driven insights that analyze spending habits and offer concrete tips to cut expenses and save more every month.',
    icon: 'bar-chart-2' as const,
  },
  {
    step: 9,
    title: 'You are all set! 🚀',
    desc: 'Your finances are now organized. Enjoy complete control, privacy, offline support, and multi-currency tracking.',
    icon: 'check-circle' as const,
  },
];

export const WalkthroughModal: React.FC = () => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasCompletedWalkthrough = useAppStore((state) => state.settings.hasCompletedWalkthrough);
  const completeWalkthrough = useAppStore((state) => state.completeWalkthrough);

  const [currentIndex, setCurrentIndex] = useState(0);

  if (hasCompletedWalkthrough) {
    return null;
  }

  const currentStep = WALKTHROUGH_STEPS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === WALKTHROUGH_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeWalkthrough();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    completeWalkthrough();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.backdrop,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderRadius: radius.xxl,
              padding: spacing.xl,
              maxWidth: Math.min(width - 32, 400),
              maxHeight: height * 0.9,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Top indicator & Skip */}
          <View style={styles.topRow}>
            <AppText variant="caption" color={colors.primary} weight="700">
              STEP {currentStep.step} OF {WALKTHROUGH_STEPS.length}
            </AppText>
            <TouchableOpacity onPress={handleSkip}>
              <AppText variant="caption" color={colors.textMuted} weight="600">
                Skip
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.primaryLight,
                borderRadius: radius.full,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Feather name={currentStep.icon} size={32} color={colors.primary} />
          </View>

          {/* Content */}
          <AppText
            variant="h3"
            align="center"
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
          >
            {currentStep.title}
          </AppText>
          <AppText
            variant="body2"
            color={colors.textSecondary}
            align="center"
            style={{ lineHeight: 22, marginBottom: spacing.xl }}
          >
            {currentStep.desc}
          </AppText>

          {/* Stepper Dots */}
          <View style={styles.dotsRow}>
            {WALKTHROUGH_STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentIndex ? colors.primary : colors.border,
                    width: idx === currentIndex ? 18 : 6,
                    borderRadius: radius.full,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={[styles.btnRow, { marginTop: spacing.xl }]}>
            {!isFirst && (
              <AppButton
                title="Back"
                variant="outline"
                size="md"
                onPress={handleBack}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
            )}
            <AppButton
              title={isLast ? 'Get Started' : 'Next'}
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: isFirst ? 1 : 2, marginLeft: !isFirst ? spacing.sm : 0 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    marginHorizontal: 3,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
