import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { SecurityService } from '../../services/securityService';
import { useAppStore } from '../../store/useAppStore';

interface PinLockScreenProps {
  onUnlockSuccess: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlockSuccess }) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const resetToDefaults = useAppStore((state) => state.resetToDefaults);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check biometric capability on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { hasHardware, isEnrolled } = await SecurityService.isBiometricAvailable();
      if (isMounted) {
        setIsBiometricSupported(hasHardware && isEnrolled);
        // If biometrics enabled, trigger automatically on launch
        if (settings.biometricEnabled && hasHardware && isEnrolled) {
          triggerBiometric();
        }
      }
    })();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining > 0) {
      timerRef.current = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutRemaining]);

  const triggerBiometric = async () => {
    if (lockoutRemaining > 0) return;
    const result = await SecurityService.authenticateBiometric('Unlock PocketWise');
    if (result.success) {
      onUnlockSuccess();
    }
  };

  const handleKeyPress = async (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      // Validate PIN
      const isValid = await SecurityService.verifyPin(newPin);
      if (isValid) {
        setFailedAttempts(0);
        onUnlockSuccess();
      } else {
        Vibration.vibrate(200);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        setPin('');

        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          setLockoutRemaining(LOCKOUT_SECONDS);
          setErrorMsg(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS}s`);
        } else {
          setErrorMsg(`Incorrect PIN. ${MAX_FAILED_ATTEMPTS - nextFailed} attempts remaining.`);
        }
      }
    }
  };

  const handleDelete = () => {
    if (lockoutRemaining > 0) return;
    if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'Because PocketWise is 100% offline and encrypted, your PIN cannot be retrieved. Resetting will erase all local financial transactions and return the app to a clean state.\n\nDo you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset App Data',
          style: 'destructive',
          onPress: async () => {
            await SecurityService.removePin();
            await resetToDefaults();
            await updateSettings({ securityEnabled: false, biometricEnabled: false });
            onUnlockSuccess();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header / Lock Brand */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primaryLight, borderRadius: radius.full },
          ]}
        >
          <Feather name="shield" size={36} color={colors.primary} />
        </View>

        <AppText variant="h2" weight="800" style={{ marginTop: spacing.lg }}>
          PocketWise Locked
        </AppText>
        <AppText
          variant="body2"
          color={colors.textSecondary}
          style={{ marginTop: spacing.xs, textAlign: 'center' }}
        >
          {lockoutRemaining > 0
            ? `Security cooldown: try again in ${lockoutRemaining}s`
            : 'Enter your 4-digit PIN to access your finances'}
        </AppText>

        {/* PIN Indicators */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isFilled ? colors.primary : colors.borderLight,
                    borderColor: isFilled ? colors.primary : colors.border,
                    transform: [{ scale: isFilled ? 1.15 : 1 }],
                  },
                ]}
              />
            );
          })}
        </View>

        {errorMsg ? (
          <AppText
            variant="caption"
            weight="700"
            color={colors.error}
            style={styles.errorText}
          >
            {errorMsg}
          </AppText>
        ) : null}
      </View>

      {/* Numeric Keypad */}
      <View style={[styles.keypad, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.row}>
          {['1', '2', '3'].map((n) => (
            <KeypadButton
              key={n}
              text={n}
              disabled={lockoutRemaining > 0}
              onPress={() => handleKeyPress(n)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {['4', '5', '6'].map((n) => (
            <KeypadButton
              key={n}
              text={n}
              disabled={lockoutRemaining > 0}
              onPress={() => handleKeyPress(n)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {['7', '8', '9'].map((n) => (
            <KeypadButton
              key={n}
              text={n}
              disabled={lockoutRemaining > 0}
              onPress={() => handleKeyPress(n)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {/* Biometrics or Empty */}
          {isBiometricSupported && settings.biometricEnabled ? (
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={lockoutRemaining > 0}
              onPress={triggerBiometric}
              style={[
                styles.keyButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="command" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.keyButtonInvisible} />
          )}

          <KeypadButton
            text="0"
            disabled={lockoutRemaining > 0}
            onPress={() => handleKeyPress('0')}
          />

          <TouchableOpacity
            activeOpacity={0.6}
            disabled={lockoutRemaining > 0 || pin.length === 0}
            onPress={handleDelete}
            style={[
              styles.keyButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather
              name="delete"
              size={22}
              color={pin.length > 0 ? colors.textPrimary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot PIN Action */}
      <View style={[styles.footer, { paddingBottom: spacing.lg }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPin}>
          <AppText variant="caption" color={colors.primary} weight="700">
            Forgot PIN?
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

interface KeypadButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ text, onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.keyButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <AppText variant="h2" weight="700">
        {text}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 10,
    borderWidth: 1.5,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 340,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyButtonInvisible: {
    width: 72,
    height: 72,
  },
  footer: {
    alignItems: 'center',
  },
});
