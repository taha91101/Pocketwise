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

export interface AutomaticDetectionSettingsScreenProps {
  navigation: any;
}

export const AutomaticDetectionSettingsScreen: React.FC<AutomaticDetectionSettingsScreenProps> = ({
  navigation,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const isNotificationAccessGranted = useAppStore((state) => state.isNotificationAccessGranted);
  const checkNotificationAccessStatus = useAppStore((state) => state.checkNotificationAccessStatus);
  const processIncomingDetectedTransaction = useAppStore(
    (state) => state.processIncomingDetectedTransaction
  );

  const [supportedApps, setSupportedApps] = useState<SupportedPaymentApp[]>(DEFAULT_SUPPORTED_APPS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showOemGuide, setShowOemGuide] = useState(false);

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

        {/* Troubleshooting / OEM Restrictions */}
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
              Background Reliability & OEM Tips
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
                Android phone manufacturers (Xiaomi/Redmi, Vivo, Oppo, Samsung) aggressively terminate background services. To ensure 100% reliable detection:
              </AppText>
              <AppText variant="caption" color={colors.textPrimary} style={{ marginTop: 6, lineHeight: 18 }}>
                • Disable "Battery Saver / Battery Optimization" for PocketWise in Android Settings.{'\n'}
                • Enable "Autostart" or "Background App Activity" in your phone's security manager.{'\n'}
                • Lock PocketWise in the recent apps tray if needed on MIUI/ColorOS.
              </AppText>
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
});
