import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { FinancialInsight } from '../../types';
import { AppText } from '../common/AppText';
import { Feather } from '@expo/vector-icons';

export interface FinancialInsightCardProps {
  insight: FinancialInsight;
}

export const FinancialInsightCard: React.FC<FinancialInsightCardProps> = ({ insight }) => {
  const { colors, radius, spacing, shadows } = useTheme();

  return (
    <View
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
        </View>
      </View>
    </View>
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
});
