import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { useAppStore } from '../../store/useAppStore';
import { UPIDetectionService, DEFAULT_SUPPORTED_APPS } from '../../services/upiDetectionService';
import { Feather } from '@expo/vector-icons';
import { SupportedPaymentApp } from '../../types';
import { ManageLearnedRulesModal } from '../../components/modals/ManageLearnedRulesModal';

export interface AutomaticDetectionSettingsScreenProps {
  navigation: any;
}

export const AutomaticDetectionSettingsScreen: React.FC<AutomaticDetectionSettingsScreenProps> = ({
  navigation,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const accounts = useAppStore((state) => state.accounts);
  const learnedRules = useAppStore((state) => state.learnedMerchantRules);
  const diagnostics = useAppStore((state) => state.detectionDiagnostics);
  const isNotificationAccessGranted = useAppStore((state) => state.isNotificationAccessGranted);
  const checkNotificationAccessStatus = useAppStore((state) => state.checkNotificationAccessStatus);
  const processIncomingDetectedTransaction = useAppStore(
    (state) => state.processIncomingDetectedTransaction
  );

  const [supportedApps, setSupportedApps] = useState<SupportedPaymentApp[]>(DEFAULT_SUPPORTED_APPS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showOemGuide, setShowOemGuide] = useState(false);
  const [isLearnedRulesVisible, setIsLearnedRulesVisible] = useState(false);
  const [selectedOemBrand, setSelectedOemBrand] = useState<'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'oneplus'>('xiaomi');

  const providerAccountMappings = settings.providerAccountMappings || {};

  const handleSetAccountMapping = async (provider: string, accountId: string) => {
    const updated = {
      ...providerAccountMappings,
      [provider]: accountId,
    };
    await updateSettings({ providerAccountMappings: updated });
  };

  const notificationsSettings = settings.notifications;
  const isDetectionEnabled = notificationsSettings.automaticExpenseDetection !== false;
  const isAutoConfirm = notificationsSettings.autoConfirmHighConfidence !== false;
  const isRefunds = notificationsSettings.detectRefunds !== false;
  const isBankEnabled = notificationsSettings.detectBankNotifications !== false;

  useEffect(() => {
    checkNotificationAccessStatus();
    UPIDetectionService.getSupportedPaymentApps().then(setSupportedApps);
  }, [checkNotificationAccessStatus]);

  const handleToggleDetection = async (value: boolean) => {
    await UPIDetectionService.setDetectionEnabled(value);
    await updateSettings({
      notifications: {
        ...notificationsSettings,
        automaticExpenseDetection: value,
      },
    });
  };

  const handleToggleAutoConfirm = async (value: boolean) => {
    await UPIDetectionService.setAutoConfirmEnabled(value);
    await updateSettings({
      notifications: {
        ...notificationsSettings,
        autoConfirmHighConfidence: value,
      },
    });
  };

  const handleToggleRefunds = async (value: boolean) => {
    await updateSettings({
      notifications: {
        ...notificationsSettings,
        detectRefunds: value,
      },
    });
  };

  const handleToggleBank = async (value: boolean) => {
    await updateSettings({
      notifications: {
        ...notificationsSettings,
        detectBankNotifications: value,
      },
    });
  };

  const handleOpenSettings = async () => {
    const success = await UPIDetectionService.openNotificationAccessSettings();
    if (!success && Platform.OS !== 'android') {
      Alert.alert(
        'Platform Note',
        'Notification Listener Service is an Android-native capability. It is not supported on this platform.'
      );
    }
  };

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true);
      const testNotification = {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid ₹450 to Starbucks',
        text: 'Paid to Starbucks. UPI Transaction ID: 4028' + Math.floor(10000000 + Math.random() * 90000000),
      };

      if (UPIDetectionService.isAvailable()) {
        const res = await UPIDetectionService.simulateNotification(
          testNotification.packageName,
          testNotification.title,
          testNotification.text
        );
        setIsSimulating(false);
        Alert.alert(
          'Simulation Successful',
          `Detected UPI payment: ${res.merchant} (₹${res.amount}) via ${res.paymentProvider}.\nConfidence: ${(res.detectionConfidence * 100).toFixed(0)}%.`
        );
      } else {
        // Fallback simulation in JS environment (e.g. during testing)
        const dummyDetected = {
          id: `sim-${Date.now()}`,
          amount: 450,
          type: 'expense' as const,
          merchant: 'Starbucks',
          suggestedCategory: 'Food & Dining',
          suggestedCategoryId: 'cat-food',
          paymentMethod: 'UPI',
          paymentProvider: 'Google Pay',
          sourcePackage: 'com.google.android.apps.nbu.paisa.user',
          upiReference: '4028' + Math.floor(10000000 + Math.random() * 90000000),
          transactionTimestamp: Date.now(),
          createdAt: Date.now(),
          isAutomaticallyDetected: true,
          detectionConfidence: 0.98,
          rawReferenceHash: `sim-hash-${Date.now()}`,
          status: 'DETECTED' as const,
          notes: 'Auto-detected via Google Pay',
        };
        await processIncomingDetectedTransaction(dummyDetected);
        setIsSimulating(false);
        Alert.alert(
          'Simulation Successful',
          'A simulated UPI transaction of ₹450 to Starbucks was processed!'
        );
      }
    } catch (e: any) {
      setIsSimulating(false);
      Alert.alert('Simulation Error', e.message || 'Failed to simulate test notification');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topNav, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="800">
          Automatic UPI Detection
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={[
            styles.privacyCard,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginTop: spacing.sm,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primary, borderRadius: radius.full },
              ]}
            >
              <Feather name="shield" size={16} color="#FFF" />
            </View>
            <AppText variant="subtitle2" weight="700" style={{ marginLeft: 8, flex: 1 }}>
              Privacy-First & On-Device
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 18 }}>
            PocketWise reads notifications solely on your device to record UPI expenses. No notifications or credentials leave your phone.
          </AppText>
        </View>

        {/* Master Toggle Card */}
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginTop: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <AppText variant="subtitle1" weight="700">
                Automatic Expense Detection
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Detect payments from Google Pay, PhonePe, Paytm, and banks
              </AppText>
            </View>
            <Switch
              value={isDetectionEnabled}
              onValueChange={handleToggleDetection}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Permission Status Card */}
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: isNotificationAccessGranted ? colors.border : colors.warning || '#F59E0B',
              borderWidth: isNotificationAccessGranted ? 1 : 1.5,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginTop: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle2" weight="700">
                Notification Access
              </AppText>
              <AppText
                variant="caption"
                color={isNotificationAccessGranted ? colors.success : colors.error}
                weight="700"
                style={{ marginTop: 2 }}
              >
                {isNotificationAccessGranted ? 'Connected ✓' : 'Permission Required ⚠️'}
              </AppText>
            </View>

            <AppButton
              title={isNotificationAccessGranted ? 'Manage Access' : 'Enable Access'}
              variant={isNotificationAccessGranted ? 'outline' : 'primary'}
              size="sm"
              onPress={handleOpenSettings}
            />
          </View>

          {!isNotificationAccessGranted && (
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 8 }}>
              Android requires special Notification Listener permission for PocketWise to read payment notifications.
            </AppText>
          )}
        </View>

        {/* Configuration Options */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          DETECTION PREFERENCES
        </AppText>
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <AppText variant="subtitle2" weight="600">
                Auto-Add High Confidence Payments
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Automatically record transactions when payee and amount are 90%+ confident
              </AppText>
            </View>
            <Switch
              value={isAutoConfirm}
              onValueChange={handleToggleAutoConfirm}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <AppText variant="subtitle2" weight="600">
                Detect Refunds
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Record refund notifications as positive income transactions
              </AppText>
            </View>
            <Switch
              value={isRefunds}
              onValueChange={handleToggleRefunds}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <AppText variant="subtitle2" weight="600">
                Detect Bank UPI Notifications
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Parse debit notifications from supported Indian banking apps
              </AppText>
            </View>
            <Switch
              value={isBankEnabled}
              onValueChange={handleToggleBank}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Intelligence & Diagnostics Log (F2.1 & F2.2) */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          INTELLIGENCE & DIAGNOSTICS
        </AppText>
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          {/* Learned Merchant Rules */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsLearnedRulesVisible(true)}
            style={styles.menuRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.iconWrapSm,
                  { backgroundColor: `${colors.primary}15`, borderRadius: radius.md },
                ]}
              >
                <Feather name="book-open" size={16} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText variant="subtitle2" weight="600">
                  Learned Merchant Rules
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Automatic category overrides from your corrections
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surfaceVariant, borderRadius: radius.full },
                ]}
              >
                <AppText variant="caption" weight="700" color={colors.primary}>
                  {learnedRules.length} rules
                </AppText>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Diagnostics Log */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('DetectionDiagnostics')}
            style={styles.menuRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.iconWrapSm,
                  { backgroundColor: `${colors.info || '#2563EB'}15`, borderRadius: radius.md },
                ]}
              >
                <Feather name="activity" size={16} color={colors.info || '#2563EB'} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText variant="subtitle2" weight="600">
                  Detection Diagnostics Log
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Inspect raw notifications and parser filter events
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surfaceVariant, borderRadius: radius.full },
                ]}
              >
                <AppText variant="caption" weight="700" color={colors.textSecondary}>
                  {diagnostics.length} logs
                </AppText>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Default Account Mappings (F2.4) */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          DEFAULT ACCOUNT MAPPINGS
        </AppText>
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
            Choose which account payments from each provider are debited from by default:
          </AppText>

          {['Google Pay', 'PhonePe', 'Paytm', 'CRED', 'Bank UPI'].map((provider, idx, arr) => {
            const mappedAccountId = providerAccountMappings[provider];
            const currentAccount =
              accounts.find((a) => a.id === mappedAccountId) ||
              accounts.find((a) => a.type === 'bank') ||
              accounts[0];

            const handleCycleAccount = () => {
              if (accounts.length <= 1) return;
              const currentIndex = accounts.findIndex((a) => a.id === currentAccount?.id);
              const nextIndex = (currentIndex + 1) % accounts.length;
              const nextAccount = accounts[nextIndex];
              if (nextAccount) {
                handleSetAccountMapping(provider, nextAccount.id);
              }
            };

            return (
              <React.Fragment key={provider}>
                <View style={styles.mappingRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle2" weight="600">
                      {provider}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    onPress={handleCycleAccount}
                    style={[
                      styles.accountPickerPill,
                      {
                        backgroundColor: currentAccount ? `${currentAccount.color || colors.primary}18` : colors.surfaceVariant,
                        borderColor: currentAccount?.color || colors.primary,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Feather
                      name={currentAccount?.type === 'wallet' ? 'credit-card' : 'dollar-sign'}
                      size={12}
                      color={currentAccount?.color || colors.primary}
                    />
                    <AppText
                      variant="caption"
                      weight="700"
                      color={currentAccount?.color || colors.primary}
                      style={{ marginHorizontal: 6 }}
                    >
                      {currentAccount?.name || 'Primary Bank'}
                    </AppText>
                    {accounts.length > 1 && (
                      <Feather name="refresh-cw" size={10} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
                {idx < arr.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Supported Apps List */}
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
          SUPPORTED PAYMENT APPS
        </AppText>
        <View
          style={[
            styles.settingGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              ...shadows.soft,
            },
          ]}
        >
          {supportedApps.map((app, index) => (
            <React.Fragment key={app.packageName}>
              <View style={styles.appRow}>
                <View style={styles.appInfo}>
                  <Feather name="smartphone" size={16} color={colors.primary} />
                  <AppText variant="subtitle2" weight="600" style={{ marginLeft: 10 }}>
                    {app.displayName}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.supportedBadge,
                    { backgroundColor: colors.successLight, borderRadius: radius.full },
                  ]}
                >
                  <AppText variant="caption" color={colors.success} weight="700">
                    Active ✓
                  </AppText>
                </View>
              </View>
              {index < supportedApps.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Troubleshooting / OEM Restrictions (F2.1) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowOemGuide(!showOemGuide)}
          style={[
            styles.oemCard,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginTop: spacing.lg,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Feather name="info" size={18} color={colors.primary} />
            <AppText variant="subtitle2" weight="700" style={{ marginLeft: 8, flex: 1 }}>
              Background Reliability & OEM Guide
            </AppText>
            <Feather
              name={showOemGuide ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </View>

          {showOemGuide && (
            <View style={{ marginTop: spacing.sm }}>
              <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
                Indian smartphone vendors terminate background notification services to conserve battery. Select your device brand for exact setup instructions:
              </AppText>

              {/* Brand Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {(['xiaomi', 'samsung', 'oppo', 'vivo', 'oneplus'] as const).map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    onPress={() => setSelectedOemBrand(brand)}
                    style={[
                      styles.brandTab,
                      {
                        backgroundColor: selectedOemBrand === brand ? colors.primary : colors.surface,
                        borderColor: selectedOemBrand === brand ? colors.primary : colors.border,
                        borderRadius: radius.full,
                        marginRight: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight="700"
                      color={selectedOemBrand === brand ? '#FFF' : colors.textSecondary}
                    >
                      {brand === 'xiaomi'
                        ? 'Xiaomi / Redmi'
                        : brand === 'samsung'
                        ? 'Samsung'
                        : brand === 'oppo'
                        ? 'Oppo / Realme'
                        : brand === 'vivo'
                        ? 'Vivo / iQOO'
                        : 'OnePlus'}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Brand Specific Instructions */}
              <View
                style={[
                  styles.brandContent,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                  },
                ]}
              >
                {selectedOemBrand === 'xiaomi' && (
                  <AppText variant="caption" color={colors.textPrimary} style={{ lineHeight: 20 }}>
                    1. Open <AppText weight="700">Security App</AppText> → <AppText weight="700">Manage Apps</AppText> → PocketWise{'\n'}
                    2. Enable <AppText weight="700">Autostart</AppText>{'\n'}
                    3. Under Battery Saver, select <AppText weight="700">No Restrictions</AppText>{'\n'}
                    4. In Recent Apps screen, long press PocketWise and tap the <AppText weight="700">Lock</AppText> icon
                  </AppText>
                )}
                {selectedOemBrand === 'samsung' && (
                  <AppText variant="caption" color={colors.textPrimary} style={{ lineHeight: 20 }}>
                    1. Go to <AppText weight="700">Settings</AppText> → <AppText weight="700">Apps</AppText> → PocketWise{'\n'}
                    2. Tap <AppText weight="700">Battery</AppText> → Choose <AppText weight="700">Unrestricted</AppText>{'\n'}
                    3. Go to <AppText weight="700">Device Care</AppText> → <AppText weight="700">Battery</AppText> → Background Usage Limits{'\n'}
                    4. Add PocketWise to <AppText weight="700">Never Sleeping Apps</AppText>
                  </AppText>
                )}
                {selectedOemBrand === 'oppo' && (
                  <AppText variant="caption" color={colors.textPrimary} style={{ lineHeight: 20 }}>
                    1. Go to <AppText weight="700">Settings</AppText> → <AppText weight="700">App Management</AppText> → PocketWise{'\n'}
                    2. Tap <AppText weight="700">Battery Usage</AppText> → Allow <AppText weight="700">Background Activity</AppText>{'\n'}
                    3. Enable <AppText weight="700">Auto Launch</AppText> and <AppText weight="700">Secondary Launch</AppText>
                  </AppText>
                )}
                {selectedOemBrand === 'vivo' && (
                  <AppText variant="caption" color={colors.textPrimary} style={{ lineHeight: 20 }}>
                    1. Go to <AppText weight="700">Settings</AppText> → <AppText weight="700">Battery</AppText>{'\n'}
                    2. Tap <AppText weight="700">Background Power Consumption Management</AppText>{'\n'}
                    3. Find PocketWise → Choose <AppText weight="700">High Background Power Consumption</AppText>{'\n'}
                    4. Enable <AppText weight="700">Autostart</AppText> in iManager
                  </AppText>
                )}
                {selectedOemBrand === 'oneplus' && (
                  <AppText variant="caption" color={colors.textPrimary} style={{ lineHeight: 20 }}>
                    1. Go to <AppText weight="700">Settings</AppText> → <AppText weight="700">Battery</AppText> → <AppText weight="700">Battery Optimization</AppText>{'\n'}
                    2. Select PocketWise → Choose <AppText weight="700">Don't Optimize</AppText>{'\n'}
                    3. Go to <AppText weight="700">App Management</AppText> → PocketWise → Enable <AppText weight="700">Auto-Launch</AppText>
                  </AppText>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Test Notification Action */}
        <View style={{ marginTop: spacing.xl }}>
          <AppButton
            title="Simulate Test UPI Payment"
            variant="outline"
            iconName="play-circle"
            onPress={handleRunSimulation}
            loading={isSimulating}
            fullWidth
          />
          <AppText variant="caption" color={colors.textMuted} align="center" style={{ marginTop: 6 }}>
            Triggers a sample ₹450 Google Pay payment to verify auto-detection
          </AppText>
        </View>
      </ScrollView>

      {/* Learned Rules Management Modal */}
      <ManageLearnedRulesModal
        visible={isLearnedRulesVisible}
        onClose={() => setIsLearnedRulesVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCard: {
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingGroup: {
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  oemCard: {
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  iconWrapSm: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  brandTab: {
    borderWidth: 1,
  },
  brandContent: {
    borderWidth: 1,
    marginTop: 6,
  },
});
