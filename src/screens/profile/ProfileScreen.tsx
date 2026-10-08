import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { CURRENCY_OPTIONS } from '../../constants/paymentMethods';
import { ExportImportService } from '../../services/exportImportService';
import { Feather } from '@expo/vector-icons';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetToDefaults = useAppStore((state) => state.resetToDefaults);
  const restartWalkthrough = useAppStore((state) => state.restartWalkthrough);
  const transactions = useAppStore((state) => state.transactions);
  const accounts = useAppStore((state) => state.accounts);
  const budgets = useAppStore((state) => state.budgets);
  const savingsGoals = useAppStore((state) => state.savingsGoals);
  const recurringPayments = useAppStore((state) => state.recurringPayments);
  const importData = useAppStore((state) => state.importData);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportTitle, setExportTitle] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');

  // Currency modal
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const handleExportJSON = () => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      budgets,
      savingsGoals,
      recurringPayments,
      settings,
    };
    const jsonStr = ExportImportService.exportToJSON(data);
    setExportTitle('JSON Data Backup');
    setExportContent(jsonStr);
    setIsExportModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvStr = ExportImportService.exportTransactionsToCSV(transactions);
    setExportTitle('Transactions CSV Export');
    setExportContent(csvStr);
    setIsExportModalOpen(true);
  };

  const handleProcessImport = async () => {
    setImportError('');
    const { isValid, data, error } = ExportImportService.validateAndParseImportJSON(importJsonText);
    if (!isValid || !data) {
      setImportError(error || 'Invalid JSON format');
      return;
    }

    const success = await importData(data);
    if (success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      Alert.alert('Import Success', 'Your financial data has been imported and synchronized.');
    } else {
      setImportError('Failed to import backup data');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <AppText variant="h2" weight="800">
          Settings & Profile
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          Preferences, security, and data backup
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.userRow}>
            <View
              style={[
                styles.userAvatar,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: radius.full,
                },
              ]}
            >
              <AppText variant="h2" color={colors.primary} weight="800">
                {(settings.userName || 'A').charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <AppText variant="h3" weight="700">
                {settings.userName || 'User'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Income: {settings.monthlyIncomeRange} • Target: {settings.preferredSavingTarget}%
              </AppText>
              <AppText variant="caption" color={colors.primary} weight="700" style={{ marginTop: 2 }}>
                🎯 {settings.mainSavingsGoal}
              </AppText>
            </View>
          </View>
        </View>

        {/* Section: Appearance */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
          APPEARANCE & THEME
        </AppText>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.soft,
            },
          ]}
        >
          <View style={[styles.groupRow, { padding: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Theme
              </AppText>
            </View>
            <View style={styles.themeToggleRow}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const isSelected = settings.themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => updateSettings({ themeMode: mode })}
                    style={[
                      styles.themeBtn,
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                      weight={isSelected ? '700' : '500'}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section: Currency */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          CURRENCY & REGION
        </AppText>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.soft,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setIsCurrencyModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="dollar-sign" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Primary Currency
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText variant="subtitle2" color={colors.primary} weight="700">
                {settings.currencySymbol} ({settings.currency})
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Notifications */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          SMART NOTIFICATIONS
        </AppText>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.soft,
            },
          ]}
        >
          <NotificationSwitchRow
            label="Budget Limit Alerts"
            icon="alert-circle"
            value={settings.notifications.budgetWarnings}
            onValueChange={(val) =>
              updateSettings({
                notifications: { ...settings.notifications, budgetWarnings: val },
              })
            }
          />
          <NotificationSwitchRow
            label="Recurring Bill Reminders"
            icon="repeat"
            value={settings.notifications.recurringPayments}
            onValueChange={(val) =>
              updateSettings({
                notifications: { ...settings.notifications, recurringPayments: val },
              })
            }
          />
          <NotificationSwitchRow
            label="Savings Goal Milestones"
            icon="target"
            value={settings.notifications.goalMilestones}
            onValueChange={(val) =>
              updateSettings({
                notifications: { ...settings.notifications, goalMilestones: val },
              })
            }
            isLast
          />
        </View>

        {/* Section: Walkthrough & Help */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          LEARNING & GUIDANCE
        </AppText>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.soft,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => restartWalkthrough()}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="compass" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Restart App Walkthrough
              </AppText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Data Backup & Export */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          DATA & PRIVACY
        </AppText>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadows.soft,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleExportJSON}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="download" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Export Full Backup (JSON)
              </AppText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="file-text" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Export Transactions (CSV)
              </AppText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsImportModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="upload" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Import / Restore Backup (JSON)
              </AppText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Danger Zone */}
        <View style={{ marginTop: spacing.xl }}>
          <AppButton
            title="Reset All Data to Factory Defaults"
            variant="danger"
            iconName="trash-2"
            onPress={() => setIsResetConfirmOpen(true)}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={isCurrencyModalOpen} animationType="slide" transparent>
        <View
          style={[
            styles.modalBackdrop,
            {
              backgroundColor: colors.backdrop,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderRadius: radius.xxl,
                padding: spacing.lg,
                maxWidth: Math.min(width - 32, 420),
                maxHeight: height * 0.85,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                Select Currency
              </AppText>
              <TouchableOpacity onPress={() => setIsCurrencyModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: height * 0.6 }}>
              {CURRENCY_OPTIONS.map((curr) => {
                const isSelected = settings.currency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => {
                      updateSettings({
                        currency: curr.code,
                        currencySymbol: curr.symbol,
                      });
                      setIsCurrencyModalOpen(false);
                    }}
                    style={[
                      styles.currencyRow,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                        borderRadius: radius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <AppText
                      variant="body2"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      {curr.name}
                    </AppText>
                    {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Export Preview Modal */}
      <Modal visible={isExportModalOpen} animationType="slide" transparent>
        <View
          style={[
            styles.modalBackdrop,
            {
              backgroundColor: colors.backdrop,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderRadius: radius.xxl,
                padding: spacing.lg,
                maxWidth: Math.min(width - 32, 420),
                maxHeight: height * 0.85,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                {exportTitle}
              </AppText>
              <TouchableOpacity onPress={() => setIsExportModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.exportBox, { backgroundColor: colors.surfaceVariant, borderRadius: radius.md, padding: spacing.sm, maxHeight: height * 0.5 }]}>
              <AppText variant="caption" style={{ fontFamily: 'monospace' }}>
                {exportContent}
              </AppText>
            </ScrollView>

            <View style={{ marginTop: spacing.md }}>
              <AppButton
                title="Close"
                variant="primary"
                onPress={() => setIsExportModalOpen(false)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={isImportModalOpen} animationType="slide" transparent>
        <View
          style={[
            styles.modalBackdrop,
            {
              backgroundColor: colors.backdrop,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderRadius: radius.xxl,
                padding: spacing.lg,
                maxWidth: Math.min(width - 32, 420),
                maxHeight: height * 0.85,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                Import JSON Backup
              </AppText>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <AppInput
              label="Paste Backup JSON"
              placeholder='{"transactions": [...], "accounts": [...]}'
              value={importJsonText}
              onChangeText={setImportJsonText}
              multiline
              numberOfLines={6}
              style={{ height: 120, textAlignVertical: 'top' }}
            />

            {importError ? (
              <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.sm }}>
                {importError}
              </AppText>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setIsImportModalOpen(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AppButton
                title="Restore Data"
                variant="primary"
                onPress={handleProcessImport}
                style={{ flex: 2, marginLeft: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation */}
      <ConfirmDialog
        visible={isResetConfirmOpen}
        title="Reset All Data?"
        message="This will permanently erase all your accounts, transactions, and budgets, resetting PocketWise to a completely clean state."
        confirmText="Reset Everything"
        isDestructive
        onConfirm={async () => {
          await resetToDefaults();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </SafeAreaView>
  );
};

interface NotificationSwitchRowProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: boolean;
  onValueChange: (val: boolean) => void;
  isLast?: boolean;
}

const NotificationSwitchRow: React.FC<NotificationSwitchRowProps> = ({
  label,
  icon,
  value,
  onValueChange,
  isLast,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.groupRow,
        { padding: spacing.md },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name={icon} size={18} color={colors.primary} style={{ marginRight: 10 }} />
        <AppText variant="body2" weight="600">
          {label}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  userCard: {
    width: '100%',
    borderWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsGroup: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleRow: {
    flexDirection: 'row',
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exportBox: {
    width: '100%',
  },
});
