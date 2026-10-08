import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RecurringPayment } from '../../types';
import { AppText } from '../common/AppText';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export interface UpcomingPaymentCardProps {
  payment: RecurringPayment;
  onPayNow?: (payment: RecurringPayment) => void;
  onToggleActive?: (payment: RecurringPayment) => void;
}

export const UpcomingPaymentCard: React.FC<UpcomingPaymentCardProps> = ({
  payment,
  onPayNow,
  onToggleActive,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const getDueText = () => {
    const now = new Date();
    const due = new Date(payment.nextDueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
    if (diffDays <= 4) return { text: `Due in ${diffDays} days`, urgent: false };
    return { text: `Due on ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, urgent: false };
  };

  const dueInfo = getDueText();

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
      <View style={styles.leftCol}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: dueInfo.urgent ? colors.errorLight : colors.warningLight,
              borderRadius: radius.md,
            },
          ]}
        >
          <Feather
            name="calendar"
            size={16}
            color={dueInfo.urgent ? colors.error : colors.warning}
          />
        </View>
        <View style={{ marginLeft: spacing.sm }}>
          <AppText variant="subtitle2" weight="700">
            {payment.title}
          </AppText>
          <AppText
            variant="caption"
            color={dueInfo.urgent ? colors.error : colors.textSecondary}
            weight={dueInfo.urgent ? '700' : '400'}
          >
            {dueInfo.text} • {payment.frequency}
          </AppText>
        </View>
      </View>

      <View style={styles.rightCol}>
        <AppText variant="amountSmall" weight="700">
          {FinancialCalculationsService.formatCurrency(payment.amount, currencySymbol)}
        </AppText>
        {onPayNow && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPayNow(payment)}
            style={[
              styles.payBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.sm,
                marginTop: 4,
              },
            ]}
          >
            <AppText variant="caption" color={colors.primary} weight="600">
              Pay Now
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    marginBottom: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  payBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
