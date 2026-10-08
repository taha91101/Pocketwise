import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Feather } from '@expo/vector-icons';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.backdrop,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderRadius: radius.xxl,
              padding: spacing.xl,
              maxWidth: Math.min(width - 32, 400),
              maxHeight: height * 0.85,
              ...shadows.elevated,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDestructive ? colors.errorLight : colors.primaryLight,
                borderRadius: radius.full,
              },
            ]}
          >
            <Feather
              name={isDestructive ? 'alert-triangle' : 'help-circle'}
              size={28}
              color={isDestructive ? colors.error : colors.primary}
            />
          </View>
          <AppText variant="h3" align="center" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
            {title}
          </AppText>
          <AppText
            variant="body2"
            color={colors.textSecondary}
            align="center"
            style={{ marginBottom: spacing.xl }}
          >
            {message}
          </AppText>
          <View style={styles.buttonRow}>
            <AppButton
              title={cancelText}
              variant="outline"
              size="md"
              onPress={onCancel}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <AppButton
              title={confirmText}
              variant={isDestructive ? 'danger' : 'primary'}
              size="md"
              onPress={onConfirm}
              style={{ flex: 1, marginLeft: spacing.sm }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
