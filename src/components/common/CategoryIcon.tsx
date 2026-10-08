import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface CategoryIconProps {
  iconName?: string;
  color?: string;
  size?: number;
  containerSize?: number;
  style?: ViewStyle;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'tag',
  color = '#0D9488',
  size = 18,
  containerSize = 42,
  style,
}) => {
  const { radius } = useTheme();

  // Safe mapping to valid Feather glyphs
  const getFeatherName = (name: string): keyof typeof Feather.glyphMap => {
    switch (name) {
      case 'utensils':
        return 'coffee';
      case 'dollar-sign':
        return 'dollar-sign';
      case 'briefcase':
        return 'briefcase';
      case 'shopping-bag':
        return 'shopping-bag';
      case 'shopping-cart':
        return 'shopping-cart';
      case 'truck':
        return 'navigation';
      case 'file-text':
        return 'file-text';
      case 'film':
        return 'film';
      case 'activity':
        return 'activity';
      case 'book':
        return 'book';
      case 'map-pin':
        return 'map-pin';
      case 'home':
        return 'home';
      case 'repeat':
        return 'repeat';
      case 'award':
        return 'award';
      case 'trending-up':
        return 'trending-up';
      case 'gift':
        return 'gift';
      case 'plus-circle':
        return 'plus-circle';
      case 'target':
        return 'target';
      case 'refresh-cw':
        return 'refresh-cw';
      case 'shield':
        return 'shield';
      case 'cpu':
        return 'cpu';
      case 'compass':
        return 'compass';
      case 'smartphone':
        return 'smartphone';
      case 'credit-card':
        return 'credit-card';
      case 'arrow-down-left':
        return 'arrow-down-left';
      case 'arrow-up-right':
        return 'arrow-up-right';
      default:
        return 'tag';
    }
  };

  const glyph = getFeatherName(iconName);

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: radius.md,
          backgroundColor: `${color}18`, // 10% opacity tint
        },
        style,
      ]}
    >
      <Feather name={glyph} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
