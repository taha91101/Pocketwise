import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { FinancialInsight } from '../../types';
import { AppText } from '../common/AppText';
import { Feather } from '@expo/vector-icons';

export interface FinancialInsightCardProps {
  insight: FinancialInsight;
  onPress?: (insight: FinancialInsight) => void;
}

export const FinancialInsightCard: React.FC<FinancialInsightCardProps> = ({ insight, onPress }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const hasFilterAction = Boolean(insight.filterCriteria && onPress);

  const CardWrapper = hasFilterAction ? TouchableOpacity : View;

  return (
    <CardWrapper
      activeOpacity={0.7}
      onPress={hasFilterAction ? () => onPress?.(insight) : undefined}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: spacing.md,
          ...shadows.soft,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: `${insight.color}15`,
              borderRadius: radius.md,
            },
          ]}
        >
          <Feather name="zap" size={18} color={insight.color || colors.primary} />
        </View>
        <View style={[styles.textCol, { marginLeft: spacing.md }]}>
          <AppText variant="subtitle2" weight="700">
            {insight.title}
          </AppText>
          <AppText
            variant="body2"
            color={colors.textSecondary}
            style={{ marginTop: 2 }}
          >
            {insight.description}
          </AppText>

          {hasFilterAction && (
            <View style={styles.actionPill}>
              <AppText variant="caption" color={colors.primary} weight="700">
                View transactions
              </AppText>
              <Feather name="arrow-right" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
          )}
        </View>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
});
