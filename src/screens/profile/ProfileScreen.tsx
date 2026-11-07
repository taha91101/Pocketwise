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
import { ExportImportService, AppExportData } from '../../services/exportImportService';
import { EncryptedBackupService } from '../../services/encryptedBackupService';
import { Feather } from '@expo/vector-icons';
import { SetPinModal, PinModalMode } from '../../components/modals/SetPinModal';
import { SecurityService } from '../../services/securityService';
import { ManageCategoriesModal } from '../../components/modals/ManageCategoriesModal';
import { DataIntegrityModal } from '../../components/modals/DataIntegrityModal';
import { AccountReconciliationModal } from '../../components/modals/AccountReconciliationModal';
import { PrivacyPolicyModal } from '../../components/modals/PrivacyPolicyModal';

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
  const isSQLiteMigrated = useAppStore((state) => state.isSQLiteMigrated);
  const runSQLiteMigration = useAppStore((state) => state.runSQLiteMigration);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportTitle, setExportTitle] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');

  // Encrypted Backup
  const [isEncryptedBackupModalOpen, setIsEncryptedBackupModalOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
  const [backupError, setBackupError] = useState('');
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // SQLite Migration
  const [isMigratingSQLite, setIsMigratingSQLite] = useState(false);
  const [migrationStatusNotice, setMigrationStatusNotice] = useState('');

  // Data Integrity & Reconciliation
  const [isDataIntegrityModalOpen, setIsDataIntegrityModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Currency & Region modals
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isNumberFormatModalOpen, setIsNumberFormatModalOpen] = useState(false);
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);

  // Categories modal
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // App Lock & Security
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('setup');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      const { hasHardware, isEnrolled } = await SecurityService.isBiometricAvailable();
      if (isMounted) {
        setIsBiometricSupported(hasHardware && isEnrolled);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

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
    try {
      const res = await EncryptedBackupService.parseAndRestoreBackup(
        importJsonText,
        importPassword.trim() || undefined
      );

      if (!res.isValid || !res.data) {
        setImportError(res.error || 'Failed to parse backup archive');
        return;
      }

      const success = await importData(res.data);
      if (success) {
        setIsImportModalOpen(false);
        setImportJsonText('');
        setImportPassword('');
        Alert.alert('Import Success', 'Your financial data has been imported and synchronized.');
      } else {
        setImportError('Failed to import backup data');
      }
    } catch (err: any) {
      setImportError(err?.message || 'Restore error');
    }
  };

  const handlePerformEncryptedBackup = async () => {
    setBackupError('');
    if (backupPassword && backupPassword !== confirmBackupPassword) {
      setBackupError('Passwords do not match');
      return;
    }

    try {
      setIsExportingBackup(true);
      const fullExportData: AppExportData = {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        transactions,
        accounts,
        budgets,
        savingsGoals,
        recurringPayments,
        categories: useAppStore.getState().categories,
        settings,
        liabilities: useAppStore.getState().liabilities,
        sharedExpenses: useAppStore.getState().sharedExpenses,
      };

      await EncryptedBackupService.createAndShareEncryptedBackup(
        fullExportData,
        backupPassword.trim() || undefined
      );

      setIsEncryptedBackupModalOpen(false);
      setBackupPassword('');
      setConfirmBackupPassword('');
    } catch (err: any) {
      setBackupError(err?.message || 'Failed to create backup archive');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRunSQLiteMigration = async () => {
    try {
      setIsMigratingSQLite(true);
      setMigrationStatusNotice('');
      const res = await runSQLiteMigration();
      if (res.success) {
        setMigrationStatusNotice(
          `SQLite indexed successfully! ${res.transactionsMigrated} transactions & ${res.detectedMigrated} detected records in ${res.durationMs}ms.`
        );
      } else {
        setMigrationStatusNotice(`Migration failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setMigrationStatusNotice(`Error: ${e?.message || 'Migration failed'}`);
    } finally {
      setIsMigratingSQLite(false);
    }
  };

  const handlePinLockPress = () => {
    if (!settings.securityEnabled) {
      setPinModalMode('setup');
      setIsPinModalOpen(true);
    } else {
      Alert.alert(
        'PIN Lock Settings',
        'Your application is protected with a secure PIN.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change PIN',
            onPress: () => {
              setPinModalMode('change');
              setIsPinModalOpen(true);
            },
          },
          {
            text: 'Disable PIN Lock',
            style: 'destructive',
            onPress: () => {
              setPinModalMode('disable');
              setIsPinModalOpen(true);
            },
          },
        ]
      );
    }
  };

  const handleTimeoutPress = () => {
    Alert.alert(
      'Auto-Lock Timeout',
      'Select how quickly PocketWise locks after moving to background:',
      [
        { text: 'Immediately', onPress: () => updateSettings({ lockTimeout: 'immediate' }) },
        { text: 'After 1 Minute', onPress: () => updateSettings({ lockTimeout: '1min' }) },
        { text: 'After 5 Minutes', onPress: () => updateSettings({ lockTimeout: '5min' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

        {/* Section: Categories & Currency */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          CATEGORIES & REGION
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
            onPress={() => setIsCategoriesModalOpen(true)}
            style={[
              styles.groupRow,
              { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="grid" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View>
                <AppText variant="body2" weight="600">
                  Manage Categories
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Create, customize icons & color badges
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsCurrencyModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
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

          <TouchableOpacity
            onPress={() => setIsLanguageModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="globe" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Language
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText variant="subtitle2" color={colors.primary} weight="700">
                {settings.language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsNumberFormatModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="hash" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <AppText variant="body2" weight="600">
                Number Grouping
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText variant="subtitle2" color={colors.primary} weight="700">
                {settings.numberGrouping === 'millions' ? '100,000 (Millions)' : '1,00,000 (Lakhs)'}
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Automatic UPI Expense Detection */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          AUTOMATIC EXPENSE TRACKING
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
            onPress={() => navigation.navigate('AutomaticDetectionSettings')}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Feather name="zap" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="700">
                  Automatic UPI Detection
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Google Pay, PhonePe, Paytm & Banks
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText
                variant="caption"
                color={settings.notifications.automaticExpenseDetection !== false ? colors.success : colors.textMuted}
                weight="700"
              >
                {settings.notifications.automaticExpenseDetection !== false ? 'ON' : 'OFF'}
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
          />
          <NotificationSwitchRow
            label="Hide Amounts in Notifications"
            icon="eye-off"
            value={settings.notifications.hideAmountsInNotifications ?? true}
            onValueChange={(val) =>
              updateSettings({
                notifications: { ...settings.notifications, hideAmountsInNotifications: val },
              })
            }
            isLast
          />
        </View>

        {/* Section: App Security & Lock */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          APP SECURITY & PRIVACY
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
            onPress={handlePinLockPress}
            style={[
              styles.groupRow,
              {
                padding: spacing.md,
                borderBottomWidth: settings.securityEnabled ? 1 : 0,
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="shield" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Passcode / PIN Lock
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {settings.securityEnabled ? 'Active (Salted SHA-256)' : 'Protect financial records with a 4-digit PIN'}
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText
                variant="subtitle2"
                color={settings.securityEnabled ? colors.success : colors.textMuted}
                weight="700"
              >
                {settings.securityEnabled ? 'ON' : 'OFF'}
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>

          {settings.securityEnabled && isBiometricSupported && (
            <View
              style={[
                styles.groupRow,
                { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Feather name="command" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="body2" weight="600">
                    Biometric Unlock
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                    Fingerprint or Face ID
                  </AppText>
                </View>
              </View>
              <Switch
                value={settings.biometricEnabled || false}
                onValueChange={(val) => updateSettings({ biometricEnabled: val })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

          {settings.securityEnabled && (
            <TouchableOpacity
              onPress={handleTimeoutPress}
              style={[styles.groupRow, { padding: spacing.md }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Feather name="clock" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="body2" weight="600">
                    Auto-Lock Timeout
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                    When app goes to background
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="subtitle2" color={colors.primary} weight="700">
                  {settings.lockTimeout === '5min' ? '5 Minutes' : settings.lockTimeout === '1min' ? '1 Minute' : 'Immediately'}
                </AppText>
                <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          )}
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

        {/* Section: Storage & Database Engine (Phase 4) */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          STORAGE & DATABASE ENGINE
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
          <View
            style={[
              styles.groupRow,
              { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="database" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Storage Architecture
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {isSQLiteMigrated
                    ? 'SQLite Indexed Tables (High-Speed & Scalable)'
                    : 'AsyncStorage (Key-Value Document Store)'}
                </AppText>
              </View>
            </View>
            <View
              style={{
                backgroundColor: isSQLiteMigrated ? colors.success + '20' : colors.warning + '20',
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 6,
              }}
            >
              <AppText
                variant="caption"
                weight="700"
                color={isSQLiteMigrated ? colors.success : colors.warning}
              >
                {isSQLiteMigrated ? 'SQLITE ACTIVE' : 'PENDING'}
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.groupRow,
              { padding: spacing.md, borderBottomWidth: !isSQLiteMigrated ? 1 : 0, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="layers" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Indexed Records
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {transactions.length} transactions, {accounts.length} accounts, {budgets.length} budgets
                </AppText>
              </View>
            </View>
          </View>

          {!isSQLiteMigrated && (
            <View style={{ padding: spacing.md }}>
              <AppButton
                title="Migrate Storage to Indexed SQLite"
                variant="primary"
                iconName="cpu"
                size="sm"
                loading={isMigratingSQLite}
                onPress={handleRunSQLiteMigration}
                fullWidth
              />
            </View>
          )}

          {migrationStatusNotice ? (
            <View style={{ padding: spacing.md, backgroundColor: colors.background }}>
              <AppText variant="caption" color={colors.primary} weight="medium">
                {migrationStatusNotice}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Section: Data Backup & Integrity */}
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
            onPress={() => setIsEncryptedBackupModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="lock" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Encrypted Full Backup (AES-256)
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Password-protected export with one-tap file sharing
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportJSON}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="code" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  View Raw JSON Payload
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Inspect full unencrypted JSON backup text
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="file-text" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Export Transactions (CSV)
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Spreadsheet compatible format
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsImportModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="upload" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Import / Restore Backup
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Restore encrypted (.pwbackup) or plain JSON backups
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsDataIntegrityModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="check-square" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Data Integrity & Audit Tools
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Audit orphaned categories, accounts, and run one-tap repair
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsReconcileModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="sliders" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Account Reconciliation
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Reconcile balances against bank statements
                </AppText>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPrivacyPolicyModalOpen(true)}
            style={[styles.groupRow, { padding: spacing.md }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Feather name="shield" size={18} color={colors.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body2" weight="600">
                  Privacy Policy & Data Safety
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Zero cloud storage, on-device parsing disclosure
                </AppText>
              </View>
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

      {/* Language Modal */}
      <Modal visible={isLanguageModalOpen} animationType="slide" transparent>
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
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                Select Language
              </AppText>
              <TouchableOpacity onPress={() => setIsLanguageModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {[
              { code: 'en', label: 'English', sub: 'Default interface language' },
              { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'भारतीय भाषा समर्थन' },
            ].map((lang) => {
              const isSelected = (settings.language || 'en') === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    updateSettings({ language: lang.code as any });
                    setIsLanguageModalOpen(false);
                  }}
                  style={[
                    styles.currencyRow,
                    {
                      backgroundColor: isSelected ? colors.primaryLight + '20' : 'transparent',
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.xs,
                    },
                  ]}
                >
                  <View>
                    <AppText
                      variant="body2"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      {lang.label}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {lang.sub}
                    </AppText>
                  </View>
                  {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Number Grouping Format Modal */}
      <Modal visible={isNumberFormatModalOpen} animationType="slide" transparent>
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
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                Number Grouping System
              </AppText>
              <TouchableOpacity onPress={() => setIsNumberFormatModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {[
              { code: 'lakhs', label: 'Indian System (Lakhs & Crores)', example: '₹1,50,000 / ₹1,25,00,000' },
              { code: 'millions', label: 'International System (Millions)', example: '$150,000 / $12,500,000' },
            ].map((fmt) => {
              const isSelected = (settings.numberGrouping || 'lakhs') === fmt.code;
              return (
                <TouchableOpacity
                  key={fmt.code}
                  onPress={() => {
                    updateSettings({ numberGrouping: fmt.code as any });
                    setIsNumberFormatModalOpen(false);
                  }}
                  style={[
                    styles.currencyRow,
                    {
                      backgroundColor: isSelected ? colors.primaryLight + '20' : 'transparent',
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.xs,
                    },
                  ]}
                >
                  <View>
                    <AppText
                      variant="body2"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? colors.primary : colors.textPrimary}
                    >
                      {fmt.label}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Example: {fmt.example}
                    </AppText>
                  </View>
                  {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
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

            {exportTitle.includes('CSV') && (
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
                Note: Local receipt and bill photo attachments are on-device only and excluded from CSV export.
              </AppText>
            )}

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

      {/* Encrypted Backup Modal */}
      <Modal visible={isEncryptedBackupModalOpen} animationType="slide" transparent>
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
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="h3" weight="700">
                  Encrypted Backup
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  AES-GCM-256 with PBKDF2 key derivation
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setIsEncryptedBackupModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
              Set a password to protect your financial records. If left blank, a standard unencrypted backup will be created.
            </AppText>

            <AppInput
              label="Backup Password (Optional)"
              placeholder="Enter strong password"
              value={backupPassword}
              onChangeText={setBackupPassword}
              secureTextEntry
              style={{ marginBottom: spacing.sm }}
            />

            {backupPassword ? (
              <AppInput
                label="Confirm Backup Password"
                placeholder="Re-enter password"
                value={confirmBackupPassword}
                onChangeText={setConfirmBackupPassword}
                secureTextEntry
                style={{ marginBottom: spacing.sm }}
              />
            ) : null}

            {backupError ? (
              <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.sm }}>
                {backupError}
              </AppText>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setIsEncryptedBackupModalOpen(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AppButton
                title="Save & Share"
                variant="primary"
                loading={isExportingBackup}
                onPress={handlePerformEncryptedBackup}
                style={{ flex: 2, marginLeft: spacing.sm }}
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
                Import / Restore Backup
              </AppText>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <AppInput
              label="Paste Backup JSON / Archive"
              placeholder='{"transactions": [...], "accounts": [...]}'
              value={importJsonText}
              onChangeText={setImportJsonText}
              multiline
              numberOfLines={5}
              style={{ height: 110, textAlignVertical: 'top' }}
            />

            <AppInput
              label="Archive Password (If Encrypted)"
              placeholder="Leave blank for unencrypted backups"
              value={importPassword}
              onChangeText={setImportPassword}
              secureTextEntry
              style={{ marginTop: spacing.sm }}
            />

            {importError ? (
              <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
                {importError}
              </AppText>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
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

      {/* Set / Change / Disable PIN Modal */}
      <SetPinModal
        visible={isPinModalOpen}
        mode={pinModalMode}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        visible={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      {/* Data Integrity Tools Modal (F4.4) */}
      <DataIntegrityModal
        visible={isDataIntegrityModalOpen}
        onClose={() => setIsDataIntegrityModalOpen(false)}
        onOpenReconcile={() => setIsReconcileModalOpen(true)}
      />

      {/* Account Reconciliation Modal (F4.4) */}
      <AccountReconciliationModal
        visible={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
      />

      {/* Privacy Policy & Data Safety Modal (F5.4) */}
      <PrivacyPolicyModal
        visible={isPrivacyPolicyModalOpen}
        onClose={() => setIsPrivacyPolicyModalOpen(false)}
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
