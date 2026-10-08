import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { CategoryIcon } from '../common/CategoryIcon';
import { ProgressBar } from '../common/ProgressBar';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';

export interface CategoryBreakdownProps {
  maxItems?: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ maxItems = 5 }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const transactions = useAppStore((state) => state.transactions);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const breakdowns = FinancialCalculationsService.calculateCategoryBreakdown(transactions).slice(0, maxItems);

  if (breakdowns.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.xxl,
          padding: spacing.lg,
          ...shadows.soft,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="subtitle1" weight="700">
          Spending by Category
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Top categories
        </AppText>
      </View>

      {/* Category List */}
      <View style={{ marginTop: spacing.md }}>
        {breakdowns.map((cat, index) => (
          <View key={cat.categoryId} style={[styles.catRow, index > 0 && { marginTop: spacing.md }]}>
            <View style={styles.topInfo}>
              <View style={styles.leftInfo}>
                <CategoryIcon
                  iconName="tag"
                  color={cat.categoryColor}
                  size={16}
                  containerSize={32}
                />
                <AppText variant="body2" weight="600" style={{ marginLeft: spacing.sm }}>
                  {cat.categoryName}
                </AppText>
              </View>
              <View style={styles.rightInfo}>
                <AppText variant="body2" weight="700">
                  {FinancialCalculationsService.formatCurrency(cat.amount, currencySymbol)}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 6 }}>
                  ({cat.percentage}%)
                </AppText>
              </View>
            </View>
            <ProgressBar
              progress={cat.percentage}
              color={cat.categoryColor}
              height={6}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catRow: {
    width: '100%',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
