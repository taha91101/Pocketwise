import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  style,
}) => {
  const { colors, radius } = useTheme();

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const barColor = color || (clampedProgress >= 100 ? colors.error : clampedProgress >= 80 ? colors.warning : colors.primary);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceVariant,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            borderRadius: radius.full,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
