import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { ReviewDetectedTransactionModal } from '../modals/ReviewDetectedTransactionModal';
import { DetectedTransaction } from '../../types';

export const PendingDetectedTransactionsBanner: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const detectedTransactions = useAppStore((state) => state.detectedTransactions);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const pendingList = detectedTransactions.filter((d) => d.status === 'DETECTED');
  const [selectedTx, setSelectedTx] = useState<DetectedTransaction | null>(null);

  if (pendingList.length === 0) return null;

  const latest = pendingList[0];

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedTx(latest)}
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.primary,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
            ...shadows.soft,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeLeft}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primary, borderRadius: radius.full },
              ]}
            >
              <Feather name="zap" size={14} color="#FFF" />
            </View>
            <AppText variant="caption" color={colors.primary} weight="800" style={{ marginLeft: 6 }}>
              {pendingList.length === 1 ? 'NEW PAYMENT DETECTED' : `${pendingList.length} PAYMENTS DETECTED`}
            </AppText>
          </View>

          <View style={[styles.reviewBtn, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
            <AppText variant="caption" color="#FFF" weight="700">
              Review
            </AppText>
            <Feather name="chevron-right" size={12} color="#FFF" style={{ marginLeft: 2 }} />
          </View>
        </View>

        <View style={[styles.bottomRow, { marginTop: spacing.xs }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle2" weight="700" numberOfLines={1}>
              {latest.merchant}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
              {latest.suggestedCategory} • {latest.paymentProvider}
            </AppText>
          </View>

          <AppText variant="amountSmall" color={colors.textPrimary} weight="800">
            {FinancialCalculationsService.formatCurrency(latest.amount, currencySymbol)}
          </AppText>
        </View>
      </TouchableOpacity>

      <ReviewDetectedTransactionModal
        visible={!!selectedTx}
        detectedTransaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
