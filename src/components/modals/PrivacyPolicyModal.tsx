import React from 'react';
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
import { Feather } from '@expo/vector-icons';

export interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
                Privacy & Data Safety
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                PocketWise Privacy by Architecture Promise
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
              accessibilityRole="button"
              accessibilityLabel="Close privacy policy"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Highlights Card */}
            <View
              style={[
                styles.highlightCard,
                { backgroundColor: colors.primaryLight + '15', borderColor: colors.primary, borderRadius: radius.lg },
              ]}
            >
              <Feather name="shield" size={28} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <AppText variant="subtitle1" weight="bold" color={colors.primary}>
                  100% Offline & On-Device
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  Your financial data never touches external cloud servers or third-party analytics trackers.
                </AppText>
              </View>
            </View>

            {/* Principle 1 */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Feather name="lock" size={16} color={colors.primary} />
                <AppText variant="subtitle2" weight="bold" color={colors.textPrimary} style={{ marginLeft: 6 }}>
                  1. Zero Cloud Transmission
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={styles.sectionBody}>
                PocketWise has no server backend, no user accounts, and no advertising IDs. All ledgers, accounts, debt tracking, and budgets are kept exclusively on this device.
              </AppText>
            </View>

            {/* Principle 2 */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Feather name="bell" size={16} color={colors.primary} />
                <AppText variant="subtitle2" weight="bold" color={colors.textPrimary} style={{ marginLeft: 6 }}>
                  2. Android Notification Access Rationale
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={styles.sectionBody}>
                We request notification listener permission strictly to identify incoming transaction confirmation alerts from supported UPI apps (e.g. Google Pay, PhonePe, Paytm, CRED, and Indian bank apps).
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={[styles.sectionBody, { marginTop: 6 }]}>
                • All non-financial notifications are filtered out immediately in memory.{'\n'}
                • One-Time Passwords (OTPs), authentication codes, and personal chat messages are discarded without parsing.{'\n'}
                • You can revoke this permission at any moment in Android System Settings.
              </AppText>
            </View>

            {/* Principle 3 */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Feather name="file-text" size={16} color={colors.primary} />
                <AppText variant="subtitle2" weight="bold" color={colors.textPrimary} style={{ marginLeft: 6 }}>
                  3. Encrypted Backups & Security
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={styles.sectionBody}>
                When you export a backup archive, you can encrypt it with military-grade AES-GCM-256 and PBKDF2-SHA256 password protection. App PIN locks are secured in hardware-backed storage with salted SHA-256 hashes.
              </AppText>
            </View>

            {/* Principle 4 */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Feather name="trash-2" size={16} color={colors.error} />
                <AppText variant="subtitle2" weight="bold" color={colors.error} style={{ marginLeft: 6 }}>
                  4. Complete Data Deletion Rights
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={styles.sectionBody}>
                You retain complete control of your data. Tapping "Reset All Data to Factory Defaults" in the Profile settings immediately and permanently wipes all database files and caches from this device.
              </AppText>
            </View>

            <AppButton
              title="I Understand"
              variant="primary"
              onPress={onClose}
              style={{ marginTop: spacing.md }}
            />
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
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionBody: {
    lineHeight: 18,
  },
});

