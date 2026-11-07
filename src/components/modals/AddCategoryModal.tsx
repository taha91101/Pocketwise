import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { useAppStore } from '../../store/useAppStore';
import { Category } from '../../types';

interface AddCategoryModalProps {
  visible: boolean;
  categoryToEdit?: Category | null;
  defaultType?: 'expense' | 'income' | 'both';
  onClose: () => void;
  onSuccess?: (createdCategory: Category) => void;
}

const AVAILABLE_ICONS: (keyof typeof Feather.glyphMap)[] = [
  'shopping-bag',
  'coffee',
  'film',
  'activity',
  'book',
  'briefcase',
  'camera',
  'gift',
  'heart',
  'home',
  'music',
  'package',
  'phone',
  'smile',
  'star',
  'tool',
  'truck',
  'tv',
  'umbrella',
  'wifi',
  'zap',
  'award',
];

const AVAILABLE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#0D9488', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
  '#78716C', // Stone
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  categoryToEdit,
  defaultType = 'expense',
  onClose,
  onSuccess,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const addCategory = useAppStore((state) => state.addCategory);
  const updateCategory = useAppStore((state) => state.updateCategory);

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'both'>(defaultType);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<(typeof AVAILABLE_ICONS)[0]>('shopping-bag');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setType(categoryToEdit.type);
        setSelectedColor(categoryToEdit.color);
        setSelectedIcon(categoryToEdit.icon as any);
      } else {
        setName('');
        setType(defaultType);
        setSelectedColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
        setSelectedIcon(AVAILABLE_ICONS[0]);
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, categoryToEdit, defaultType]);

  const handleSave = async () => {
    setErrorMsg('');
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name: trimmed,
          type,
          color: selectedColor,
          icon: selectedIcon,
        });
        const updatedCat: Category = {
          ...categoryToEdit,
          name: trimmed,
          type,
          color: selectedColor,
          icon: selectedIcon,
        };
        if (onSuccess) onSuccess(updatedCat);
        onClose();
      } else {
        const created = await addCategory({
          name: trimmed,
          type,
          color: selectedColor,
          icon: selectedIcon,
        });
        if (onSuccess) onSuccess(created);
        onClose();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xxl,
                borderTopRightRadius: radius.xxl,
                ...shadows.elevated,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
              <View>
                <AppText variant="h3" weight="700">
                  {categoryToEdit ? 'Edit Category' : 'Create Custom Category'}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  Personalize your spending & income classification
                </AppText>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Preview Badge */}
              <View style={styles.previewContainer}>
                <CategoryIcon
                  iconName={selectedIcon}
                  color={selectedColor}
                  size={32}
                  containerSize={68}
                />
                <AppText variant="subtitle1" weight="700" style={{ marginTop: 10 }}>
                  {name.trim() || 'Category Name'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {type.toUpperCase()}
                </AppText>
              </View>

              {/* Name Input */}
              <View style={{ marginBottom: spacing.md }}>
                <AppInput
                  label="Category Name"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. Pet Care, Gaming, Side Hustle"
                  iconName="tag"
                />
              </View>

              {/* Type Switcher */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="subtitle2" weight="600" style={{ marginBottom: spacing.xs }}>
                  Category Type
                </AppText>
                <View style={[styles.typeRow, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
                  {(['expense', 'income', 'both'] as const).map((t) => {
                    const isSelected = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        activeOpacity={0.7}
                        onPress={() => setType(t)}
                        style={[
                          styles.typeBtn,
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderRadius: radius.md,
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          weight="700"
                          color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        >
                          {t.toUpperCase()}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Color Picker */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="subtitle2" weight="600" style={{ marginBottom: spacing.xs }}>
                  Select Color
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = selectedColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        activeOpacity={0.7}
                        onPress={() => setSelectedColor(c)}
                        style={[
                          styles.colorCircle,
                          {
                            backgroundColor: c,
                            borderColor: isSelected ? colors.textPrimary : 'transparent',
                            borderWidth: isSelected ? 2.5 : 0,
                          },
                        ]}
                      >
                        {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Icon Picker */}
              <View style={{ marginBottom: spacing.lg }}>
                <AppText variant="subtitle2" weight="600" style={{ marginBottom: spacing.xs }}>
                  Select Icon
                </AppText>
                <View style={styles.iconsGrid}>
                  {AVAILABLE_ICONS.map((ic) => {
                    const isSelected = selectedIcon === ic;
                    return (
                      <TouchableOpacity
                        key={ic}
                        activeOpacity={0.7}
                        onPress={() => setSelectedIcon(ic)}
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.md,
                          },
                        ]}
                      >
                        <Feather name={ic} size={20} color={isSelected ? colors.primary : colors.textPrimary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {errorMsg ? (
                <AppText
                  variant="caption"
                  color={colors.error}
                  weight="700"
                  style={{ marginBottom: spacing.md, textAlign: 'center' }}
                >
                  {errorMsg}
                </AppText>
              ) : null}

              {/* Submit */}
              <AppButton
                title={isSubmitting ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Create Category'}
                onPress={handleSave}
                fullWidth
                disabled={isSubmitting}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    padding: 6,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  typeRow: {
    flexDirection: 'row',
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

