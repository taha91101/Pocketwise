import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { SecurityService } from '../../services/securityService';
import { useAppStore } from '../../store/useAppStore';

export type PinModalMode = 'setup' | 'change' | 'disable';

interface SetPinModalProps {
  visible: boolean;
  mode: PinModalMode;
  onClose: () => void;
  onComplete?: () => void;
}

export const SetPinModal: React.FC<SetPinModalProps> = ({
  visible,
  mode,
  onClose,
  onComplete,
}) => {
  const { colors, spacing, radius } = useTheme();
  const updateSettings = useAppStore((state) => state.updateSettings);

  // States
  // step: 0 = verify current, 1 = enter new, 2 = confirm new
  const [step, setStep] = useState<number>(mode === 'change' || mode === 'disable' ? 0 : 1);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setStep(mode === 'change' || mode === 'disable' ? 0 : 1);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorMsg('');
    }
  }, [visible, mode]);

  const activeValue = step === 0 ? currentPin : step === 1 ? newPin : confirmPin;

  const getStepTitle = () => {
    if (step === 0) return 'Enter Current PIN';
    if (step === 1) return mode === 'change' ? 'Enter New PIN' : 'Create 4-Digit PIN';
    return 'Confirm Your PIN';
  };

  const getStepSubtitle = () => {
    if (step === 0) return 'Verify your identity to proceed';
    if (step === 1) return 'Choose a secure 4-digit code';
    return 'Re-enter your code to confirm';
  };

  const handleKeyPress = async (digit: string) => {
    if (activeValue.length >= 4) return;
    const nextVal = activeValue + digit;
    setErrorMsg('');

    if (step === 0) {
      setCurrentPin(nextVal);
      if (nextVal.length === 4) {
        const isValid = await SecurityService.verifyPin(nextVal);
        if (isValid) {
          if (mode === 'disable') {
            await SecurityService.removePin();
            await updateSettings({ securityEnabled: false, biometricEnabled: false });
            if (onComplete) onComplete();
            onClose();
          } else {
            setStep(1);
          }
        } else {
          Vibration.vibrate(200);
          setErrorMsg('Incorrect PIN. Please try again.');
          setCurrentPin('');
        }
      }
    } else if (step === 1) {
      setNewPin(nextVal);
      if (nextVal.length === 4) {
        setStep(2);
      }
    } else if (step === 2) {
      setConfirmPin(nextVal);
      if (nextVal.length === 4) {
        if (nextVal === newPin) {
          // Success! Save PIN
          const saved = await SecurityService.savePin(nextVal);
          if (saved) {
            await updateSettings({ securityEnabled: true });
            if (onComplete) onComplete();
            onClose();
          } else {
            setErrorMsg('Failed to securely save PIN. Please retry.');
            setStep(1);
            setNewPin('');
            setConfirmPin('');
          }
        } else {
          Vibration.vibrate(200);
          setErrorMsg('PINs do not match. Please try again.');
          setStep(1);
          setNewPin('');
          setConfirmPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (step === 0) {
      setCurrentPin((prev) => prev.slice(0, -1));
    } else if (step === 1) {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Bar with Cancel */}
        <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="subtitle1" weight="700">
            {mode === 'setup' ? 'Set PIN Lock' : mode === 'change' ? 'Change PIN' : 'Disable PIN'}
          </AppText>
          <View style={{ width: 24 }} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primaryLight, borderRadius: radius.full },
            ]}
          >
            <Feather name="lock" size={32} color={colors.primary} />
          </View>
          <AppText variant="h2" weight="800" style={{ marginTop: spacing.md }}>
            {getStepTitle()}
          </AppText>
          <AppText
            variant="body2"
            color={colors.textSecondary}
            style={{ marginTop: spacing.xs, textAlign: 'center' }}
          >
            {getStepSubtitle()}
          </AppText>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = activeValue.length > index;
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
              <KeypadButton key={n} text={n} onPress={() => handleKeyPress(n)} />
            ))}
          </View>
          <View style={styles.row}>
            {['4', '5', '6'].map((n) => (
              <KeypadButton key={n} text={n} onPress={() => handleKeyPress(n)} />
            ))}
          </View>
          <View style={styles.row}>
            {['7', '8', '9'].map((n) => (
              <KeypadButton key={n} text={n} onPress={() => handleKeyPress(n)} />
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.keyButtonInvisible} />
            <KeypadButton text="0" onPress={() => handleKeyPress('0')} />
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={activeValue.length === 0}
              onPress={handleDelete}
              style={[
                styles.keyButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather
                name="delete"
                size={22}
                color={activeValue.length > 0 ? colors.textPrimary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </SafeAreaView>
    </Modal>
  );
};

const KeypadButton: React.FC<{ text: string; onPress: () => void }> = ({ text, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={[
        styles.keyButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
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
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 8,
    borderWidth: 1.5,
  },
  errorText: {
    marginTop: 14,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyButtonInvisible: {
    width: 70,
    height: 70,
  },
});
