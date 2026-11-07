import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { CategoryIcon } from '../common/CategoryIcon';
import { Badge } from '../common/Badge';
import { AddCategoryModal } from './AddCategoryModal';
import { useAppStore } from '../../store/useAppStore';
import { Category } from '../../types';

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, spacing, radius } = useTheme();
  const categories = useAppStore((state) => state.categories);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const transactions = useAppStore((state) => state.transactions);

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'custom'>('all');
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'expense') return c.type === 'expense' || c.type === 'both';
    if (filterType === 'income') return c.type === 'income' || c.type === 'both';
    if (filterType === 'custom') return c.isCustom === true;
    return true;
  });

  const handleDeleteCategory = (cat: Category) => {
    if (!cat.isCustom) {
      Alert.alert('System Category', 'Default system categories cannot be deleted.');
      return;
    }

    const txCount = transactions.filter((t) => t.categoryId === cat.id).length;
    // Find a suitable fallback category
    const defaultFallback = categories.find((c) => c.id !== cat.id && !c.isCustom) || categories[0];

    Alert.alert(
      'Delete Category?',
      txCount > 0
        ? `This category has ${txCount} transaction(s). Deleting it will safely reassign them to "${defaultFallback.name}".`
        : `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Reassign',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id, defaultFallback.id);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="h3" weight="700">
            Manage Categories
          </AppText>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setCategoryToEdit(null);
              setIsAddModalOpen(true);
            }}
            style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.full }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterRow, { paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
          {(['all', 'expense', 'income', 'custom'] as const).map((tab) => {
            const isSelected = filterType === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                onPress={() => setFilterType(tab)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="700"
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'expense'
                    ? 'Expense'
                    : tab === 'income'
                    ? 'Income'
                    : 'Custom'}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Categories List */}
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const txCount = transactions.filter((t) => t.categoryId === item.id).length;
            return (
              <View
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.xl,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <CategoryIcon iconName={item.icon} color={item.color} size={20} containerSize={44} />
                  <View style={{ marginLeft: spacing.md, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AppText variant="subtitle2" weight="700">
                        {item.name}
                      </AppText>
                      {item.isCustom ? (
                        <View style={{ marginLeft: 6 }}>
                          <Badge label="Custom" variant="info" />
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {item.type.toUpperCase()} • {txCount} transaction{txCount === 1 ? '' : 's'}
                    </AppText>
                  </View>
                </View>

                {/* Edit / Delete Actions */}
                {item.isCustom ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => {
                        setCategoryToEdit(item);
                        setIsAddModalOpen(true);
                      }}
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant, borderRadius: radius.md }]}
                    >
                      <Feather name="edit-2" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleDeleteCategory(item)}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderRadius: radius.md,
                          marginLeft: 6,
                        },
                      ]}
                    >
                      <Feather name="trash-2" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
        />

        {/* Add/Edit Modal */}
        <AddCategoryModal
          visible={isAddModalOpen}
          categoryToEdit={categoryToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setCategoryToEdit(null);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  addBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
