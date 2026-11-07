import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { useAppStore } from '../../store/useAppStore';
import { IntegrityAuditReport } from '../../services/dataIntegrityService';
import { Feather } from '@expo/vector-icons';

export interface DataIntegrityModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenReconcile?: () => void;
}

export const DataIntegrityModal: React.FC<DataIntegrityModalProps> = ({
  visible,
  onClose,
  onOpenReconcile,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const auditDataIntegrity = useAppStore((state) => state.auditDataIntegrity);
  const repairOrphans = useAppStore((state) => state.repairOrphans);

  const [report, setReport] = useState<IntegrityAuditReport | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccessMessage, setRepairSuccessMessage] = useState('');

  const runAudit = useCallback(() => {
    const rep = auditDataIntegrity();
    setReport(rep);
  }, [auditDataIntegrity]);

  useEffect(() => {
    if (visible) {
      setRepairSuccessMessage('');
      runAudit();
    }
  }, [visible, runAudit]);

  const handleRepair = async () => {
    try {
      setIsRepairing(true);
      setRepairSuccessMessage('');
      const fixedCount = await repairOrphans();
      runAudit();
      setRepairSuccessMessage(
        fixedCount > 0
          ? `Successfully repaired ${fixedCount} orphaned reference${fixedCount > 1 ? 's' : ''}.`
          : 'All references verified. No repairs needed.'
      );
    } catch (e: any) {
      setRepairSuccessMessage(`Repair error: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: height * 0.9,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md,
            },
            shadows.medium,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                Data Integrity Tools
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Audit and heal orphaned records & ledger inconsistencies
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {report && (
              <>
                {/* Health Status Banner */}
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor: report.isHealthy ? colors.success + '15' : colors.warning + '15',
                      borderColor: report.isHealthy ? colors.success : colors.warning,
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  <View style={styles.statusHeader}>
                    <Feather
                      name={report.isHealthy ? 'shield' : 'alert-triangle'}
                      size={24}
                      color={report.isHealthy ? colors.success : colors.warning}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <AppText
                        variant="body1"
                        weight="bold"
                        color={report.isHealthy ? colors.success : colors.warning}
                      >
                        {report.isHealthy
                          ? 'Ledger Health: Optimal'
                          : `Integrity Alert: ${report.issuesCount} Issue${report.issuesCount > 1 ? 's' : ''} Found`}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {report.isHealthy
                          ? 'All transactions, budgets, goals, and recurring items have valid parent references.'
                          : 'Some entities reference deleted categories or accounts. Run repair to safely link them.'}
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* Repair Success Notification */}
                {repairSuccessMessage ? (
                  <View
                    style={[
                      styles.repairNotice,
                      {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Feather name="check" size={16} color={colors.primary} />
                    <AppText
                      variant="caption"
                      weight="semibold"
                      color={colors.primary}
                      style={{ marginLeft: 6 }}
                    >
                      {repairSuccessMessage}
                    </AppText>
                  </View>
                ) : null}

                {/* Audit Summary Grid */}
                <View style={styles.grid}>
                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
                      Transactions
                    </AppText>
                    <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                      {report.summary.totalTransactions}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
                      Accounts
                    </AppText>
                    <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                      {report.summary.totalAccounts}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
                      Budgets
                    </AppText>
                    <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                      {report.summary.totalBudgets}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.statBox,
                      { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
                      Orphaned
                    </AppText>
                    <AppText
                      variant="h3"
                      weight="bold"
                      color={report.summary.orphanedCount > 0 ? colors.error : colors.success}
                    >
                      {report.summary.orphanedCount}
                    </AppText>
                  </View>
                </View>

                {/* Issues List */}
                {report.issues.length > 0 && (
                  <View style={styles.section}>
                    <AppText variant="subtitle1" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
                      Detected Issues ({report.issues.length})
                    </AppText>
                    {report.issues.map((issue) => (
                      <View
                        key={issue.id}
                        style={[
                          styles.issueCard,
                          {
                            backgroundColor: colors.background,
                            borderRadius: radius.md,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.issueTop}>
                          <View
                            style={[
                              styles.severityBadge,
                              {
                                backgroundColor:
                                  issue.severity === 'high'
                                    ? colors.error + '20'
                                    : issue.severity === 'medium'
                                    ? colors.warning + '20'
                                    : colors.primary + '20',
                              },
                            ]}
                          >
                            <AppText
                              variant="caption"
                              weight="bold"
                              color={
                                issue.severity === 'high'
                                  ? colors.error
                                  : issue.severity === 'medium'
                                  ? colors.warning
                                  : colors.primary
                              }
                            >
                              {issue.severity.toUpperCase()}
                            </AppText>
                          </View>
                          <AppText
                            variant="body1"
                            weight="semibold"
                            color={colors.textPrimary}
                            style={{ flex: 1, marginLeft: 8 }}
                          >
                            {issue.title}
                          </AppText>
                        </View>
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                          {issue.description}
                        </AppText>
                        <View style={styles.suggestedAction}>
                          <Feather name="corner-down-right" size={14} color={colors.primary} />
                          <AppText
                            variant="caption"
                            weight="medium"
                            color={colors.primary}
                            style={{ marginLeft: 4 }}
                          >
                            {issue.suggestedAction}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionButtons}>
                  {!report.isHealthy && (
                    <AppButton
                      title="Run One-Tap Repair"
                      onPress={handleRepair}
                      loading={isRepairing}
                      style={{ marginBottom: 10 }}
                    />
                  )}

                  {onOpenReconcile && (
                    <AppButton
                      title="Reconcile Account Balances"
                      onPress={() => {
                        onClose();
                        onOpenReconcile();
                      }}
                      variant="secondary"
                      style={{ marginBottom: 10 }}
                    />
                  )}

                  <AppButton
                    title="Re-run Diagnostic Scan"
                    onPress={runAudit}
                    variant="ghost"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  statusBanner: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repairNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  issueCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  issueTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  suggestedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  actionButtons: {
    marginTop: 8,
  },
});
