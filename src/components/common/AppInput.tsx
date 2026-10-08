import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Feather } from '@expo/vector-icons';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconName?: keyof typeof Feather.glyphMap;
  rightIconName?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  prefix?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  iconName,
  rightIconName,
  onRightIconPress,
  prefix,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors, radius, spacing, typography: typ } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      )}
      <View style={containerStyle}>
        {iconName && (
          <Feather
            name={iconName}
            size={18}
            color={isFocused ? colors.primary : colors.textMuted}
            style={{ marginRight: spacing.sm }}
          />
        )}
        {prefix && (
          <AppText variant="subtitle1" color={colors.textPrimary} style={{ marginRight: spacing.xs }}>
            {prefix}
          </AppText>
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typ.body1,
            { color: colors.textPrimary },
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightIconName && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Feather name={rightIconName} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xxs }}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
});
